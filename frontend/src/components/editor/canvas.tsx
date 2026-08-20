import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Connection,
  type NodeMouseHandler,
  type Viewport,
} from '@xyflow/react';
import type { DiagramNode } from '@/types';
import { useEditorStore, useEditorUi } from '@/store/editor-store';
import { RelationshipEdge, UmlMarkerDefs } from '@/lib/editor/edge-types';
import { EDITOR_NODE_TYPES } from './nodes';
import { cn } from '@/lib/cn';

const GRID_SIZE = 24;

const MINIMAP_COLORS: Record<string, string> = {
  classNode: '#1e293b',
  interfaceNode: '#6366f1',
  abstractClassNode: '#4f46e5',
  objectNode: '#7c3aed',
  actorNode: '#94a3b8',
  useCaseNode: '#818cf8',
  packageNode: '#f59e0b',
  systemBoundaryNode: '#f59e0b',
  componentNode: '#0ea5e9',
  umlNode: '#64748b',
  noteNode: '#facc15',
  databaseNode: '#10b981',
  entityNode: '#10b981',
  circleNode: '#64748b',
  rectangleNode: '#94a3b8',
  textNode: '#cbd5e1',
};

export function EditorCanvas({
  onViewportChange,
  outerRef,
}: {
  onViewportChange?: (viewport: Viewport) => void;
  outerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const diagramId = useEditorStore((s) => s.diagramId);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const showGrid = useEditorStore((s) => s.showGrid);
  const canvasBackground = useEditorStore((s) => s.canvasBackground);

  const applyNodeChanges = useEditorStore((s) => s.applyNodeChanges);
  const applyEdgeChanges = useEditorStore((s) => s.applyEdgeChanges);
  const beginDrag = useEditorStore((s) => s.beginDrag);
  const addNode = useEditorStore((s) => s.addNode);
  const onConnect = useEditorStore((s) => s.onConnect);
  const deleteNodes = useEditorStore((s) => s.deleteNodes);
  const deleteEdges = useEditorStore((s) => s.deleteEdges);

  const pendingRelationship = useEditorUi((s) => s.pendingRelationship);
  const addAtCenter = useEditorUi((s) => s.addAtCenter);
  const setPendingRelationship = useEditorUi((s) => s.setPendingRelationship);

  const { screenToFlowPosition, fitView } = useReactFlow();
  const dropRef = useRef<HTMLDivElement>(null);

  const nodeTypes = useMemo(() => EDITOR_NODE_TYPES, []);
  const edgeTypes = useMemo(() => ({ 'uml-edge': RelationshipEdge }), []);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'uml-edge',
      data: { relationship: pendingRelationship ?? 'association' },
    }),
    [pendingRelationship],
  );

  /* Add a node at the center of the viewport (shape library click). */
  useEffect(() => {
    if (!addAtCenter) return;
    const el = dropRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pos = screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    addNode(addAtCenter.type, pos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addAtCenter]);

  /* Fit view after a fresh diagram is loaded. */
  useEffect(() => {
    requestAnimationFrame(() => {
      fitView({ padding: 0.2, maxZoom: 1.1, duration: 200 });
    });
  }, [diagramId, fitView]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection, pendingRelationship ?? 'association');
      setPendingRelationship(null);
    },
    [onConnect, pendingRelationship, setPendingRelationship],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData('application/umlforge');
      if (!raw) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(raw, position);
    },
    [addNode, screenToFlowPosition],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNodeDragStart = useCallback(() => beginDrag(), [beginDrag]);

  const handleNodeDoubleClick: NodeMouseHandler = useCallback(() => {
    /* inline editing is handled inside each node component */
  }, []);

  const handleViewportChange = useCallback(
    (_event: MouseEvent | TouchEvent, viewport: Viewport) => onViewportChange?.(viewport),
    [onViewportChange],
  );

  const nodeColor = useCallback((node: { type?: string }) => MINIMAP_COLORS[node.type ?? ''] ?? '#94a3b8', []);

  return (
    <div
      ref={dropRef}
      className={cn('h-full w-full transition-colors duration-200')}
      style={{ background: canvasBackground }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        key={diagramId}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={applyNodeChanges}
        onEdgesChange={applyEdgeChanges}
        onConnect={handleConnect}
        onNodeDragStart={handleNodeDragStart}
        onNodesDelete={deleteNodes}
        onEdgesDelete={deleteEdges}
        onNodeDoubleClick={handleNodeDoubleClick}
        onMove={handleViewportChange}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid={snapToGrid}
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }}
        minZoom={0.1}
        maxZoom={2.5}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Shift', 'Meta']}
        selectionKeyCode="Shift"
        selectionOnDrag
        panOnDrag={[1, 2]}
        panActivationKeyCode="Space"
        panOnScroll
        zoomOnDoubleClick={false}
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 1.5 }}
        connectionRadius={30}
        proOptions={{ hideAttribution: true }}
      >
        {showGrid && (
          <Background
            variant={BackgroundVariant.Lines}
            gap={GRID_SIZE}
            size={1}
            color="#e2e8f0"
          />
        )}
        <UmlMarkerDefs />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(248, 250, 252, 0.72)"
          pannable
          zoomable
          className="!bottom-16 !left-3 !m-0 !h-32 !w-44"
        />
        <Controls position="bottom-left" showInteractive={false} className="!bottom-3 !left-3" />
        <ConnectionHint />
      </ReactFlow>
    </div>
  );
}

function ConnectionHint() {
  const pending = useEditorUi((s) => s.pendingRelationship);
  const setPendingRelationship = useEditorUi((s) => s.setPendingRelationship);
  if (!pending) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 shadow-lift">
        <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
        <span className="text-xs font-medium text-indigo-700">
          Connecting with <span className="font-semibold capitalize">{pending.replace('-', ' ')}</span> — drag from a node handle
        </span>
        <button
          type="button"
          onClick={() => setPendingRelationship(null)}
          className="rounded-full px-1 text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
          aria-label="Cancel connection mode"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export const MemoCanvas = memo(EditorCanvas);