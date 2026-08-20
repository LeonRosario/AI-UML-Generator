import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';
import { useEditorStore } from '@/store/editor-store';
import { EditorNodeShell, InlineLabel, NodeHandles, nodeStyle } from './shared';

export function ActorFigure({ className, color }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={color ? { color } : undefined} aria-hidden="true">
      <circle cx="12" cy="4.5" r="3.2" fill="currentColor" />
      <path d="M12 8.5c-4.4 0-6.5 3.4-6.5 6.5 1.8-.4 3-1.2 3-3 0 1.8 1.6 3 3.5 3s3.5-1.2 3.5-3c0 1.8 1.2 2.6 3 3 0-3.1-2.1-6.5-6.5-6.5z" fill="currentColor" />
    </svg>
  );
}

function ActorNodeComponent({ id, data }: NodeProps<Node<DiagramNodeData>>) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const label = (data.label as string) ?? 'Actor';

  return (
    <EditorNodeShell className="rounded-lg px-5 py-2.5" style={nodeStyle(data)}>
      <NodeHandles size="large" />
      <div className="flex flex-col items-center gap-1.5">
        <ActorFigure className="h-11 w-11" color={data.textColor ?? '#334155'} />
        <InlineLabel
          value={label}
          onRename={(value) => updateNodeData(id, { label: value })}
          textClassName="text-[13px] font-medium"
          className="min-w-10"
        />
      </div>
    </EditorNodeShell>
  );
}

export const ActorNode = memo(ActorNodeComponent);