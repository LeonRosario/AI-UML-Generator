import { memo, useEffect, useRef, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { cn } from '@/lib/cn';
import { RELATIONSHIP_LABELS, type RelationshipType } from './node-types';
import { useEditorStore } from '@/store/editor-store';

export type RelationshipEdgeData = {
  relationship?: RelationshipType;
  color?: string;
  [key: string]: unknown;
};

const DEFAULT_EDGE_COLOR = '#475569';
const SELECTED_EDGE_COLOR = '#6366f1';

export type EdgeStyleConfig = {
  dash?: string;
  markerStart?: 'diamond' | 'diamond-filled';
  markerEnd?: 'closed-arrow' | 'open-arrow';
};

export const RELATIONSHIP_STYLE: Record<RelationshipType, EdgeStyleConfig> = {
  association: {},
  'directed-association': { markerEnd: 'closed-arrow' },
  inheritance: { markerEnd: 'open-arrow' },
  aggregation: { markerStart: 'diamond' },
  composition: { markerStart: 'diamond-filled' },
  dependency: { dash: '6 4', markerEnd: 'closed-arrow' },
  realization: { dash: '6 4', markerEnd: 'open-arrow' },
};

/* ------------------------------------------------------------------ */
/*  SVG marker defs rendered once inside the flow.                     */
/* ------------------------------------------------------------------ */

const MARKER_COLORS = [
  { id: 'slate', color: DEFAULT_EDGE_COLOR },
  { id: 'indigo', color: SELECTED_EDGE_COLOR },
] as const;

export function UmlMarkerDefs() {
  return (
    <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
      <defs>
        {MARKER_COLORS.map(({ id, color }) => (
          <g key={id}>
            <marker id={`uml-arrow-${id}`} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
              <path d="M2 1 L11 6 L2 11 Z" fill={color} />
            </marker>
            <marker id={`uml-open-arrow-${id}`} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
              <path d="M2 1 L11 6 L2 11 Z" fill="#ffffff" stroke={color} strokeWidth="1.5" />
            </marker>
            <marker id={`uml-diamond-${id}`} viewBox="0 0 14 14" refX="12" refY="7" markerWidth="11" markerHeight="11" orient="auto-start-reverse">
              <path d="M7 1 L13 7 L7 13 L1 7 Z" fill="#ffffff" stroke={color} strokeWidth="1.5" />
            </marker>
            <marker id={`uml-diamond-filled-${id}`} viewBox="0 0 14 14" refX="12" refY="7" markerWidth="11" markerHeight="11" orient="auto-start-reverse">
              <path d="M7 1 L13 7 L7 13 L1 7 Z" fill={color} />
            </marker>
          </g>
        ))}
      </defs>
    </svg>
  );
}

function markerUrl(name: 'closed-arrow' | 'open-arrow' | 'diamond' | 'diamond-filled', selected: boolean) {
  const tone = selected ? 'indigo' : 'slate';
  return `url(#uml-${name === 'closed-arrow' ? 'arrow' : name}-${tone})`;
}

/* ------------------------------------------------------------------ */
/*  Custom relationship edge with inline label editing.                */
/* ------------------------------------------------------------------ */

function RelationshipEdgeComponent(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected, label, style } = props;
  const updateEdge = useEditorStore((s) => s.updateEdge);

  const relationship = (data as RelationshipEdgeData | undefined)?.relationship ?? 'association';
  const config = RELATIONSHIP_STYLE[relationship] ?? RELATIONSHIP_STYLE.association;
  const color = (data as RelationshipEdgeData | undefined)?.color ?? DEFAULT_EDGE_COLOR;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const strokeColor = selected ? SELECTED_EDGE_COLOR : color;
  const showLabel = !!(label ?? draft);

  const commit = () => {
    updateEdge(id, { label: draft.trim() || undefined });
    setEditing(false);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...(style as React.CSSProperties | undefined),
          stroke: strokeColor,
          strokeWidth: selected ? 2 : 1.5,
          ...(config.dash ? { strokeDasharray: config.dash } : {}),
        }}
        markerStart={config.markerStart ? markerUrl(config.markerStart, selected) : undefined}
        markerEnd={config.markerEnd ? markerUrl(config.markerEnd, selected) : undefined}
      />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-auto absolute z-20"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') setEditing(false);
                }}
                className="h-6 w-40 rounded border border-indigo-400 bg-white px-1.5 font-mono text-[10px] text-slate-700 shadow-lift focus:outline-none"
                placeholder="label"
                onDoubleClick={(e) => e.stopPropagation()}
              />
            ) : (
              <button
                type="button"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setDraft(label ?? '');
                  setEditing(true);
                }}
                className={cn(
                  'rounded border border-transparent px-1.5 py-0.5 font-mono text-[10px] shadow-sm transition-colors hover:border-slate-300',
                  selected ? 'bg-indigo-50 text-indigo-600' : 'bg-white/95 text-slate-600',
                )}
                title="Double-click to edit label"
              >
                {label}
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);

export function relationshipLabel(type: RelationshipType) {
  return RELATIONSHIP_LABELS[type] ?? 'Association';
}