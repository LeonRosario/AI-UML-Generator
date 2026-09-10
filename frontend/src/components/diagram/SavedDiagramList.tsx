import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import type { DiagramMeta } from '@/lib/editor/api';
import { DIAGRAM_TYPE_LABELS } from '@/data/diagrams';
import { Badge } from '@/components/ui/Badge';

export function SavedDiagramList({ diagrams, loading, error }: { diagrams: DiagramMeta[]; loading: boolean; error: string }) {
  if (loading) return <p role="status" className="p-6 text-sm text-slate-500">Loading your diagrams…</p>;
  if (error) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</p>;
  if (!diagrams.length) return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-medium">Your saved diagrams will appear here.</p><Link className="mt-2 inline-block text-sm text-indigo-600 underline" to="/app/templates">Start with a template</Link></div>;
  return <div className="space-y-2">{diagrams.map(d => <Link key={d.id} to={`/app/editor/${d.id}`} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-soft hover:border-indigo-300">
    <FileText className="h-6 w-6 shrink-0 text-indigo-500" />
    <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{d.name || 'Untitled diagram'}</p><p className="mt-1 text-xs text-slate-500">Edited {new Date(d.updatedAt).toLocaleString()}{d.saved === false ? ' · Saved on this device; sync pending' : ''}</p></div>
    <Badge>{DIAGRAM_TYPE_LABELS[d.type]}</Badge>
  </Link>)}</div>;
}
