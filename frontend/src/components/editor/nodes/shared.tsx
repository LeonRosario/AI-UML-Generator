import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';
import { cn } from '@/lib/cn';

export type EditorNodeProps = NodeProps<Node<DiagramNodeData>>;

export function NodeHandles({ size = 'small' }: { size?: 'small' | 'large' }) {
  const cls = size === 'small' ? '!h-2 !w-2 !min-w-0 !min-h-0' : '';
  return (
    <>
      <Handle type="target" position={Position.Top} className={cls} />
      <Handle type="source" position={Position.Bottom} className={cls} />
      <Handle type="target" position={Position.Left} className={cls} />
      <Handle type="source" position={Position.Right} className={cls} />
    </>
  );
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

export function isLightColor(color?: string): boolean {
  if (!color) return false;
  const rgb = parseHex(color);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export function nodeStyle(data: DiagramNodeData): CSSProperties {
  const radius = typeof data.radius === 'number' ? data.radius : 8;
  return {
    background: data.fill ?? '#ffffff',
    borderColor: data.borderColor ?? '#334155',
    borderWidth: typeof data.borderWidth === 'number' ? data.borderWidth : 1,
    borderRadius: radius,
    color: data.textColor ?? '#0f172a',
  };
}

export function headerStyle(data: DiagramNodeData): CSSProperties {
  const border = data.borderColor ?? '#334155';
  const light = isLightColor(border);
  return {
    backgroundColor: light ? (data.fill ?? '#e2e8f0') : border,
    color: light ? '#0f172a' : '#ffffff',
  };
}

export function EditorNodeShell({
  className,
  style,
  children,
  onDoubleClick,
}: {
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
  onDoubleClick?: () => void;
}) {
  return (
    <div
      className={cn('uml-node overflow-hidden bg-white shadow-soft', className)}
      style={style}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </div>
  );
}

/** Double-click to rename inline. */
export function InlineLabel({
  value,
  onRename,
  className,
  textClassName,
}: {
  value: string;
  onRename: (value: string) => void;
  className?: string;
  textClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      requestAnimationFrame(() => ref.current?.select());
    }
  }, [editing, value]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== value) onRename(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-full rounded border border-indigo-400 bg-white px-1.5 py-0.5 text-center text-[13px] font-medium text-slate-800 shadow-lift focus:outline-none"
        onDoubleClick={(e) => e.stopPropagation()}
      />
    );
  }
  return (
    <div
      className={cn('cursor-text', className)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="Double-click to rename"
    >
      <span className={cn('whitespace-nowrap', textClassName)}>{value}</span>
    </div>
  );
}