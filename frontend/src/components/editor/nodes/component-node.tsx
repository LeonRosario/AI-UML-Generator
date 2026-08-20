import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';
import { useEditorStore } from '@/store/editor-store';
import { EditorNodeShell, InlineLabel, NodeHandles, nodeStyle } from './shared';

function ComponentNodeComponent({ id, data }: NodeProps<Node<DiagramNodeData>>) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const label = (data.label as string) ?? 'Component';

  return (
    <EditorNodeShell className="w-[180px]" style={nodeStyle(data)}>
      <NodeHandles />
      <div className="relative flex h-full min-h-[60px] flex-col justify-center px-3 py-2.5">
        {/* Component tabs */}
        <span
          className="absolute -top-px left-3 flex h-3.5 w-8 items-center justify-center gap-1 border border-b-0"
          style={{ borderColor: data.borderColor ?? '#334155', borderRadius: '4px 4px 0 0' }}
        >
          <span className="h-2 w-px bg-current opacity-60" />
          <span className="h-2 w-px bg-current opacity-60" />
        </span>
        <span
          className="absolute -top-px left-12 flex h-3.5 w-8 items-center justify-center gap-1 border border-b-0"
          style={{ borderColor: data.borderColor ?? '#334155', borderRadius: '4px 4px 0 0' }}
        >
          <span className="h-2 w-px bg-current opacity-60" />
          <span className="h-2 w-px bg-current opacity-60" />
        </span>
        <InlineLabel
          value={label}
          onRename={(value) => updateNodeData(id, { label: value })}
          textClassName="text-[12px] font-semibold"
          className="mt-1.5"
        />
        {(data.stereotype as string) && (
          <div className="text-[9px] uppercase tracking-wide opacity-70">&lt;&lt;{data.stereotype}&gt;&gt;</div>
        )}
      </div>
    </EditorNodeShell>
  );
}

export const ComponentNode = memo(ComponentNodeComponent);