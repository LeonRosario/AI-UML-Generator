import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';

const MAX_FIELDS = 12;

function EntityNodeComponent({ data }: NodeProps<Node<DiagramNodeData>>) {
  const { label, fields = [] } = data as DiagramNodeData;
  const shown = fields.length > MAX_FIELDS ? [...fields.slice(0, MAX_FIELDS - 1), `… +${fields.length - MAX_FIELDS + 1} more`] : fields;

  return (
    <div className="uml-node w-[220px] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-soft">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center gap-2 border-b border-slate-300 bg-slate-800 px-3 py-2">
        <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-indigo-300/50 bg-indigo-500/30 text-[8px] font-bold text-indigo-200">
          T
        </span>
        <div>
          <div className="text-[11px] font-medium text-indigo-300">&lt;&lt;table&gt;&gt;</div>
          <div className="text-[13px] font-semibold leading-tight text-white">{label}</div>
        </div>
      </div>

      {shown.length > 0 && (
        <div className="bg-white px-3 py-1.5">
          <ul className="space-y-0.5 font-mono text-[11px] leading-snug">
            {shown.map((f) => {
              const isKey = /\(pk\)|\(fk\)/i.test(f);
              return (
                <li key={f} className={`truncate ${isKey ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                  {isKey ? <span className="mr-1 text-amber-500">◈</span> : <span className="mr-1 text-slate-300">·</span>}
                  {f}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export const EntityNode = memo(EntityNodeComponent);
