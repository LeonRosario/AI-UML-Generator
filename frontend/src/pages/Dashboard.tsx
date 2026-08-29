import { Link } from 'react-router-dom';
import { ArrowUpRight, FilePlus2, FolderKanban, LayoutTemplate, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { PROJECTS } from '@/data/projects';
import { TEMPLATES } from '@/data/templates';
import { DiagramPreview } from '@/components/diagram/DiagramPreview';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DIAGRAM_TYPE_LABELS } from '@/data/diagrams';
import { useAuth } from '@/services/auth';

export function Dashboard() {
  const recent = PROJECTS.slice(0, 3);
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-slate-500">Pick up where you left off, or start something new.</p>
        </div>
        <Link to="/editor">
          <Button>
            <FilePlus2 className="h-4 w-4" /> Create New Diagram
          </Button>
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {[
          { label: 'Active projects', value: PROJECTS.length, icon: FolderKanban },
          { label: 'Total diagrams', value: PROJECTS.reduce((s, p) => s + p.diagramCount, 0) + 12, icon: LayoutTemplate },
          { label: 'AI credits left', value: '184', icon: Sparkles },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <s.icon className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Recent Projects</h2>
          <Link to="/app/projects" className="flex items-center gap-1 text-sm font-medium text-indigo-500 hover:text-indigo-600">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((p) => (
            <Link
              key={p.id}
              to={`/app/editor/${p.id}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft transition-shadow hover:shadow-lift"
            >
              <div className="grid-bg h-36 border-b border-slate-100">
                <DiagramPreview diagram={p.preview} className="p-2" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-semibold text-slate-900 group-hover:text-indigo-600">{p.name}</h3>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{p.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline">{DIAGRAM_TYPE_LABELS[p.diagramType]}</Badge>
                  <span className="text-xs text-slate-400">Edited {p.lastEdited}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Popular Templates</h2>
          <Link to="/app/templates" className="flex items-center gap-1 text-sm font-medium text-indigo-500 hover:text-indigo-600">
            Browse all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.slice(0, 4).map((t) => (
            <Link
              key={t.id}
              to={`/app/editor/new?template=${t.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-soft transition-shadow hover:shadow-lift"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                  <LayoutTemplate className="h-4 w-4" />
                </span>
                <Badge>{t.category}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600">{t.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{t.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}