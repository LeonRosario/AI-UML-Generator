import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Copy,
  GitBranch,
  LayoutGrid,
  Plus,
  Ruler,
  SlidersHorizontal,
  Trash2,
  Type,
} from 'lucide-react';
import type { Edge, Node } from '@xyflow/react';
import type { DiagramNode, DiagramNodeData, DiagramType } from '@/types';
import { DIAGRAM_TYPE_LABELS } from '@/data/diagrams';
import { memberToString, normalizeMemberList, type MemberRow, type Visibility } from '@/lib/editor/diagram-utils';
import { RELATIONSHIPS } from '@/lib/editor/node-types';
import { relationshipLabel } from '@/lib/editor/edge-types';
import { useEditorStore } from '@/store/editor-store';
import { Field, Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-3 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

function SubRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 px-3 py-1 text-[12px] text-slate-600">
      <span className="w-20 shrink-0">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

const COLORS = ['#ffffff', '#fef9c3', '#dcfce7', '#dbeafe', '#ede9fe', '#fce7f3', '#e2e8f0', '#0f172a', '#475569', '#6366f1', '#10b981', '#f59e0b'];
const TEXT_COLORS = ['#0f172a', '#475569', '#6366f1', '#dc2626', '#059669', '#0ea5e9', '#d97706', '#ffffff'];

function ColorField({ label, value, onChange, palette }: { label: string; value: string; onChange: (value: string) => void; palette: string[] }) {
  return (
    <div className="px-3 py-1">
      <p className="mb-1 text-[12px] text-slate-600">{label}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {palette.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={cn(
              'h-5 w-5 rounded-md border transition-transform hover:scale-110',
              value.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-indigo-500 ring-offset-1' : 'border-slate-200',
            )}
            style={{ background: c }}
            aria-label={`Set ${label} to ${c}`}
          />
        ))}
        <label className="relative ml-1 flex h-5 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-slate-300" title="Custom color">
          <span className="text-[10px] text-slate-400">🎨</span>
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#0f172a'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Node inspector                                                     */
/* ------------------------------------------------------------------ */

function MemberListEditor({
  title,
  rows,
  kind,
  onCommit,
}: {
  title: string;
  rows: MemberRow[];
  kind: 'attribute' | 'method';
  onCommit: (rows: MemberRow[]) => void;
}) {
  const [draft, setDraft] = useState<MemberRow | null>(null);

  const update = (index: number, patch: Partial<MemberRow>) => {
    onCommit(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const remove = (index: number) => onCommit(rows.filter((_, i) => i !== index));

  const add = () => {
    const row: MemberRow = {
      id: `new-${Date.now()}`,
      visibility: kind === 'attribute' ? '-' : '+',
      name: '',
      ...(kind === 'attribute' ? { type: 'string' } : { params: '', returnType: 'void' }),
    };
    onCommit([...rows, row]);
    setDraft(row);
  };

  const commitDraft = () => {
    if (draft && draft.name.trim()) {
      onCommit(rows.map((r) => (r.id === draft.id ? draft : r)));
    }
    setDraft(null);
  };

  return (
    <div className="px-3 py-1">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[12px] font-medium text-slate-700">{title}</p>
        <button
          onClick={add}
          className="flex items-center gap-0.5 rounded-md border border-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      <div className="space-y-1">
        {rows.map((row, i) => (
          <div key={row.id} className="flex items-center gap-1">
            <select
              value={row.visibility}
              onChange={(e) => update(i, { visibility: e.target.value as Visibility })}
              className="h-6.5 w-9 shrink-0 rounded border border-slate-200 bg-slate-50 px-0.5 font-mono text-[11px] text-slate-600"
              title="Visibility"
            >
              <option value="+">+</option>
              <option value="-">-</option>
              <option value="#">#</option>
              <option value="~">~</option>
            </select>
            <input
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
              onBlur={() => setDraft(null)}
              className="h-6.5 min-w-0 flex-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[11px] text-slate-700 focus:border-indigo-400 focus:outline-none"
              placeholder="name"
            />
            {kind === 'method' && (
              <input
                value={row.params ?? ''}
                onChange={(e) => update(i, { params: e.target.value })}
                className="h-6.5 w-14 rounded border border-slate-200 bg-white px-1 font-mono text-[10px] text-slate-500 focus:border-indigo-400 focus:outline-none"
                placeholder="args"
              />
            )}
            <input
              value={kind === 'attribute' ? (row.type ?? '') : (row.returnType ?? '')}
              onChange={(e) => update(i, kind === 'attribute' ? { type: e.target.value } : { returnType: e.target.value })}
              className="h-6.5 w-14 rounded border border-slate-200 bg-white px-1 font-mono text-[10px] text-slate-500 focus:border-indigo-400 focus:outline-none"
              placeholder={kind === 'attribute' ? 'type' : 'return'}
            />
            <button
              onClick={() => remove(i)}
              className="shrink-0 rounded p-0.5 text-slate-300 hover:text-red-500"
              title="Remove member"
            >
              ✕
            </button>
          </div>
        ))}
        {draft && (
          <div className="flex items-center gap-1">
            <select
              value={draft.visibility}
              onChange={(e) => setDraft({ ...draft, visibility: e.target.value as Visibility })}
              className="h-6.5 w-9 shrink-0 rounded border border-indigo-300 bg-indigo-50 px-0.5 font-mono text-[11px]"
            >
              <option value="+">+</option>
              <option value="-">-</option>
              <option value="#">#</option>
              <option value="~">~</option>
            </select>
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitDraft();
                if (e.key === 'Escape') setDraft(null);
              }}
              className="h-6.5 min-w-0 flex-1 rounded border border-indigo-300 bg-white px-1.5 font-mono text-[11px] focus:outline-none"
              placeholder="name"
            />
            {kind === 'method' && (
              <input
                value={draft.params ?? ''}
                onChange={(e) => setDraft({ ...draft, params: e.target.value })}
                className="h-6.5 w-14 rounded border border-slate-200 px-1 font-mono text-[10px]"
                placeholder="args"
              />
            )}
            <input
              value={kind === 'attribute' ? (draft.type ?? '') : (draft.returnType ?? '')}
              onChange={(e) => setDraft(kind === 'attribute' ? { ...draft, type: e.target.value } : { ...draft, returnType: e.target.value })}
              className="h-6.5 w-14 rounded border border-slate-200 px-1 font-mono text-[10px]"
              placeholder={kind === 'attribute' ? 'type' : 'return'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function FieldsEditor({ fields, onCommit }: { fields: string[]; onCommit: (fields: string[]) => void }) {
  const add = () => onCommit([...fields, 'new_field: string']);
  return (
    <div className="px-3 py-1">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[12px] font-medium text-slate-700">Fields</p>
        <button onClick={add} className="flex items-center gap-0.5 rounded-md border border-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50">
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      <div className="space-y-1">
        {fields.map((field, i) => (
          <div key={`${field}-${i}`} className="flex items-center gap-1">
            <input
              value={field}
              onChange={(e) => onCommit(fields.map((f, j) => (j === i ? e.target.value : f)))}
              onBlur={() => onCommit(fields.map((f) => f).filter((f, j) => !(j === i && !f.trim())))}
              className="h-6.5 min-w-0 flex-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[11px] text-slate-700 focus:border-indigo-400 focus:outline-none"
            />
            <button onClick={() => onCommit(fields.filter((_, j) => j !== i))} className="shrink-0 rounded p-0.5 text-slate-300 hover:text-red-500">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PositionEditor({ node }: { node: DiagramNode }) {
  const updateNodePosition = useEditorStore((s) => s.updateNodePosition);
  const updateNodeStyle = useEditorStore((s) => s.updateNodeStyle);
  const fixed = (node.style as Record<string, unknown> | undefined)?.width !== undefined && !['classNode', 'interfaceNode', 'abstractClassNode', 'objectNode', 'packageNode', 'systemBoundaryNode', 'componentNode', 'databaseNode', 'noteNode', 'entityNode'].includes(node.type ?? '');

  const num = (label: string, value: number, onChange: (v: number) => void) => (
    <label className="flex items-center gap-1.5 text-[12px] text-slate-600">
      <span className="w-8 shrink-0">{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-6.5 w-full min-w-0 rounded border border-slate-200 bg-white px-1.5 font-mono text-[11px] text-slate-700 focus:border-indigo-400 focus:outline-none"
      />
    </label>
  );

  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-1 px-3 py-1">
      {num('X', node.position.x, (v) => updateNodePosition(node.id, { x: v, y: node.position.y }))}
      {num('Y', node.position.y, (v) => updateNodePosition(node.id, { x: node.position.x, y: v }))}
      {!fixed &&
        num('W', Number((node.style as Record<string, unknown> | undefined)?.width) || 210, (v) => updateNodeStyle(node.id, { width: v }))}
      {!fixed &&
        num('H', Number((node.style as Record<string, unknown> | undefined)?.height) || 120, (v) => updateNodeStyle(node.id, { height: v }))}
    </div>
  );
}

function NodeInspector({ node }: { node: DiagramNode }) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const updateNodeStyle = useEditorStore((s) => s.updateNodeStyle);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected);

  const data = node.data as DiagramNodeData;
  const nodeType = (data.nodeType as string) ?? node.type ?? 'rectangleNode';
  const classLike = ['classNode', 'interfaceNode', 'abstractClassNode', 'objectNode', 'packageNode'].includes(nodeType);
  const dbLike = ['databaseNode', 'entityNode'].includes(nodeType);
  const noteLike = nodeType === 'noteNode';
  const imageLike = nodeType === 'imageNode';

  const attributes = useMemo(() => normalizeMemberList(data.attributes, 'attribute'), [data.attributes]);
  const methods = useMemo(() => normalizeMemberList(data.methods, 'method'), [data.methods]);
  const fields = useMemo(() => (Array.isArray(data.fields) ? data.fields.map(String) : []), [data.fields]);

  const stylePatch = (patch: Record<string, unknown>) => updateNodeStyle(node.id, patch as never);

  return (
    <div className="space-y-1">
      <SectionTitle icon={Box}>Element</SectionTitle>
      <div className="px-3">
        <SubRow label="Type">
          <span className="font-mono text-[11px] capitalize text-slate-500">{nodeType.replace('Node', '')}</span>
        </SubRow>
        <SubRow label="Name">
          <Input
            value={(data.label as string) ?? ''}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            onBlur={(e) => updateNodeData(node.id, { label: e.target.value.trim() || 'Element' })}
            className="!h-7 !px-2 !text-[12px]"
          />
        </SubRow>
      </div>

      {classLike && (
        <>
          <MemberListEditor title={`Attributes (${attributes.length})`} rows={attributes} kind="attribute" onCommit={(rows) => updateNodeData(node.id, { attributes: rows })} />
          <MemberListEditor title={`Methods (${methods.length})`} rows={methods} kind="method" onCommit={(rows) => updateNodeData(node.id, { methods: rows })} />
        </>
      )}
      {dbLike && <FieldsEditor fields={fields} onCommit={(f) => updateNodeData(node.id, { fields: f })} />}
      {noteLike && (
        <div className="px-3 py-1">
          <p className="mb-1 text-[12px] font-medium text-slate-700">Note</p>
          <textarea
            value={(data.note as string) ?? ''}
            onChange={(e) => updateNodeData(node.id, { note: e.target.value, label: e.target.value })}
            rows={3}
            className="w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[12px] text-slate-700 focus:border-indigo-400 focus:outline-none"
          />
        </div>
      )}
      {imageLike && (
        <div className="px-3 py-1">
          <p className="mb-1 text-[12px] font-medium text-slate-700">Image URL</p>
          <Input
            value={(data.imageSrc as string) ?? ''}
            onChange={(e) => updateNodeData(node.id, { imageSrc: e.target.value })}
            placeholder="https://…"
            className="!h-7 !px-2 !text-[12px]"
          />
        </div>
      )}

      <SectionTitle icon={SlidersHorizontal}>Style</SectionTitle>
      <ColorField label="Fill" value={(data.fill as string) ?? '#ffffff'} onChange={(fill) => stylePatch({ fill })} palette={COLORS} />
      <ColorField label="Border" value={(data.borderColor as string) ?? '#334155'} onChange={(borderColor) => stylePatch({ borderColor })} palette={COLORS} />
      <ColorField label="Text" value={(data.textColor as string) ?? '#0f172a'} onChange={(textColor) => stylePatch({ textColor })} palette={TEXT_COLORS} />
      <div className="grid grid-cols-2 gap-x-2 px-3 py-1">
        <SubRow label="Border w">
          <Input
            type="number"
            min={0}
            max={6}
            value={(data.borderWidth as number) ?? 1}
            onChange={(e) => stylePatch({ borderWidth: Number(e.target.value) || 1 })}
            className="!h-7 !px-2 !text-[12px]"
          />
        </SubRow>
        <SubRow label="Radius">
          <Input
            type="number"
            min={0}
            max={24}
            value={(data.radius as number) ?? 8}
            onChange={(e) => stylePatch({ radius: Number(e.target.value) || 0 })}
            className="!h-7 !px-2 !text-[12px]"
          />
        </SubRow>
      </div>

      <SectionTitle icon={Ruler}>Position</SectionTitle>
      <PositionEditor node={node} />

      <div className="flex gap-2 px-3 py-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={duplicateSelected}>
          <Copy className="h-3.5 w-3.5" /> Duplicate
        </Button>
        <Button variant="danger" size="sm" className="flex-1" onClick={deleteSelected}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edge inspector                                                     */
/* ------------------------------------------------------------------ */

function EdgeInspector({ edge }: { edge: Edge }) {
  const updateEdge = useEditorStore((s) => s.updateEdge);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const nodes = useEditorStore((s) => s.nodes);
  const relationship = (edge.data as { relationship?: string } | undefined)?.relationship ?? 'association';
  const sourceLabel = nodes.find((n) => n.id === edge.source)?.data.label as string | undefined;
  const targetLabel = nodes.find((n) => n.id === edge.target)?.data.label as string | undefined;
  const color = (edge.data as { color?: string } | undefined)?.color;

  return (
    <div className="space-y-1">
      <SectionTitle icon={GitBranch}>Relationship</SectionTitle>
      <div className="px-3">
        <SubRow label="Type">
          <Select value={relationship} onChange={(e) => updateEdge(edge.id, { data: { ...(edge.data as object), relationship: e.target.value } })} className="!h-7 !px-2 !text-[12px]">
            {RELATIONSHIPS.map((r) => (
              <option key={r.type} value={r.type}>
                {r.label}
              </option>
            ))}
          </Select>
        </SubRow>
        <SubRow label="Label">
          <Input
            value={(edge.label as string) ?? ''}
            placeholder="e.g. places"
            onChange={(e) => updateEdge(edge.id, { label: e.target.value || undefined })}
            className="!h-7 !px-2 !text-[12px]"
          />
        </SubRow>
        <SubRow label="From">
          <span className="truncate font-mono text-[11px] text-slate-500">{sourceLabel ?? edge.source}</span>
        </SubRow>
        <SubRow label="To">
          <span className="truncate font-mono text-[11px] text-slate-500">{targetLabel ?? edge.target}</span>
        </SubRow>
      </div>

      <SectionTitle icon={SlidersHorizontal}>Style</SectionTitle>
      <ColorField
        label="Line color"
        value={color ?? '#475569'}
        onChange={(c) => updateEdge(edge.id, { data: { ...(edge.data as object), color: c } })}
        palette={['#475569', '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']}
      />

      <div className="px-3 py-3">
        <Button variant="danger" size="sm" className="w-full" onClick={deleteSelected}>
          <Trash2 className="h-3.5 w-3.5" /> Delete relationship
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Diagram inspector (nothing selected)                               */
/* ------------------------------------------------------------------ */

function DiagramInspector() {
  const name = useEditorStore((s) => s.name);
  const type = useEditorStore((s) => s.type);
  const setName = useEditorStore((s) => s.setName);
  const setType = useEditorStore((s) => s.setType);
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const canvasBackground = useEditorStore((s) => s.canvasBackground);
  const showGrid = useEditorStore((s) => s.showGrid);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const setPrefs = useEditorStore((s) => s.setPrefs);
  const applyAutoLayout = useEditorStore((s) => s.applyAutoLayout);
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'horizontal' | 'vertical'>('hierarchical');

  return (
    <div className="space-y-1">
      <SectionTitle icon={LayoutGrid}>Diagram</SectionTitle>
      <div className="px-3">
        <SubRow label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="!h-7 !px-2 !text-[12px]" />
        </SubRow>
        <SubRow label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as DiagramType)} className="!h-7 !px-2 !text-[12px]">
            {(Object.keys(DIAGRAM_TYPE_LABELS) as DiagramType[]).map((t) => (
              <option key={t} value={t}>
                {DIAGRAM_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </SubRow>
        <p className="px-3 pt-2 text-[11px] text-slate-400">
          {nodes.length} elements · {edges.length} relationships
        </p>
      </div>

      <SectionTitle icon={SlidersHorizontal}>Canvas</SectionTitle>
      <ColorField
        label="Background"
        value={canvasBackground}
        onChange={(canvasBackground) => setPrefs({ canvasBackground })}
        palette={['#fafafa', '#ffffff', '#f8fafc', '#fef9c3', '#ecfdf5', '#eff6ff', '#0f172a', '#334155']}
      />
      <div className="space-y-1 px-3 py-1">
        <label className="flex cursor-pointer items-center justify-between text-[12px] text-slate-600">
          Grid
          <input type="checkbox" checked={showGrid} onChange={(e) => setPrefs({ showGrid: e.target.checked })} className="h-3.5 w-3.5 accent-indigo-500" />
        </label>
        <label className="flex cursor-pointer items-center justify-between text-[12px] text-slate-600">
          Snap to grid
          <input type="checkbox" checked={snapToGrid} onChange={(e) => setPrefs({ snapToGrid: e.target.checked })} className="h-3.5 w-3.5 accent-indigo-500" />
        </label>
      </div>

      <SectionTitle icon={LayoutGrid}>Auto Layout</SectionTitle>
      <div className="flex items-center gap-2 px-3 py-1">
        <Select value={layoutMode} onChange={(e) => setLayoutMode(e.target.value as typeof layoutMode)} className="!h-7 !px-2 !text-[12px]">
          <option value="hierarchical">Hierarchical</option>
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </Select>
        <Button size="sm" variant="outline" onClick={() => applyAutoLayout(layoutMode)} disabled={nodes.length === 0}>
          Apply
        </Button>
      </div>

      <div className="px-3 py-3">
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
          <Type className="mt-0.5 h-3 w-3 shrink-0" />
          Double-click any element to edit it inline. Drag from a handle to create a relationship.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Panel entry                                                        */
/* ------------------------------------------------------------------ */

export function PropertiesPanel() {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);

  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const selectedEdges = useMemo(() => edges.filter((e) => e.selected), [edges]);

  if (selectedNodes.length === 1) {
    return <NodeInspector key={selectedNodes[0].id} node={selectedNodes[0]} />;
  }
  if (selectedNodes.length > 1) {
    return (
      <div className="px-4 py-6 text-center text-[13px] text-slate-500">
        {selectedNodes.length} elements selected
        <div className="mt-3 flex justify-center gap-2">
          <DeleteSelection />
        </div>
      </div>
    );
  }
  if (selectedEdges.length === 1) {
    return <EdgeInspector key={selectedEdges[0].id} edge={selectedEdges[0]} />;
  }
  return <DiagramInspector />;
}

function DeleteSelection() {
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  return (
    <Button variant="danger" size="sm" onClick={deleteSelected}>
      <Trash2 className="h-3.5 w-3.5" /> Delete selected
    </Button>
  );
}

/* Re-export for the mobile bottom sheet. */
export { DeleteSelection as MultiSelectionActions, memberToString as memberDisplay };