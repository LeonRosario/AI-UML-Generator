import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { Box, ChevronLeft, LayoutTemplate, Redo2, Save, Share2, Sparkles, Undo2, X } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEditorStore } from '@/store/editor-store';
import { EditorCanvas } from './canvas';
import { ShapeLibrary } from './shape-library';
import { PropertiesPanel } from './properties-panel';
import { TemplatePanel } from './template-panel';
import { GenerateModal } from '@/components/diagram/GenerateModal';
import { AIChat } from '@/components/ai/AIChat';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { fetchDiagram, persistDiagram } from '@/lib/editor/api';
import { normalizeDiagram } from '@/lib/editor/diagram-utils';
import { cn } from '@/lib/cn';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from '@/services/auth';
import { PROJECTS } from '@/data/projects';
import { TEMPLATES } from '@/data/templates';
import { DIAGRAM_TYPE_LABELS } from '@/data/diagrams';
import type { DiagramType, Project } from '@/types';
import { createBlankDiagram } from '@/lib/editor/diagram-utils';

function FlowTools() {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  return (
    <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
      <button className="toolbar-icon" onClick={() => void zoomOut()} aria-label="Zoom out"><span>-</span></button>
      <button className="min-w-12 text-center text-xs font-medium text-slate-500" onClick={() => void fitView({ padding: 0.2 })}>Fit</button>
      <button className="toolbar-icon" onClick={() => void zoomIn()} aria-label="Zoom in"><span>+</span></button>
    </div>
  );
}

export function UmlEditor() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const requestedType = searchParams.get('type');
  return <ReactFlowProvider key={`${user?.id}:${projectId ?? 'last'}:${templateId}:${requestedType}`}><EditorSession projectId={projectId} userId={user?.id ?? 'local'} templateId={templateId} requestedType={requestedType} /></ReactFlowProvider>;
}

function EditorSession({ projectId, userId, templateId, requestedType }: { projectId?: string; userId: string; templateId: string | null; requestedType: string | null }) {
  const navigate = useNavigate();
  const toDiagram = useEditorStore((state) => state.toDiagram);
  const content = useEditorStore(useShallow((state) => [state.diagramId, state.name, state.type, state.nodes, state.edges]));
  const diagram = useMemo(() => toDiagram(), [toDiagram, content]);
  const name = useEditorStore((state) => state.name);
  const loadDiagram = useEditorStore((state) => state.loadDiagram);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'shapes' | 'templates'>('shapes');
  // Start compact editor views in the library so narrow browser windows do not
  // render a clipped desktop sidebar. Users can close it to return to canvas.
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches);
  const [chatOpen, setChatOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'local' | 'error'>('saved');
  const [hydrated, setHydrated] = useState(false);
  const saveSequence = useRef(0);
  const lastDiagramKey = `umlforge:last-editor-diagram:${userId}`;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Let StrictMode cancel its initial effect before creating a new diagram.
      await Promise.resolve();
      if (cancelled) return;
      let projects = PROJECTS;
      try { const stored = JSON.parse(localStorage.getItem('projects') ?? 'null'); if (Array.isArray(stored)) projects = stored; } catch { /* use built-in examples */ }
      const project = (projects as Project[]).find((item) => item.id === projectId);
      const id = project ? `${userId}-${project.id}` : projectId === 'new' ? null : projectId ?? localStorage.getItem(lastDiagramKey);
      const savedDiagram = id ? await fetchDiagram(id) : null;
      if (cancelled) return;
      const template = projectId === 'new' ? TEMPLATES.find((item) => item.id === templateId) : undefined;
      const type = requestedType && requestedType in DIAGRAM_TYPE_LABELS ? requestedType as DiagramType : 'class';
      const blank = createBlankDiagram(template?.diagramType ?? type, template?.name);
      const initial = savedDiagram ?? (project
        ? normalizeDiagram({ ...project.preview, id: id!, name: project.name })
        : template ? normalizeDiagram({ ...template.diagram, id: blank.id, name: template.name, createdAt: blank.createdAt, updatedAt: blank.updatedAt }) : blank);
      if (projectId === 'new') {
        // Persist before changing the URL so reload opens this exact copy.
        await persistDiagram(initial);
        if (!cancelled) navigate(`/app/editor/${initial.id}`, { replace: true });
        return;
      }
      loadDiagram(initial);
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [projectId, lastDiagramKey, loadDiagram, userId, templateId, requestedType, navigate]);

  const save = useCallback(async () => {
    if (!hydrated) return;
    const sequence = ++saveSequence.current;
    setSaveStatus('saving');
    try {
      const synced = await persistDiagram(diagram);
      if (sequence === saveSequence.current) setSaveStatus(synced ? 'saved' : 'local');
    } catch {
      if (sequence === saveSequence.current) setSaveStatus('error');
    }
  }, [diagram, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setSaveStatus('saving');
    const timer = window.setTimeout(() => void save(), 700);
    return () => { window.clearTimeout(timer); ++saveSequence.current; };
  }, [save, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(lastDiagramKey, diagram.id);
  }, [diagram.id, hydrated, lastDiagramKey]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName);
      if (typing) return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      if (mod && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
      if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); void save(); }
      if (event.key === 'Escape') setChatOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [save, redo, undo]);

  if (!hydrated) return <div role="status" className="grid h-screen place-items-center text-slate-500">Loading diagram…</div>;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
        <button onClick={() => navigate('/app')} className="flex items-center gap-2" aria-label="Back to UML Forge dashboard"><ChevronLeft className="h-4 w-4 text-slate-400" /><Logo markClassName="h-7 w-7 rounded-md" className="[&>span:last-child]:hidden" /></button>
        <div className="hidden h-6 w-px bg-slate-200 sm:block" />
        <div className="min-w-0"><input value={name} readOnly className="w-48 truncate bg-transparent text-sm font-semibold outline-none" aria-label="Diagram name" /><div className="flex items-center gap-1 text-[11px] text-slate-400"><span className={cn('h-1.5 w-1.5 rounded-full', saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-400')} />{{ saved: 'Saved', saving: 'Saving...', local: 'Saved locally · sync failed', error: 'Save failed' }[saveStatus]}</div></div>
        <div className="mx-auto hidden items-center gap-1 md:flex"><button className="toolbar-icon" onClick={undo} disabled={!canUndo} aria-label="Undo"><Undo2 className="h-4 w-4" /></button><button className="toolbar-icon" onClick={redo} disabled={!canRedo} aria-label="Redo"><Redo2 className="h-4 w-4" /></button><FlowTools /></div>
        <div className="ml-auto flex items-center gap-1.5"><Button variant="ghost" size="sm" onClick={() => setChatOpen((open) => !open)}><Sparkles className="h-4 w-4" /> AI Assistant</Button><Button variant="ghost" size="sm"><Share2 className="h-4 w-4" /> Share</Button><Button size="sm" onClick={() => { void save(); }}><Save className="h-4 w-4" /> Save</Button><button className="hidden h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white sm:flex" aria-label="User account">U</button></div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className={cn('absolute inset-y-0 left-0 z-30 w-full max-w-[390px] shrink-0 border-r border-slate-200 bg-white shadow-lift xl:static xl:z-auto xl:flex xl:flex-col xl:w-[390px] xl:max-w-none xl:shadow-none', mobileLibraryOpen ? 'flex flex-col' : 'hidden')}><div className="flex shrink-0 items-center border-b border-slate-200 px-3 py-2"><div className="flex min-w-0 flex-1 gap-1 rounded-lg bg-slate-100 p-1"><button className={cn('flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors', libraryTab === 'shapes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')} onClick={() => setLibraryTab('shapes')}>Shapes</button><button className={cn('flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors', libraryTab === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')} onClick={() => setLibraryTab('templates')}>Templates</button></div><button className="ml-2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 xl:hidden" onClick={() => setMobileLibraryOpen(false)} aria-label="Close library"><X className="h-4 w-4" /></button></div><div className="min-h-0 flex-1">{libraryTab === 'shapes' ? <ShapeLibrary /> : <TemplatePanel />}</div><div className="shrink-0 border-t border-slate-200 p-3"><Button variant="accent" size="sm" className="w-full" onClick={() => setGenerateOpen(true)}><Sparkles className="h-3.5 w-3.5" /> Generate with AI</Button></div></aside>
        <main className="relative min-w-0 flex-1"><EditorCanvas /><div className="absolute inset-y-0 left-0 z-10 flex w-16 flex-col justify-end bg-slate-900 xl:hidden"><button onClick={() => { setLibraryTab('shapes'); setMobileLibraryOpen(true); }} className="flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-white"><Box className="h-4 w-4" />Shapes</button></div><button onClick={() => { setLibraryTab('templates'); setMobileLibraryOpen(true); }} className="absolute bottom-0 left-16 z-10 flex h-14 items-center gap-1 bg-white px-3 text-[10px] font-semibold text-slate-800 shadow-sm xl:hidden"><LayoutTemplate className="h-3.5 w-3.5" />Templates</button><div className="absolute bottom-3 right-3 z-10 xl:hidden"><Button size="sm" variant="accent" onClick={() => setGenerateOpen(true)}><Sparkles className="h-3.5 w-3.5" /> AI</Button></div></main>
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white md:block"><PropertiesPanel /></aside>
        {chatOpen && <aside className="fixed inset-y-14 right-0 z-30 w-80 border-l border-slate-200 bg-white shadow-lift md:absolute md:inset-y-14"><AIChat diagram={normalizeDiagram(diagram)} collapsed={false} onDiagramChange={(next) => loadDiagram(normalizeDiagram(next))} /></aside>}
      </div>
      <GenerateModal open={generateOpen} onClose={() => setGenerateOpen(false)} onGenerated={(next) => { loadDiagram(normalizeDiagram({ ...next, id: diagram.id })); setGenerateOpen(false); }} />
    </div>
  );
}
