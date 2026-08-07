import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { PROJECTS } from '@/data/projects';
import { DiagramPreview } from '@/components/diagram/DiagramPreview';
import { Badge } from '@/components/ui/Badge';
import { DIAGRAM_TYPE_LABELS } from '@/data/diagrams';

export function Recent() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recent</h1>
        <p className="mt-1 text-sm text-slate-500">Projects you have edited recently.</p>
      </div>

      <div className="space-y-2">
        {PROJECTS.map((p) => (
          <Link
            key={p.id}
            to={`/app/editor/${p.id}`}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-soft transition-shadow hover:shadow-lift"
          >
            <div className="grid-bg h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-100">
              <DiagramPreview diagram={p.preview} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{p.name}</p>
              <p className="truncate text-xs text-slate-500">{p.description}</p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Badge>{DIAGRAM_TYPE_LABELS[p.diagramType]}</Badge>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                {p.lastEdited}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}