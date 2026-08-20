import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';
import { cn } from '@/lib/cn';
import {
  memberToString,
  normalizeMemberList,
  type MemberRow,
  type Visibility,
} from '@/lib/editor/diagram-utils';
import { useEditorStore } from '@/store/editor-store';
import { EditorNodeShell, headerStyle, NodeHandles, nodeStyle } from './shared';

const MAX_ROWS = 14;

function truncate(rows: MemberRow[], max: number, kind: 'attribute' | 'method') {
  if (rows.length <= max) return rows;
  return [...rows.slice(0, max - 1), { id: 'more', visibility: '' as Visibility, name: `… +${rows.length - max + 1} more`, ...(kind === 'attribute' ? {} : { params: '' }) }];
}

/* Inline editor for a single member row. */
function MemberEditor({
  row,
  kind,
  onCommit,
  onCancel,
}: {
  row: MemberRow;
  kind: 'attribute' | 'method';
  onCommit: (row: MemberRow) => void;
  onCancel: () => void;
}) {
  const [visibility, setVisibility] = useState<Visibility>(row.visibility);
  const [name, setName] = useState(row.name);
  const [type, setType] = useState(kind === 'attribute' ? (row.type ?? '') : (row.returnType ?? ''));
  const [params, setParams] = useState(row.params ?? '');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  const commit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    onCommit({
      id: row.id,
      visibility,
      name: trimmed,
      ...(kind === 'attribute'
        ? type.trim()
          ? { type: type.trim() }
          : {}
        : { ...(params.trim() ? { params: params.trim() } : {}), ...(type.trim() ? { returnType: type.trim() } : {}) }),
    });
  };

  const visBtn = (v: Visibility, title: string) => (
    <button
      type="button"
      title={title}
      onClick={() => setVisibility(v)}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[11px] transition-colors',
        visibility === v ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
      )}
    >
      {v}
    </button>
  );

  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <div className="flex items-center gap-0.5">
        {visBtn('+', 'Public')}
        {visBtn('-', 'Private')}
        {visBtn('#', 'Protected')}
        {visBtn('~', 'Package')}
      </div>
      <input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') onCancel();
        }}
        className="min-w-0 flex-1 rounded border border-indigo-300 bg-white px-1 py-0.5 font-mono text-[11px] text-slate-800 focus:outline-none"
        placeholder="name"
      />
      {kind === 'method' && (
        <input
          value={params}
          onChange={(e) => setParams(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
          }}
          className="w-14 rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[10px] text-slate-500 focus:border-indigo-300 focus:outline-none"
          placeholder="args"
        />
      )}
      <input
        value={type}
        onChange={(e) => setType(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
        }}
        className="w-16 rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[10px] text-slate-500 focus:border-indigo-300 focus:outline-none"
        placeholder={kind === 'attribute' ? 'type' : 'return'}
      />
    </div>
  );
}

function ClassNodeComponent({ id, data }: NodeProps<Node<DiagramNodeData>>) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData);

  const kind = (data.nodeType as string) ?? 'classNode';
  const attributes = useMemo(() => normalizeMemberList(data.attributes, 'attribute'), [data.attributes]);
  const methods = useMemo(() => normalizeMemberList(data.methods, 'method'), [data.methods]);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingRow, setEditingRow] = useState<{ key: 'attributes' | 'methods'; index: number } | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle) titleRef.current?.select();
  }, [editingTitle]);

  const label = (data.label as string) ?? 'Class';

  const commitTitle = () => {
    const value = titleDraft.trim();
    if (value && value !== label) updateNodeData(id, { label: value });
    setEditingTitle(false);
  };

  const commitRow = (key: 'attributes' | 'methods', index: number, row: MemberRow) => {
    const rows = key === 'attributes' ? attributes : methods;
    const next = index < rows.length ? rows.map((r, i) => (i === index ? row : r)) : [...rows, row];
    updateNodeData(id, { [key]: next });
    setEditingRow(null);
  };

  const removeRow = (key: 'attributes' | 'methods', index: number) => {
    const rows = key === 'attributes' ? attributes : methods;
    updateNodeData(id, { [key]: rows.filter((_, i) => i !== index) });
    setEditingRow(null);
  };

  const attrs = truncate(attributes, MAX_ROWS, 'attribute');
  const mthds = truncate(methods, MAX_ROWS, 'method');

  const stereotype =
    (data.stereotype as string | undefined) ??
    (kind === 'interfaceNode' ? 'interface' : kind === 'abstractClassNode' ? 'abstract' : kind === 'objectNode' ? 'object' : undefined);

  const addRow = (key: 'attributes' | 'methods') => {
    const rows = key === 'attributes' ? attributes : methods;
    const placeholder: MemberRow = {
      id: `new-${Date.now()}`,
      visibility: key === 'attributes' ? '-' : '+',
      name: '',
      ...(key === 'attributes' ? { type: 'string' } : { params: '', returnType: 'void' }),
    };
    setEditingRow({ key, index: rows.length });
    void placeholder;
  };

  const renderRows = (rows: MemberRow[], key: 'attributes' | 'methods') => {
    const isEditingHere = editingRow?.key === key;
    const list = rows.map((row, i) =>
      isEditingHere && editingRow.index === i ? (
        <li key={row.id}>
          <MemberEditor
            row={row}
            kind={key === 'attributes' ? 'attribute' : 'method'}
            onCommit={(r) => commitRow(key, i, r)}
            onCancel={() => setEditingRow(null)}
          />
        </li>
      ) : (
        <li
          key={row.id}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingRow({ key, index: i });
          }}
          className="group flex items-center justify-between rounded px-2 py-px hover:bg-indigo-50/60"
          title="Double-click to edit"
        >
          <span
            className={cn('truncate font-mono text-[11px] leading-snug', key === 'methods' && 'italic')}
            style={{ color: data.textColor ?? '#334155' }}
          >
            {memberToString(row, key === 'attributes' ? 'attribute' : 'method')}
          </span>
          <span className="hidden shrink-0 pl-1 group-hover:inline">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeRow(key, i);
              }}
              className="rounded px-0.5 text-[10px] text-slate-300 hover:text-red-500"
              title="Remove member"
            >
              ✕
            </button>
          </span>
        </li>
      ),
    );

    if (isEditingHere && editingRow.index === rows.length) {
      list.push(
        <li key="new-row">
          <MemberEditor
            row={{ id: `new-${Date.now()}`, visibility: key === 'attributes' ? '-' : '+', name: '', ...(key === 'attributes' ? { type: 'string' } : { params: '', returnType: 'void' }) }}
            kind={key === 'attributes' ? 'attribute' : 'method'}
            onCommit={(r) => commitRow(key, rows.length, r)}
            onCancel={() => setEditingRow(null)}
          />
        </li>,
      );
    }

    return <ul className="space-y-px">{list}</ul>;
  };

  const sectionShell = 'border-b px-1 py-1 last:border-b-0';

  return (
    <EditorNodeShell
      className="w-[210px]"
      style={nodeStyle(data)}
      onDoubleClick={() => {
        setTitleDraft(label);
        setEditingTitle(true);
      }}
    >
      <NodeHandles />

      <div
        className="border-b px-3 py-2 text-center"
        style={{ ...headerStyle(data), borderColor: data.borderColor ?? '#334155' }}
      >
        {stereotype && <div className="text-[10px] font-medium uppercase tracking-wide opacity-80">&lt;&lt;{stereotype}&gt;&gt;</div>}
        {editingTitle ? (
          <input
            ref={titleRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            className="w-full rounded border border-white/40 bg-white/10 px-1 py-0.5 text-center text-[13px] font-semibold outline-none"
          />
        ) : (
          <div className="text-[13px] font-semibold leading-tight">{label}</div>
        )}
      </div>

      {attrs.length > 0 && (
        <div className={sectionShell} style={{ borderColor: data.borderColor ?? '#e2e8f0', color: data.textColor ?? '#334155' }}>
          {renderRows(attrs, 'attributes')}
        </div>
      )}

      {mthds.length > 0 && (
        <div className={sectionShell} style={{ color: data.textColor ?? '#0f172a' }}>
          {renderRows(mthds, 'methods')}
        </div>
      )}

      {editingRow === null && (
        <div className="border-t border-dashed px-2 py-1 text-center" style={{ borderColor: data.borderColor ?? '#e2e8f0' }}>
          <span className="text-[10px] text-slate-400">double-click rows to edit</span>
        </div>
      )}
    </EditorNodeShell>
  );
}

export const ClassNode = memo(ClassNodeComponent);