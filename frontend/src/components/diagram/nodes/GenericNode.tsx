import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';
import { cn } from '@/lib/cn';

function GenericNodeComponent({ data }: NodeProps<Node<DiagramNodeData>>) {
  const { label, variant = 'step' } = data as DiagramNodeData;

  if (variant === 'lifeline') {
    return (
      <div className="uml-node w-[150px] overflow-hidden rounded-md border border-slate-300 bg-white shadow-soft">
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
        <div className="border-b-2 border-slate-900 bg-white px-3 py-1.5 text-center text-[12px] font-medium text-slate-800">
          {label}
        </div>
        <div className="relative h-16 bg-white">
          <div className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-slate-300" />
          <Handle type="source" position={Position.Top} className="!opacity-0" />
          <Handle type="target" position={Position.Bottom} className="!opacity-0" />
        </div>
      </div>
    );
  }

  if (variant === 'decision') {
    return (
      <div className="uml-node relative h-[76px] w-[76px]">
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
        <Handle type="source" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
        <div className="absolute inset-0 rotate-45 rounded-md border-[1.5px] border-slate-400 bg-white shadow-soft" />
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-slate-700">
          {label}
        </div>
      </div>
    );
  }

  if (variant === 'start') {
    return (
      <div className="uml-node flex h-9 w-9 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-slate-800 bg-white" />
        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-medium text-slate-500">
          {label}
        </div>
        <Handle type="source" position={Position.Bottom} />
      </div>
    );
  }

  if (variant === 'end') {
    return (
      <div className="uml-node relative flex h-9 w-9 items-center justify-center">
        <div className="h-7 w-7 rounded-full bg-slate-800" />
        <Handle type="target" position={Position.Top} />
      </div>
    );
  }

  return (
    <div className="uml-node flex min-w-[150px] items-center justify-center rounded-md border-[1.5px] border-slate-400 bg-white px-5 py-2.5 shadow-soft">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <span className={cn('whitespace-nowrap text-[12px] font-medium text-slate-700')}>{label}</span>
    </div>
  );
}

export const GenericNode = memo(GenericNodeComponent);
