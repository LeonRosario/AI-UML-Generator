import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';
import { useEditorStore } from '@/store/editor-store';
import { EditorNodeShell, InlineLabel, NodeHandles, nodeStyle } from './shared';

/** Covers: umlNode (state/step), rectangle, circle, text, image, interface
 *  symbol (lollipop) and legacy genericNode variants. */
function GenericNodeComponent({ id, data }: NodeProps<Node<DiagramNodeData>>) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const nodeType = (data.nodeType as string) ?? 'umlNode';
  const label = (data.label as string) ?? 'Element';
  const variant = (data.variant as string | undefined) ?? 'step';

  /* ---------- legacy activity variants ---------- */
  if (nodeType === 'genericNode' && variant === 'start') {
    return (
      <div className="uml-node flex h-9 w-9 items-center justify-center">
        <NodeHandles />
        <div className="h-8 w-8 rounded-full border-2" style={{ borderColor: data.borderColor ?? '#334155' }} />
      </div>
    );
  }
  if (nodeType === 'genericNode' && variant === 'end') {
    return (
      <div className="uml-node relative flex h-9 w-9 items-center justify-center">
        <NodeHandles />
        <div className="h-7 w-7 rounded-full" style={{ background: data.fill ?? '#334155' }} />
      </div>
    );
  }
  if (nodeType === 'genericNode' && variant === 'decision') {
    return (
      <div className="uml-node relative h-[76px] w-[76px]">
        <NodeHandles />
        <div className="absolute inset-0 rotate-45 rounded-md border-[1.5px] shadow-soft" style={nodeStyle(data)}>
          <div className="flex h-full items-center justify-center text-[11px] font-medium" style={{ color: data.textColor ?? '#0f172a' }}>
            {label}
          </div>
        </div>
      </div>
    );
  }
  if (nodeType === 'genericNode' && variant === 'lifeline') {
    return (
      <EditorNodeShell className="w-[150px]" style={nodeStyle(data)}>
        <NodeHandles />
        <div className="border-b-2 px-3 py-1.5 text-center text-[12px] font-medium" style={{ borderColor: data.borderColor ?? '#334155' }}>
          {label}
        </div>
        <div className="relative h-16">
          <div className="absolute inset-y-0 left-1/2 w-px border-l border-dashed" style={{ borderColor: data.borderColor ?? '#cbd5e1' }} />
        </div>
      </EditorNodeShell>
    );
  }

  /* ---------- interface symbol (lollipop) ---------- */
  if (nodeType === 'interfaceSymbolNode') {
    return (
      <div className="uml-node relative h-[60px] w-8">
        <NodeHandles />
        <div className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2" style={{ borderColor: data.borderColor ?? '#334155' }} />
        <div className="absolute left-3 top-1/2 h-px w-5 -translate-y-1/2" style={{ background: data.borderColor ?? '#334155' }} />
      </div>
    );
  }

  /* ---------- image ---------- */
  if (nodeType === 'imageNode') {
    const src = (data.imageSrc as string | undefined) ?? (data.src as string | undefined);
    return (
      <EditorNodeShell className="overflow-hidden" style={nodeStyle(data)}>
        <NodeHandles />
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-[120px] w-[160px] items-center justify-center text-[11px] text-slate-400">
            Image — set via properties
          </div>
        )}
      </EditorNodeShell>
    );
  }

  /* ---------- text ---------- */
  if (nodeType === 'textNode') {
    return (
      <div className="uml-node">
        <NodeHandles />
        <InlineLabel
          value={label}
          onRename={(value) => updateNodeData(id, { label: value })}
          textClassName="text-[13px] font-medium"
        />
      </div>
    );
  }

  /* ---------- circle ---------- */
  if (nodeType === 'circleNode') {
    return (
      <EditorNodeShell
        className="flex h-[100px] w-[100px] items-center justify-center rounded-full"
        style={{ ...nodeStyle(data), borderRadius: 999 }}
      >
        <NodeHandles />
        <InlineLabel value={label} onRename={(value) => updateNodeData(id, { label: value })} textClassName="text-[12px] font-medium" className="min-w-8" />
      </EditorNodeShell>
    );
  }

  /* ---------- rectangle / step / uml node ---------- */
  const pill = nodeType === 'umlNode';
  const isStep = nodeType === 'genericNode';
  return (
    <EditorNodeShell
      className={pill ? 'min-w-[140px] rounded-full px-5 py-2.5' : isStep ? 'min-w-[150px] rounded-md px-5 py-2.5' : 'min-w-[150px] px-5 py-2.5'}
      style={nodeStyle(data)}
    >
      <NodeHandles />
      <div className="flex items-center justify-center gap-2">
        {pill && (data.stereotype as string) && (
          <span className="text-[9px] uppercase tracking-wide opacity-60">&lt;&lt;{data.stereotype}&gt;&gt;</span>
        )}
        <InlineLabel value={label} onRename={(value) => updateNodeData(id, { label: value })} textClassName="whitespace-nowrap text-[12px] font-medium" />
      </div>
    </EditorNodeShell>
  );
}

export const GenericNode = memo(GenericNodeComponent);