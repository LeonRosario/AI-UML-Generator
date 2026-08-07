import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';

const MAX_ROWS = 12;

function truncate(rows: string[], max: number) {
  if (rows.length <= max) return rows;
  return [...rows.slice(0, max - 1), `… +${rows.length - max + 1} more`];
}

function ClassNodeComponent({ data }: NodeProps<Node<DiagramNodeData>>) {
  const { label, attributes = [], methods = [], stereotype } = data as DiagramNodeData;
  const attrs = truncate(attributes, MAX_ROWS);
  const mthds = truncate(methods, MAX_ROWS);

  return (
    <div className="uml-node w-[200px] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-soft">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="border-b border-slate-300 bg-slate-900 px-3 py-2 text-center">
        {stereotype && <div className="text-[10px] font-medium text-indigo-300">&lt;&lt;{stereotype}&gt;&gt;</div>}
        <div className="text-[13px] font-semibold text-white">{label}</div>
      </div>

      {attrs.length > 0 && (
        <div className="border-b border-slate-200 bg-white px-3 py-1.5">
          <ul className="space-y-0.5 font-mono text-[11px] leading-snug text-slate-600">
            {attrs.map((a) => (
              <li key={a} className="truncate">
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mthds.length > 0 && (
        <div className="bg-white px-3 py-1.5">
          <ul className="space-y-0.5 font-mono text-[11px] leading-snug text-slate-700">
            {mthds.map((m) => (
              <li key={m} className="truncate italic">
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const ClassNode = memo(ClassNodeComponent);
