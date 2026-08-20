import { useMemo, useState } from 'react';
import { LayoutTemplate, Search } from 'lucide-react';
import { TEMPLATES } from '@/data/templates';
import { DIAGRAM_TYPE_LABELS } from '@/data/diagrams';
import { templateToDiagram } from '@/lib/editor/diagram-utils';
import { useEditorStore } from '@/store/editor-store';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

const CATEGORIES = ['All', 'E-Commerce', 'Banking', 'Hospital', 'Library', 'Student Management', 'Food Delivery', 'Social Media', 'Authentication', 'Online Shopping'];

export function TemplatePanel() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const replaceAll = useEditorStore((s) => s.replaceAll);
  const setType = useEditorStore((s) => s.setType);
  const setName = useEditorStore((s) => s.setName);
  const toast = useToast();

  const filtered = useMemo(() => {
    let list = TEMPLATES;
    if (category !== 'All') list = list.filter((t) => t.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    return list;
  }, [category, query]);

  const apply = (id: string) => {
    const template = TEMPLATES.find((t) => t.id === id);
    if (!template) return;
    const diagram = templateToDiagram(template);
    replaceAll(diagram.nodes, diagram.edges);
    setType(diagram.type);
    setName(diagram.name);
    toast('success', `Loaded template "${template.name}" — everything is editable`);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-[13px] placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
                category === c
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
        {filtered.length === 0 && <p className="px-2 py-6 text-center text-xs text-slate-400">No templates found.</p>}
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => apply(t.id)}
            className="group w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-500">
                <LayoutTemplate className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800 group-hover:text-indigo-600">
                {t.name}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{t.description}</p>
            <div className="mt-2">
              <Badge variant="outline" className="!border-slate-200 !bg-slate-50 !text-slate-500">
                {DIAGRAM_TYPE_LABELS[t.diagramType]}
              </Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}