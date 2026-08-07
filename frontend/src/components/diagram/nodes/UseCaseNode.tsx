import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';

function UseCaseNodeComponent({ data }: NodeProps<Node<DiagramNodeData>>) {
  const label = (data.label as string) ?? 'Use Case';
  return (
    <div className="uml-node flex items-center justify-center rounded-full border-[1.5px] border-slate-400 bg-white px-6 py-3.5 shadow-soft">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <span className="whitespace-nowrap text-[13px] font-medium text-slate-800">{label}</span>
    </div>
  );
}

export const UseCaseNode = memo(UseCaseNodeComponent);
