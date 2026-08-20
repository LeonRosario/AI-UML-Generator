import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';
import { useEditorStore } from '@/store/editor-store';
import { EditorNodeShell, InlineLabel, NodeHandles, nodeStyle } from './shared';

/** UML Package (folder with tab) or System Boundary (dashed rectangle). */
function PackageNodeComponent({ id, data }: NodeProps<Node<DiagramNodeData>>) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const label = (data.label as string) ?? 'Package';
  const kind = (data.nodeType as string) ?? 'packageNode';
  const isBoundary = kind === 'systemBoundaryNode';

  if (isBoundary) {
    return (
      <EditorNodeShell
        className="min-w-[220px]"
        style={{
          ...nodeStyle(data),
          background: 'transparent',
          borderStyle: 'dashed',
          borderWidth: 1.5,
          borderRadius: data.radius ?? 8,
          color: data.textColor ?? '#334155',
        }}
      >
        <NodeHandles />
        <div className="px-3 py-1.5">
          <InlineLabel
            value={label}
            onRename={(value) => updateNodeData(id, { label: value })}
            textClassName="text-[12px] font-medium"
          />
          <div className="mt-1 text-[10px] text-slate-400">system boundary</div>
        </div>
      </EditorNodeShell>
    );
  }

  return (
    <EditorNodeShell
      className="w-[190px]"
      style={{ ...nodeStyle(data), borderTopLeftRadius: 0, borderTopRightRadius: data.radius ?? 8 }}
    >
      <NodeHandles />
      <div className="flex items-center gap-1.5 px-2 pt-1.5">
        <span className="h-3.5 w-5 rounded-t border border-b-0 px-1 text-[8px] leading-3" style={{ borderColor: data.borderColor ?? '#334155', color: data.textColor ?? '#0f172a' }}>
          ▤
        </span>
        <InlineLabel
          value={label}
          onRename={(value) => updateNodeData(id, { label: value })}
          textClassName="text-[12px] font-semibold"
        />
      </div>
      <div className="mt-1.5 min-h-[40px] border-t px-2 py-1 text-[10px] italic" style={{ borderColor: data.borderColor ?? '#e2e8f0', color: data.textColor ?? '#64748b' }}>
        package contents
      </div>
    </EditorNodeShell>
  );
}

export const PackageNode = memo(PackageNodeComponent);