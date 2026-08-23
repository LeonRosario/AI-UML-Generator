import { create } from 'zustand';
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import type { Diagram, DiagramNode, DiagramType } from '@/types';
import { createBlankDiagram } from '@/lib/editor/diagram-utils';
import { autoLayout, type LayoutMode } from '@/lib/editor/layout-utils';
import { createUmlNode, type RelationshipType } from '@/lib/editor/node-types';

type Snapshot = {
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
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  past: Snapshot[];
  future: Snapshot[];
  setName: (name: string) => void;
  setType: (type: DiagramType) => void;
  setPrefs: (prefs: Partial<Pick<EditorState, 'canvasBackground' | 'showGrid' | 'snapToGrid'>>) => void;
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
    nodes: state.nodes,
    edges: state.edges,
    name: state.name,
    type: state.type,
    canvasBackground: state.canvasBackground,
    showGrid: state.showGrid,
    snapToGrid: state.snapToGrid,
  };
}

function withHistory(state: EditorState, next: Snapshot): Pick<EditorState, 'past' | 'future' | 'nodes' | 'edges' | 'name' | 'type' | 'canvasBackground' | 'showGrid' | 'snapToGrid'> {
  return {
    ...next,
    past: [...state.past, snapshot(state)].slice(-MAX_HISTORY),
    future: [],
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
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
  applyNodeChanges: (changes) => set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) as DiagramNode[] })),
  applyEdgeChanges: (changes) => set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
  beginDrag: () => undefined,
  addNode: (type, position) => set((state) => ({ ...withHistory(state, { ...snapshot(state), nodes: [...state.nodes, createUmlNode(type, position)] }) })),
  onConnect: (connection, relationship) => set((state) => ({ ...withHistory(state, { ...snapshot(state), edges: [...state.edges, { ...connection, id: `edge-${Date.now()}`, type: 'uml-edge', data: { relationship } }] }) })),
  deleteNodes: (nodes) => set((state) => {
    const ids = new Set(nodes.map((node) => node.id));
    return { ...withHistory(state, { ...snapshot(state), nodes: state.nodes.filter((node) => !ids.has(node.id)), edges: state.edges.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target)) }) };
  }),
  deleteEdges: (edges) => set((state) => {
    const ids = new Set(edges.map((edge) => edge.id));
    return { ...withHistory(state, { ...snapshot(state), edges: state.edges.filter((edge) => !ids.has(edge.id)) }) };
  }),
  updateNodeData: (id, patch) => set((state) => ({ ...withHistory(state, { ...snapshot(state), nodes: state.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, ...patch } } : node) }) })),
  updateNodePosition: (id, position) => set((state) => ({ ...withHistory(state, { ...snapshot(state), nodes: state.nodes.map((node) => node.id === id ? { ...node, position } : node) }) })),
  updateNodeStyle: (id, patch) => set((state) => ({ ...withHistory(state, { ...snapshot(state), nodes: state.nodes.map((node) => node.id === id ? { ...node, style: { ...node.style, ...patch }, data: { ...node.data, ...patch } } : node) }) })),
  updateEdge: (id, patch) => set((state) => ({ ...withHistory(state, { ...snapshot(state), edges: state.edges.map((edge) => edge.id === id ? { ...edge, ...patch } : edge) }) })),
  deleteSelected: () => set((state) => {
    const nodeIds = new Set(state.nodes.filter((node) => node.selected).map((node) => node.id));
    const edgeIds = new Set(state.edges.filter((edge) => edge.selected).map((edge) => edge.id));
    return { ...withHistory(state, { ...snapshot(state), nodes: state.nodes.filter((node) => !nodeIds.has(node.id)), edges: state.edges.filter((edge) => !edgeIds.has(edge.id) && !nodeIds.has(edge.source) && !nodeIds.has(edge.target)) }) };
  }),
  duplicateSelected: () => set((state) => {
    const selected = state.nodes.filter((node) => node.selected);
    const copies = selected.map((node) => ({ ...node, id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, position: { x: node.position.x + 48, y: node.position.y + 48 }, selected: false }));
    return { ...withHistory(state, { ...snapshot(state), nodes: [...state.nodes, ...copies] }) };
  }),
  replaceAll: (nodes, edges) => set((state) => ({ ...withHistory(state, { ...snapshot(state), nodes, edges }) })),
  applyAutoLayout: (mode) => set((state) => ({ ...withHistory(state, { ...snapshot(state), nodes: state.nodes.map((node) => ({ ...node, position: autoLayout(state.nodes, state.edges, mode).get(node.id) ?? node.position })) }) })),
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
  loadDiagram: (diagram) => set({ ...diagram, diagramId: diagram.id, canvasBackground: '#f8fafc', showGrid: true, snapToGrid: true, selectedNodeId: null, selectedEdgeId: null, past: [], future: [] }),
  toDiagram: () => {
    const state = get();
    return { id: state.diagramId, name: state.name, type: state.type, nodes: state.nodes, edges: state.edges, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  },
}));

export const useEditorUi = create<UiState>((set) => ({
  pendingRelationship: null,
  addAtCenter: null,
  setPendingRelationship: (pendingRelationship) => set({ pendingRelationship }),
  requestAddAtCenter: (type) => set({ addAtCenter: { type, nonce: Date.now() } }),
}));