import { memo, useMemo, useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';
import { useEditorStore } from '@/store/editor-store';
import { EditorNodeShell, InlineLabel, NodeHandles, nodeStyle } from './shared';

const MAX_FIELDS = 12;

function DatabaseNodeComponent({ id, data }: NodeProps<Node<DiagramNodeData>>) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const label = (data.label as string) ?? 'Database';
  const fields = useMemo(() => (Array.isArray(data.fields) ? data.fields.map(String) : []), [data.fields]);
  const [editingField, setEditingField] = useState<number | null>(null);
  const [fieldDraft, setFieldDraft] = useState('');

  const commitField = () => {
    if (editingField !== null) {
      const next = [...fields];
      if (fieldDraft.trim()) next[editingField] = fieldDraft.trim();
      else next.splice(editingField, 1);
      updateNodeData(id, { fields: next });
    }
    setEditingField(null);
  };

  const shown = fields.length > MAX_FIELDS ? [...fields.slice(0, MAX_FIELDS - 1), `… +${fields.length - MAX_FIELDS + 1} more`] : fields;

  return (
    <EditorNodeShell className="w-[210px]" style={nodeStyle(data)}>
      <NodeHandles />
      <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: data.borderColor ?? '#e2e8f0' }}>
        <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-current text-[8px] font-bold opacity-70">T</span>
        <InlineLabel
          value={label}
          onRename={(value) => updateNodeData(id, { label: value })}
          textClassName="text-[12px] font-semibold"
        />
        {(data.stereotype as string) && (
          <div className="text-[9px] uppercase tracking-wide opacity-70">&lt;&lt;{data.stereotype}&gt;&gt;</div>
        )}
      </div>
      {shown.length > 0 && (
        <div className="px-2 py-1.5">
          <ul className="space-y-px">
            {shown.map((field, i) => {
              const isKey = /\(pk\)|\(fk\)/i.test(field);
              return editingField === i ? (
                <li key={`${field}-${i}`}>
                  <input
                    value={fieldDraft}
                    autoFocus
                    onChange={(e) => setFieldDraft(e.target.value)}
                    onBlur={commitField}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitField();
                      if (e.key === 'Escape') setEditingField(null);
                    }}
                    className="w-full rounded border border-indigo-300 bg-white px-1 py-px font-mono text-[11px] text-slate-800 focus:outline-none"
                  />
                </li>
              ) : (
                <li
                  key={`${field}-${i}`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setFieldDraft(field);
                    setEditingField(i);
                  }}
                  className="truncate rounded px-1 py-px font-mono text-[11px] hover:bg-indigo-50/60"
                  style={{ color: data.textColor ?? '#334155' }}
                  title="Double-click to edit"
                >
                  {isKey ? <span className="mr-1 text-amber-500">◈</span> : <span className="mr-1 text-slate-300">·</span>}
                  <span className={isKey ? 'font-semibold' : undefined}>{field}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </EditorNodeShell>
  );
}

export const DatabaseNode = memo(DatabaseNodeComponent);