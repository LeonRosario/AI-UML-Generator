import { useMemo } from 'react';
import type { Diagram } from '@/types';
import { cn } from '@/lib/cn';

const WIDTH: Record<string, number> = {
  classNode: 200,
  useCaseNode: 170,
  entityNode: 220,
  actorNode: 90,
  genericNode: 170,
};

function estimatedHeight(node: Diagram['nodes'][number]) {
  switch (node.type) {
    case 'classNode':
      return 58 + (node.data.attributes?.length ?? 0) * 16 + (node.data.methods?.length ?? 0) * 16;
    case 'entityNode':
      return 50 + (node.data.fields?.length ?? 0) * 16;
    case 'actorNode':
      return 84;
    case 'genericNode':
      return node.data.variant === 'decision' ? 76 : node.data.variant === 'lifeline' ? 120 : 42;
    default:
      return 44;
  }
}

const FILL: Record<string, string> = {
  classNode: '#1e293b',
  useCaseNode: '#eef2ff',
  entityNode: '#334155',
  actorNode: '#f1f5f9',
  genericNode: '#f8fafc',
};

const STROKE: Record<string, string> = {
  classNode: '#1e293b',
  useCaseNode: '#818cf8',
  entityNode: '#334155',
  actorNode: '#cbd5e1',
  genericNode: '#94a3b8',
};

export function DiagramPreview({ diagram, className, empty = false }: { diagram?: Diagram; className?: string; empty?: boolean }) {
  const { content, viewBox } = useMemo(() => {
    if (!diagram || empty) {
      return { viewBox: '0 0 400 260', content: null };
    }
    const pad = 24;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    diagram.nodes.forEach((n) => {
      const w = WIDTH[n.type] ?? 160;
      const h = estimatedHeight(n);
      minX = Math.min(minX, n.position.x - pad);
      minY = Math.min(minY, n.position.y - pad);
      maxX = Math.max(maxX, n.position.x + w + pad);
      maxY = Math.max(maxY, n.position.y + h + pad);
    });
    if (diagram.nodes.length === 0) return { content: null, viewBox: '0 0 400 260' };
    const vb = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

    const nodes = diagram.nodes.map((n) => {
      const w = WIDTH[n.type] ?? 160;
      const h = estimatedHeight(n);
      return { ...n, w, h };
    });

    const content = (
      <g>
        {diagram.edges.map((e) => {
          const s = nodes.find((n) => n.id === e.source);
          const t = nodes.find((n) => n.id === e.target);
          if (!s || !t) return null;
          const sx = s.position.x + s.w / 2;
          const sy = s.position.y + s.h / 2;
          const tx = t.position.x + t.w / 2;
          const ty = t.position.y + t.h / 2;
          const dx = tx - sx;
          const dy = ty - sy;
          const len = Math.hypot(dx, dy) || 1;
          const mx = (sx + tx) / 2 + (Math.abs(Math.atan2(dy, dx)) > 1.5 ? 30 : 6);
          return (
            <g key={e.id}>
              <path d={`M ${sx} ${sy} Q ${mx} ${sy} ${mx} ${ty} T ${tx} ${ty}`} fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
              {(() => {
                const ux = dx / len;
                const uy = dy / len;
                const ax = tx - ux * 10;
                const ay = ty - uy * 10;
                return <circle cx={ax} cy={ay} r="2.6" fill="#94a3b8" />;
              })()}
              {e.label && (
                <text x={(sx + tx) / 2} y={(sy + ty) / 2 - 4} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="JetBrains Mono, monospace">
                  {String(e.label)}
                </text>
              )}
            </g>
          );
        })}

        {nodes.map((n) => {
          const isEllipse = n.type === 'useCaseNode';
          const isActor = n.type === 'actorNode';
          const isDecision = n.type === 'genericNode' && n.data.variant === 'decision';
          const x = n.position.x;
          const y = n.position.y;
          return (
            <g key={n.id}>
              {isActor ? (
                <g>
                  <line x1={x + 45} y1={y + 6} x2={x + 45} y2={y + 22} stroke="#475569" strokeWidth="1.6" />
                  <circle cx={x + 45} cy={y + 2} r={4.4} fill="#475569" />
                  <line x1={x + 45} y1={y + 14} x2={x + 38} y2={y + 22} stroke="#475569" strokeWidth="1.4" />
                  <line x1={x + 45} y1={y + 14} x2={x + 52} y2={y + 22} stroke="#475569" strokeWidth="1.4" />
                  <line x1={x + 45} y1={y + 22} x2={x + 40} y2={y + 34} stroke="#475569" strokeWidth="1.4" />
                  <line x1={x + 45} y1={y + 22} x2={x + 50} y2={y + 34} stroke="#475569" strokeWidth="1.4" />
                  <text x={x + 45} y={y + 44} textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e293b">
                    {n.data.label}
                  </text>
                </g>
              ) : isEllipse ? (
                <ellipse cx={x + n.w / 2} cy={y + n.h / 2} rx={n.w / 2} ry={n.h / 2} fill={FILL[n.type]} stroke={STROKE[n.type]} strokeWidth="1.2" />
              ) : isDecision ? (
                <g>
                  <rect x={x} y={y} width={n.w} height={n.h} rx={n.w / 2} transform={`rotate(45 ${x + n.w / 2} ${y + n.h / 2})`} fill={FILL[n.type]} stroke={STROKE[n.type]} strokeWidth="1.2" />
                  <text x={x + n.w / 2} y={y + n.h / 2 + 3} textAnchor="middle" fontSize="8" fill="#334155">
                    {n.data.label}
                  </text>
                </g>
              ) : (
                <g>
                  <rect x={x} y={y} width={n.w} height={n.h} fill="white" stroke={STROKE[n.type]} strokeWidth="1.2" rx={n.type === 'genericNode' ? 6 : 6} />
                  <rect x={x} y={y} width={n.w} height="20" rx={6} fill={FILL[n.type]} />
                  <rect x={x} y={y + 10} width={n.w} height="10" fill={FILL[n.type]} />
                  <text x={x + n.w / 2} y={y + 13.5} textAnchor="middle" fontSize="8" fontWeight="700" fill="#f8fafc">
                    {n.data.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
    return { content, viewBox: vb };
  }, [diagram, empty]);

  return (
    <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" className={cn('h-full w-full', className)}>
      <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
      {content}
    </svg>
  );
}