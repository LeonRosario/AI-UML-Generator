import { create } from 'zustand';
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import type { Diagram, DiagramNode, DiagramType, GanttChart, DiagramLayer, EditorPreferences } from '@/types';
import { createBlankDiagram } from '@/lib/editor/diagram-utils';
import { autoLayout, type LayoutMode } from '@/lib/editor/layout-utils';
import { validateGantt } from '@/lib/editor/gantt';
import { createUmlNode, type RelationshipType } from '@/lib/editor/node-types';

export const THEMES = {
  classic: { fill: '#ffffff', borderColor: '#334155', textColor: '#0f172a', background: '#f8fafc' },
  ocean: { fill: '#e0f2fe', borderColor: '#0369a1', textColor: '#0c4a6e', background: '#f0f9ff' },
  forest: { fill: '#dcfce7', borderColor: '#15803d', textColor: '#14532d', background: '#f0fdf4' },
  midnight: { fill: '#1e293b', borderColor: '#94a3b8', textColor: '#f8fafc', background: '#0f172a' },
};
export const DEFAULT_PREFS: EditorPreferences = { canvasBackground: '#f8fafc', showGrid: true, snapToGrid: true, smartGuides: true, routing: 'elbow', theme: 'classic' };
export const DEFAULT_LAYERS: DiagramLayer[] = [{ id: 'default', name: 'Main', visible: true, locked: false }];
export function editable(state: { layers: DiagramLayer[] }, node: DiagramNode) {
  const layer = state.layers.find(l => l.id === (node.data.layerId ?? 'default'));
  return !node.hidden && (!layer || (layer.visible && !layer.locked));
}
function copyGraph(state: EditorState) {
  const nodes = state.nodes.filter(n => n.selected && editable(state, n));
  const ids = new Set(nodes.map(n => n.id));
  return structuredClone({ nodes, edges: state.edges.filter(e => ids.has(e.source) && ids.has(e.target)) });
}

 type Snapshot = EditorPreferences & {
  gantt?: GanttChart;
  layers: DiagramLayer[];
  nodes: Diagram['nodes'];
  edges: Diagram['edges'];
  name: string;
  type: DiagramType;
  canvasBackground: string;
  showGrid: boolean;
  snapToGrid: boolean;
};

type EditorState = Snapshot & {
  diagramId: string;
  createdAt: string;
  ownerId?: string;
  guides: { x?: number; y?: number };
  setGuides: (guides: { x?: number; y?: number }) => void;
  setGantt: (chart: GanttChart) => void;
  copySelected: () => void;
  paste: () => void;
  selectAll: () => void;
  groupSelected: (ungroup?: boolean) => void;
  resizeSelected: (factor: number) => void;
  setLayers: (layers: DiagramLayer[]) => void;
  assignLayer: (id: string) => void;
  applyTheme: (theme: EditorPreferences['theme']) => void;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  past: Snapshot[];
  future: Snapshot[];
  setName: (name: string) => void;
  setType: (type: DiagramType) => void;
  setPrefs: (prefs: Partial<EditorPreferences>) => void;
  applyNodeChanges: (changes: NodeChange<DiagramNode>[]) => void;
  applyEdgeChanges: (changes: EdgeChange[]) => void;
  beginDrag: () => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  onConnect: (connection: Connection, relationship: RelationshipType) => void;
  deleteNodes: (nodes: DiagramNode[]) => void;
  deleteEdges: (edges: Edge[]) => void;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodeStyle: (id: string, patch: Record<string, unknown>) => void;
  updateEdge: (id: string, patch: Partial<Edge>) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  replaceAll: (nodes: DiagramNode[], edges: Edge[]) => void;
  applyAutoLayout: (mode: LayoutMode) => void;
  undo: () => void;
  redo: () => void;
  loadDiagram: (diagram: Diagram) => void;
  applyDiagram: (diagram: Diagram) => void;
  toDiagram: () => Diagram;
};

type UiState = {
  pendingRelationship: RelationshipType | null;
  addAtCenter: { type: string; nonce: number } | null;
  setPendingRelationship: (relationship: RelationshipType | null) => void;
  requestAddAtCenter: (type: string) => void;
};

const MAX_HISTORY = 80;
const initialDiagram = createBlankDiagram();

function snapshot(state: Pick<EditorState, keyof Snapshot>): Snapshot {
  return {
    gantt: state.gantt,
    layers: state.layers,
    smartGuides: state.smartGuides,
    routing: state.routing,
    theme: state.theme,
    nodes: state.nodes,
    edges: state.edges,
    name: state.name,
    type: state.type,
    canvasBackground: state.canvasBackground,
    showGrid: state.showGrid,
    snapToGrid: state.snapToGrid,
  };
}

function withHistory(state: EditorState, next: Snapshot): Snapshot & Pick<EditorState, 'past' | 'future'> {
  return {
    ...next,
    past: [...state.past, snapshot(state)].slice(-MAX_HISTORY),
    future: [],
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  ...DEFAULT_PREFS,
  layers: DEFAULT_LAYERS,
  createdAt: initialDiagram.createdAt,
  guides: {},
  setGuides: (guides) => set({ guides }),
  diagramId: initialDiagram.id,
  nodes: initialDiagram.nodes,
  edges: initialDiagram.edges,
  name: initialDiagram.name,
  type: initialDiagram.type,
  canvasBackground: '#f8fafc',
  showGrid: true,
  snapToGrid: true,
  selectedNodeId: null,
  selectedEdgeId: null,
  past: [],
  future: [],
  setName: (name) => set((state) => ({ ...withHistory(state, { ...snapshot(state), name }), name })),
  setType: (type) => set((state) => ({ ...withHistory(state, { ...snapshot(state), type }), type })),
  setPrefs: (prefs) => set((state) => ({ ...withHistory(state, { ...snapshot(state), ...prefs }), ...prefs })),
  applyNodeChanges: (changes) => set(state => {
    const expanded = [...changes];
    changes.forEach(c => {
      if (c.type !== 'select') return;
      const group = state.nodes.find(n => n.id === c.id)?.data.groupId;
      if (group) state.nodes.filter(n => n.data.groupId === group && n.id !== c.id && editable(state, n)).forEach(n => expanded.push({ type: 'select', id: n.id, selected: c.selected }));
    });
    return { nodes: applyNodeChanges(expanded, state.nodes) as DiagramNode[] };
  }),
  applyEdgeChanges: (changes) => set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
  beginDrag: () => set(state => withHistory(state, snapshot(state))),
  addNode: (type, position) => set(state => {
    const layer = state.layers.find(l => l.visible && !l.locked);
    if (!layer || state.type === 'gantt') return state;
    const node = createUmlNode(type, position, { ...THEMES[state.theme], layerId: layer.id });
    node.position = state.snapToGrid ? { x: Math.round(position.x / 24) * 24, y: Math.round(position.y / 24) * 24 } : position;
    node.selected = true;
    return { ...withHistory(state, { ...snapshot(state), nodes: [...state.nodes.map(n => ({ ...n, selected: false })), node], edges: state.edges.map(e => ({ ...e, selected: false })) }), selectedNodeId: node.id, selectedEdgeId: null };
  }),
  onConnect: (connection, relationship) => set((state) => ({ ...withHistory(state, { ...snapshot(state), edges: [...state.edges, { ...connection, id: crypto.randomUUID(), type: 'uml-edge', data: { relationship, routing: state.routing, color: THEMES[state.theme].borderColor } }] }) })),
  deleteNodes: (nodes) => set((state) => {
    const ids = new Set(nodes.map((node) => node.id));
    return { ...withHistory(state, { ...snapshot(state), nodes: state.nodes.filter((node) => !ids.has(node.id)), edges: state.edges.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target)) }) };
  }),
  deleteEdges: (edges) => set((state) => {
    const ids = new Set(edges.map((edge) => edge.id));
    return { ...withHistory(state, { ...snapshot(state), edges: state.edges.filter((edge) => !ids.has(edge.id)) }) };
  }),
  updateNodeData: (id, patch) => set((state) => ({ ...withHistory(state, { ...snapshot(state), nodes: state.nodes.map((node) => node.id === id && editable(state, node) ? { ...node, data: { ...node.data, ...patch } } : node) }) })),
  updateNodePosition: (id, position) => set((state) => ({ ...withHistory(state, { ...snapshot(state), nodes: state.nodes.map((node) => node.id === id && editable(state, node) ? { ...node, position } : node) }) })),
  updateNodeStyle: (id, patch) => set((state) => ({ ...withHistory(state, { ...snapshot(state), nodes: state.nodes.map((node) => node.id === id && editable(state, node) ? { ...node, style: { ...node.style, ...patch }, data: { ...node.data, ...patch } } : node) }) })),
  updateEdge: (id, patch) => set((state) => ({ ...withHistory(state, { ...snapshot(state), edges: state.edges.map((edge) => edge.id === id && [edge.source, edge.target].every(nodeId => state.nodes.some(n => n.id === nodeId && editable(state, n))) ? { ...edge, ...patch } : edge) }) })),
  deleteSelected: () => set((state) => {
    const nodeIds = new Set(state.nodes.filter((node) => node.selected && editable(state, node)).map((node) => node.id));
    const edgeIds = new Set(state.edges.filter((edge) => edge.selected && [edge.source, edge.target].every(id => state.nodes.some(n => n.id === id && editable(state, n)))).map((edge) => edge.id));
    return { ...withHistory(state, { ...snapshot(state), nodes: state.nodes.filter((node) => !nodeIds.has(node.id)), edges: state.edges.filter((edge) => !edgeIds.has(edge.id) && !nodeIds.has(edge.source) && !nodeIds.has(edge.target)) }) };
  }),
  copySelected: () => {
    const graph = copyGraph(get());
    if (graph.nodes.length) localStorage.setItem('umlforge:clipboard', JSON.stringify(graph));
  },
  paste: () => set(state => {
    const layer = state.layers.find(l => l.visible && !l.locked);
    if (!layer || state.type === 'gantt') return state;
    let graph: { nodes: DiagramNode[]; edges: Edge[] };
    try { graph = JSON.parse(localStorage.getItem('umlforge:clipboard') ?? 'null'); } catch { return state; }
    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return state;
    const ids = new Map(graph.nodes.map(n => [n.id, crypto.randomUUID()]));
    const groups = new Map(graph.nodes.filter(n => n.data.groupId).map(n => [n.data.groupId, crypto.randomUUID()]));
    const nodes = graph.nodes.map(n => ({ ...n, id: ids.get(n.id)!, selected: true, hidden: false, draggable: true, selectable: true,
      position: { x: n.position.x + 48, y: n.position.y + 48 }, data: { ...n.data, layerId: layer.id, groupId: groups.get(n.data.groupId) } }));
    const edges = graph.edges.filter(e => ids.has(e.source) && ids.has(e.target)).map(e => ({ ...e, id: crypto.randomUUID(), source: ids.get(e.source)!, target: ids.get(e.target)!, selected: false }));
    return withHistory(state, { ...snapshot(state), nodes: [...state.nodes.map(n => ({ ...n, selected: false })), ...nodes], edges: [...state.edges.map(e => ({ ...e, selected: false })), ...edges] });
  }),
  duplicateSelected: () => {
    const previous = localStorage.getItem('umlforge:clipboard');
    if (!copyGraph(get()).nodes.length) return;
    get().copySelected(); get().paste();
    if (previous) localStorage.setItem('umlforge:clipboard', previous); else localStorage.removeItem('umlforge:clipboard');
  },
  selectAll: () => set(state => ({ nodes: state.nodes.map(n => ({ ...n, selected: editable(state, n) })), edges: state.edges.map(e => ({ ...e, selected: !e.hidden && [e.source, e.target].every(id => state.nodes.some(n => n.id === id && editable(state, n))) })) })),
  groupSelected: (ungroup = false) => set(state => {
    const groupId = ungroup ? undefined : crypto.randomUUID();
    return withHistory(state, { ...snapshot(state), nodes: state.nodes.map(n => n.selected && editable(state, n) ? { ...n, data: { ...n.data, groupId } } : n) });
  }),
  resizeSelected: (factor) => set(state => {
    const selected = state.nodes.filter(n => n.selected && editable(state, n));
    if (!selected.length || !Number.isFinite(factor) || factor <= 0) return state;
    const x = Math.min(...selected.map(n => n.position.x)), y = Math.min(...selected.map(n => n.position.y));
    return withHistory(state, { ...snapshot(state), nodes: state.nodes.map(n => {
      if (!selected.includes(n)) return n;
      const scale = Number(n.data.scale ?? 1) * factor;
      if (scale < 0.1 || scale > 10) return n;
      return { ...n, position: { x: x + (n.position.x - x) * factor, y: y + (n.position.y - y) * factor },
        style: { ...n.style, width: (n.measured?.width ?? (Number(n.style?.width) || 160)) * factor, height: (n.measured?.height ?? (Number(n.style?.height) || 92)) * factor }, data: { ...n.data, scale } };
    }) });
  }),
  setLayers: (layers) => set(state => withHistory(state, { ...snapshot(state), layers, nodes: state.nodes.map(n => ({ ...n, selected: false })), edges: state.edges.map(e => ({ ...e, selected: false })) })),
  assignLayer: (id) => set(state => withHistory(state, { ...snapshot(state), nodes: state.nodes.map(n => n.selected && editable(state, n) ? { ...n, selected: false, data: { ...n.data, layerId: id } } : n) })),
  setGantt: (gantt) => set(state => withHistory(state, { ...snapshot(state), gantt: validateGantt(gantt) })),
  applyTheme: (theme) => set(state => {
    const palette = THEMES[theme];
    return withHistory(state, { ...snapshot(state), theme, canvasBackground: palette.background,
      nodes: state.nodes.map(n => ({ ...n, data: { ...n.data, fill: palette.fill, borderColor: palette.borderColor, textColor: palette.textColor } })),
      edges: state.edges.map(e => ({ ...e, data: { ...e.data, color: palette.borderColor } })) });
  }),
  replaceAll: (nodes, edges) => set((state) => ({ ...withHistory(state, { ...snapshot(state), nodes, edges }) })),
  applyAutoLayout: (mode) => set(state => {
    const unlocked = state.nodes.filter(n => editable(state, n));
    if (!unlocked.length) return state;
    const positions = autoLayout(unlocked, state.edges, mode);
    return withHistory(state, { ...snapshot(state), nodes: state.nodes.map(n => editable(state, n) ? { ...n, position: positions.get(n.id) ?? n.position } : n) });
  }),
  undo: () => set((state) => {
    const previous = state.past[state.past.length - 1];
    if (!previous) return state;
    return { ...previous, past: state.past.slice(0, -1), future: [snapshot(state), ...state.future] };
  }),
  redo: () => set((state) => {
    const next = state.future[0];
    if (!next) return state;
    return { ...next, past: [...state.past, snapshot(state)], future: state.future.slice(1) };
  }),
  applyDiagram: (diagram) => set(state => withHistory(state, { ...snapshot(state), name: diagram.name, type: diagram.type, nodes: diagram.nodes, edges: diagram.edges, gantt: diagram.gantt, layers: diagram.layers ?? DEFAULT_LAYERS, ...DEFAULT_PREFS, ...diagram.preferences })),
  loadDiagram: (diagram) => set({ ...diagram, gantt: diagram.gantt, layers: diagram.layers ?? DEFAULT_LAYERS, ...DEFAULT_PREFS, ...diagram.preferences, guides: {}, diagramId: diagram.id, selectedNodeId: null, selectedEdgeId: null, past: [], future: [] }),
  toDiagram: () => {
    const state = get();
    return { id: state.diagramId, name: state.name, type: state.type, nodes: state.nodes, edges: state.edges, gantt: state.gantt, layers: state.layers, preferences: { canvasBackground: state.canvasBackground, showGrid: state.showGrid, snapToGrid: state.snapToGrid, smartGuides: state.smartGuides, routing: state.routing, theme: state.theme }, createdAt: state.createdAt, ownerId: state.ownerId, updatedAt: new Date().toISOString() };
  },
}));

export const useEditorUi = create<UiState>((set) => ({
  pendingRelationship: null,
  addAtCenter: null,
  setPendingRelationship: (pendingRelationship) => set({ pendingRelationship }),
  requestAddAtCenter: (type) => set({ addAtCenter: { type, nonce: Date.now() } }),
}));
