import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Columns3,
  FilePlus2,
  Grid2x2,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PROJECTS, type Project } from '@/data/projects';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DiagramPreview } from '@/components/diagram/DiagramPreview';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, MenuDivider, MenuItem } from '@/components/ui/Dropdown';
import { Field, Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { DIAGRAM_TYPE_LABELS, DIAGRAMS_BY_TYPE, uid } from '@/data/diagrams';
import { cn } from '@/lib/cn';
import type { DiagramType } from '@/types';

const SORTS = ['Last edited', 'Name', 'Diagram count'] as const;

export function Projects() {
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', PROJECTS);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Last edited');
  const [filter, setFilter] = useState<'all' | DiagramType>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<DiagramType>('class');

  const filtered = useMemo(() => {
    let list = [...projects];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (filter !== 'all') list = list.filter((p) => p.diagramType === filter);
    list.sort((a, b) => {
      if (sort === 'Name') return a.name.localeCompare(b.name);
      return a.lastEdited.localeCompare(b.lastEdited);
    });
    return list;
  }, [projects, query, sort, filter]);

  const createProject = () => {
    const base = DIAGRAMS_BY_TYPE[newType];
    const project: Project = {
      id: uid('prj'),
      name: newName.trim() || 'Untitled project',
      description: newDesc.trim() || 'New diagram project.',
      diagramType: newType,
      diagramCount: 1,
      lastEdited: 'just now',
      preview: {
        ...base,
        name: newName.trim() || 'Untitled diagram',
      },
    };
    setProjects([project, ...projects]);
    setCreateOpen(false);
    setNewName('');
    setNewDesc('');
    toast('success', `Created "${project.name}"`);
  };

  const removeProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    toast('info', 'Project deleted');
  };

  const toggleStar = (id: string) => {
    setProjects(projects.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">{filtered.length} projects</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <FilePlus2 className="h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1 sm:flex-none">
          <Columns3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="h-9.5 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-64"
          />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | DiagramType)} className="!w-auto">
          <option value="all">All types</option>
          {(Object.keys(DIAGRAM_TYPE_LABELS) as DiagramType[]).map((t) => (
            <option key={t} value={t}>
              {DIAGRAM_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])} className="!w-auto">
          {SORTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <div className="ml-auto flex overflow-hidden rounded-lg border border-slate-300 bg-white">
          <button
            onClick={() => setView('grid')}
            className={cn('px-2.5 py-2 transition-colors', view === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50')}
            aria-label="Grid view"
          >
            <Grid2x2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn('px-2.5 py-2 transition-colors', view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <LayoutGrid className="mb-3 h-8 w-8 text-slate-300" />
          <p className="font-medium text-slate-700">No projects found</p>
          <p className="mt-1 text-sm text-slate-400">Try a different search or create a new project.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft transition-shadow hover:shadow-lift"
            >
              <button
                onClick={() => navigate(`/app/editor/${p.id}`)}
                className="grid-bg block h-44 w-full cursor-pointer border-b border-slate-100"
              >
                <DiagramPreview diagram={p.preview} className="p-2" />
              </button>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900 hover:text-indigo-600">{p.name}</h3>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.description}</p>
                  </div>
                  <Dropdown
                    trigger={() => (
                      <button
                        className="mt-0.5 shrink-0 rounded-md p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 focus:opacity-100 group-hover:opacity-100"
                        aria-label="Project menu"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    )}
                  >
                    {(close) => (
                      <>
                        <MenuItem icon={<Pencil className="h-4 w-4" />} label="Rename" onClick={close} />
                        <MenuItem
                          icon={<Star className={cn('h-4 w-4', p.starred && 'fill-amber-400 text-amber-400')} />}
                          label={p.starred ? 'Unstar' : 'Star'}
                          onClick={() => {
                            toggleStar(p.id);
                            close();
                          }}
                        />
                        <MenuDivider />
                        <MenuItem
                          icon={<Trash2 className="h-4 w-4" />}
                          label="Delete"
                          danger
                          onClick={() => {
                            removeProject(p.id);
                            close();
                          }}
                        />
                      </>
                    )}
                  </Dropdown>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <Badge>{DIAGRAM_TYPE_LABELS[p.diagramType]}</Badge>
                  <span className="text-xs text-slate-400">
                    {p.diagramCount} diagrams · {p.lastEdited}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50/60"
            >
              <button onClick={() => navigate(`/app/editor/${p.id}`)} className="grid-bg h-11 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border border-slate-100">
                <DiagramPreview diagram={p.preview} />
              </button>
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => navigate(`/app/editor/${p.id}`)}
                  className="truncate text-sm font-semibold text-slate-900 hover:text-indigo-600"
                >
                  {p.name}
                </button>
                <p className="truncate text-xs text-slate-500">{p.description}</p>
              </div>
              <Badge className="hidden sm:inline-flex">{DIAGRAM_TYPE_LABELS[p.diagramType]}</Badge>
              <span className="hidden w-24 text-right text-xs text-slate-400 md:block">{p.diagramCount} diagrams</span>
              <span className="w-24 truncate text-right text-xs text-slate-400">{p.lastEdited}</span>
              <Dropdown
                trigger={() => (
                  <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Project menu">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                )}
              >
                {(close) => (
                  <>
                    <MenuItem
                      icon={<Star className={cn('h-4 w-4', p.starred && 'fill-amber-400 text-amber-400')} />}
                      label={p.starred ? 'Unstar' : 'Star'}
                      onClick={() => {
                        toggleStar(p.id);
                        close();
                      }}
                    />
                    <MenuDivider />
                    <MenuItem
                      icon={<Trash2 className="h-4 w-4" />}
                      label="Delete"
                      danger
                      onClick={() => {
                        removeProject(p.id);
                        close();
                      }}
                    />
                  </>
                )}
              </Dropdown>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a new project"
        description="Start with a blank canvas and generate a diagram with AI."
      >
        <div className="space-y-4">
          <Field label="Project name">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Library Management System" autoFocus />
          </Field>
          <Field label="Description">
            <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What does this system do?" />
          </Field>
          <Field label="Initial diagram type">
            <Select value={newType} onChange={(e) => setNewType(e.target.value as DiagramType)}>
              {(Object.keys(DIAGRAM_TYPE_LABELS) as DiagramType[]).map((t) => (
                <option key={t} value={t}>
                  {DIAGRAM_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button onClick={createProject}>Create project</Button>
        </div>
      </Modal>
    </div>
  );
}