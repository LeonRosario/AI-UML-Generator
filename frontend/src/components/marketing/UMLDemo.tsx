import { useMemo } from 'react';
import { Background, BackgroundVariant, MarkerType, ReactFlow, type Edge } from '@xyflow/react';
import type { Diagram } from '@/types';
import { ActorNode } from '@/components/diagram/nodes/ActorNode';
import { ClassNode } from '@/components/diagram/nodes/ClassNode';
import { EntityNode } from '@/components/diagram/nodes/EntityNode';
import { GenericNode } from '@/components/diagram/nodes/GenericNode';
import { UseCaseNode } from '@/components/diagram/nodes/UseCaseNode';
import { cn } from '@/lib/cn';

const nodeTypes = {
  actorNode: ActorNode,
  classNode: ClassNode,
  useCaseNode: UseCaseNode,
  entityNode: EntityNode,
  genericNode: GenericNode,
};

export function UMLDemo({ diagram, className, animate = false }: { diagram: Diagram; className?: string; animate?: boolean }) {
  const edges = useMemo<Edge[]>(
    () =>
      diagram.edges.map((e) => ({
        ...e,
        animated: animate,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#64748b' },
        style: { stroke: '#64748b', strokeWidth: 1.4 },
      })),
    [diagram.edges, animate],
  );

  return (
    <div className={cn('h-full w-full', className)}>
      <ReactFlow
        nodes={diagram.nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        elementsSelectable
      >
        <Background variant={BackgroundVariant.Lines} gap={24} size={1} color="#e8ecf2" />
      </ReactFlow>
    </div>
  );
}