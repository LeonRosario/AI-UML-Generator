import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';

export function ActorFigure({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="4.5" r="3.2" fill="currentColor" />
      <path d="M12 8.5c-4.4 0-6.5 3.4-6.5 6.5 1.8-.4 3-1.2 3-3 0 1.8 1.6 3 3.5 3s3.5-1.2 3.5-3c0 1.8 1.2 2.6 3 3 0-3.1-2.1-6.5-6.5-6.5z" fill="currentColor" />
    </svg>
  );
}

function ActorNodeComponent({ data }: NodeProps<Node<DiagramNodeData>>) {
  const label = (data.label as string) ?? 'Actor';
  return (
    <div className="uml-node rounded-lg border border-slate-300 bg-white px-5 py-2.5 shadow-soft">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex flex-col items-center gap-1.5">
        <ActorFigure className="h-11 w-11 text-slate-700" />
        <span className="text-[13px] font-medium text-slate-800">{label}</span>
      </div>
    </div>
  );
}

export const ActorNode = memo(ActorNodeComponent);
