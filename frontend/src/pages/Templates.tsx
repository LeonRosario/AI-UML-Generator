import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@/data/templates';
import { DiagramPreview } from '@/components/diagram/DiagramPreview';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DIAGRAM_TYPE_LABELS } from '@/data/diagrams';
import { cn } from '@/lib/cn';

export function Templates() {
  const [category, setCategory] = useState<string>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let list = TEMPLATES;
    if (category !== 'All') list = list.filter((t) => t.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    return list;
  }, [category, query]);

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Templates</h1>
        <p className="mt-1 text-sm text-slate-500">Start from a proven starting point and fine-tune with AI.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative mr-2 min-w-[12rem] flex-1 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="h-9.5 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-56"
          />
        </div>
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              category === c
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft transition-shadow hover:shadow-lift"
          >
            <div className="grid-bg h-48 border-b border-slate-100">
              <button
                onClick={() => navigate(`/app/editor/new?template=${t.id}&type=${t.diagramType}`)}
                className="h-full w-full cursor-pointer p-2 text-left"
                aria-label={`Use ${t.name}`}
              >
                <DiagramPreview diagram={t.diagram} />
              </button>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{t.name}</h3>
                <Badge>{t.category}</Badge>
              </div>
              <p className="mt-1 line-clamp-2 flex-1 text-xs text-slate-500">{t.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <Badge variant="outline" className="border-indigo-100 bg-indigo-50 text-indigo-500">
                    {DIAGRAM_TYPE_LABELS[t.diagramType]}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {t.uses.toLocaleString()} uses
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/app/editor/new?template=${t.id}&type=${t.diagramType}`)}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Use
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}