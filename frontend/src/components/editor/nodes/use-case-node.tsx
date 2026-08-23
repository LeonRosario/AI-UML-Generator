import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';
import { useEditorStore } from '@/store/editor-store';
import { EditorNodeShell, InlineLabel, NodeHandles, nodeStyle } from './shared';

function UseCaseNodeComponent({ id, data, selected }: NodeProps<Node<DiagramNodeData>>) {
  const updateNodeData = useEditorStore((state) => state.updateNodeData);
  return (
    <EditorNodeShell
      className={`flex items-center justify-center rounded-full px-6 py-3 ${selected ? 'ring-2 ring-indigo-400' : ''}`}
      style={nodeStyle(data)}
    >
      <NodeHandles />
      <InlineLabel value={(data.label as string) ?? 'Use Case'} onRename={(label) => updateNodeData(id, { label })} textClassName="text-[13px] font-medium" />
    </EditorNodeShell>
  );
}

export const UseCaseNode = memo(UseCaseNodeComponent);