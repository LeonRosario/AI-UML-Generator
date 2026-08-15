import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  NodeToolbar,
  Position,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type NodeMouseHandler,
  type OnConnect,
  type Viewport,
} from '@xyflow/react';
import type { DiagramNode } from '@/types';
import { ActorNode } from './nodes/ActorNode';
import { ClassNode } from './nodes/ClassNode';
import { UseCaseNode } from './nodes/UseCaseNode';
import { EntityNode } from './nodes/EntityNode';
import { GenericNode } from './nodes/GenericNode';

export type DiagramCanvasProps = {
  nodes: DiagramNode[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<DiagramNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onConnect?: OnConnect;
  onAddNode?: (nodeType: string, position: { x: number; y: number }) => void;
  onEditNode?: (id: string, label: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectNode?: (node: DiagramNode | null) => void;
  onViewportChange?: (viewport: Viewport) => void;
  onNodesDelete?: () => void;
  onEdgesDelete?: () => void;
  onNodeDragStop?: () => void;
  arrowEdges?: boolean;
  fitViewOnInit?: boolean;
};

// Grid constants for consistency and easier maintenance
const GRID_SIZE = 24;
const GRID_STEPS: [number, number] = [GRID_SIZE, GRID_SIZE];

export function DiagramCanvas({
  nodes,
  edges,
  setNodes,
  setEdges,
  onConnect,
  onAddNode,
  onEditNode,
  onUndo,
  onRedo,
  onSelectNode,
  onViewportChange,
  onNodesDelete,
  onEdgesDelete,
  onNodeDragStop,
  arrowEdges = true,
  fitViewOnInit = true,
}: DiagramCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Memoize nodeTypes to prevent unnecessary re-renders of node components
  const nodeTypes = useMemo(
    () => ({
      actorNode: ActorNode,
      classNode: ClassNode,
      useCaseNode: UseCaseNode,
      entityNode: EntityNode,
      genericNode: GenericNode,
    }),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (typing) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) onRedo?.();
        else onUndo?.();
      } else if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        onRedo?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onUndo, onRedo]);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      markerEnd: arrowEdges ? { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#3f4a5a' } : undefined,
      style: { stroke: '#3f4a5a', strokeWidth: 1.5 },
      labelStyle: { fill: '#334155', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    }),
    [arrowEdges],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<DiagramNode>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const handleConnect: OnConnect = useCallback(
    (conn: Connection) => onConnect?.(conn),
    [onConnect],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/umlforge');
      if (!type || !onAddNode) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onAddNode(type, position);
    },
    [onAddNode, screenToFlowPosition],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNodeDoubleClick: NodeMouseHandler = useCallback((_, node) => {
    if (node.type === 'genericNode') return;
    setEditing(node.id);
    setDraft(node.data.label as string);
    setTimeout(() => editInputRef.current?.select(), 0);
  }, []);

  const handleNodeClick: NodeMouseHandler = useCallback((_, node) => {
    if (editing !== null) {
      setEditing(null);
      const nodeLabel = nodes.find((n) => n.id === editing)?.data.label;
      if (draft.trim() && draft !== nodeLabel) onEditNode?.(editing, draft.trim());
    }
    onSelectNode?.(node as DiagramNode);
  }, [editing, draft, nodes, onEditNode, onSelectNode]);

  const selected = nodes.filter((n) => n.selected);
  const onPaneClick = useCallback(() => {
    if (editing !== null) {
      const nodeLabel = nodes.find((n) => n.id === editing)?.data.label;
      if (draft.trim() && draft !== nodeLabel) onEditNode?.(editing, draft.trim());
      setEditing(null);
    }
    onSelectNode?.(null);
  }, [editing, draft, nodes, onEditNode, onSelectNode]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onNodeClick={handleNodeClick}
      onNodeDoubleClick={handleNodeDoubleClick}
      onPaneClick={onPaneClick}
      onSelectionChange={(params) => {
        if (params.nodes.length === 1) onSelectNode?.(params.nodes[0] as DiagramNode);
      }}
      onMove={onViewportChange ? ((_, vp) => onViewportChange(vp)) : undefined}
      onNodesDelete={onNodesDelete}
      onEdgesDelete={onEdgesDelete}
      onNodeDragStop={onNodeDragStop}
      snapToGrid
      snapGrid={GRID_STEPS}
      fitView={fitViewOnInit}
      fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
      minZoom={0.15}
      maxZoom={2.5}
      deleteKeyCode={['Backspace', 'Delete']}
      multiSelectionKeyCode={['Shift', 'Meta']}
      selectionKeyCode="Shift"
      panOnScroll
      selectionOnDrag
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={defaultEdgeOptions}
    >
      <Background variant={BackgroundVariant.Lines} gap={24} size={1} color="#e2e8f0" />
      <MiniMap
        nodeColor={(n) => {
          switch ((n as DiagramNode).type) {
            case 'classNode':
              return '#1e293b';
            case 'useCaseNode':
              return '#818cf8';
            case 'entityNode':
              return '#334155';
            case 'actorNode':
              return '#e2e8f0';
            default:
              return '#94a3b8';
          }
        }}
        maskColor="rgba(248, 250, 252, 0.75)"
        pannable
        zoomable
      />
      <Controls showInteractive={false} />

      {selected.length === 1 && editing === selected[0].id && (
        <NodeToolbar nodeId={selected[0].id} offset={10} isVisible position={Position.Top} className="!bg-transparent !shadow-none !p-0">
          <input
            ref={editInputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (draft.trim()) onEditNode?.(selected[0].id, draft.trim());
                setEditing(null);
              }
              if (e.key === 'Escape') setEditing(null);
            }}
            onBlur={() => setEditing(null)}
            className="h-8 w-52 rounded-md border border-indigo-400 bg-white px-2.5 text-sm shadow-lift focus:outline-none"
            placeholder="Rename node"
          />
        </NodeToolbar>
      )}
    </ReactFlow>
  );
}
