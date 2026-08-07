import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import type { Diagram } from '@/types';

export function ValidationPanel({ diagram }: { diagram: Diagram }) {
  const analysis = useMemo(() => {
    const nodes = diagram.nodes;
    const edges = diagram.edges;
    const ids = new Set<string>();
    const duplicates: string[] = [];
    nodes.forEach((n) => {
      if (ids.has(n.id)) duplicates.push(n.id);
      ids.add(n.id);
    });
    edges.forEach((e) => {
      if (ids.has(e.id)) duplicates.push(e.id);
      ids.add(e.id);
    });

    const warnings: string[] = [];
    const classNodes = nodes.filter((n) => n.type === 'classNode');
    if (classNodes.length >= 2 && classNodes.some((n) => !n.data.attributes?.length && !n.data.methods?.length)) {
      warnings.push(`${classNodes.find((n) => !n.data.attributes?.length && !n.data.methods?.length)?.data.label} class has no members`);
    }
    classNodes.forEach((n) => {
      if (n.data.attributes?.length && !n.data.methods?.length) {
        warnings.push(`${n.data.label} class has no methods`);
      }
    });
    const connected = new Set<string>();
    edges.forEach((e) => {
      connected.add(e.source);
      connected.add(e.target);
    });
    const isolated = nodes.filter((n) => n.type !== 'genericNode' && !connected.has(n.id));
    if (isolated.length > 0) {
      warnings.push(`${isolated.map((n) => n.data.label).slice(0, 2).join(' and ')} ${isolated.length > 1 ? 'have' : 'has'} no relationship with other elements`);
    }

    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      duplicates,
      warnings,
    };
  }, [diagram]);

  const issues = analysis.warnings.length + analysis.duplicates.length;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Diagram Analysis</p>
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              issues === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {issues === 0 ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {issues === 0 ? 'Healthy' : `${issues} issue${issues > 1 ? 's' : ''}`}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-400">Runs automatically on every change</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[13px] text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>
              <strong className="font-semibold">{analysis.nodeCount}</strong> valid nodes
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>
              <strong className="font-semibold">{analysis.edgeCount}</strong> valid relationships
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-700">
            {analysis.duplicates.length === 0 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <span>
              <strong className="font-semibold">{analysis.duplicates.length === 0 ? 'No' : analysis.duplicates.length}</strong>{' '}
              duplicate identifier{analysis.duplicates.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {analysis.warnings.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">Warnings</p>
            <div className="space-y-1.5">
              {analysis.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-[13px] text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  {w}
                </div>
              ))}
            </div>
          </div>
        )}

        {issues === 0 && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-[13px] text-emerald-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            The diagram is structurally valid and ready to export.
          </div>
        )}

        <div className="mt-5 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-[12px] leading-relaxed text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          Warnings are informational — your diagram can still be exported with warnings present.
        </div>
      </div>
    </div>
  );
}