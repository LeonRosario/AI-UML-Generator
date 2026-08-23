import { StickyNote } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';
import { useEditorStore } from '@/store/editor-store';
import { NodeHandles, EditorNodeShell, InlineLabel, nodeStyle } from './shared';

export function NoteNode({ id, data, selected }: NodeProps<Node<DiagramNodeData>>) {
  const updateNodeData = useEditorStore((state) => state.updateNodeData);
  return (
    <EditorNodeShell className={`min-h-20 border shadow-soft ${selected ? 'ring-2 ring-indigo-400' : ''}`} style={nodeStyle(data)}>
      <NodeHandles />
      <div className="flex items-center gap-1 border-b border-amber-200 bg-amber-100 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900">
        <StickyNote className="h-3 w-3" />
        <InlineLabel value={(data.label as string) ?? 'Note'} onRename={(label) => updateNodeData(id, { label })} />
      </div>
      <textarea
        value={data.note ?? ''}
        onChange={(event) => updateNodeData(id, { note: event.target.value })}
        className="nodrag nowheel h-16 w-full resize-none bg-transparent px-2.5 py-2 text-xs text-slate-700 outline-none"
        placeholder="Add a note..."
      />
    </EditorNodeShell>
  );
}