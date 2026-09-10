import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { Box, ChevronLeft, LayoutTemplate, Maximize2, Redo2, Save, Sparkles, Undo2, X } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEditorStore } from '@/store/editor-store';
import { GanttEditor } from './gantt-editor';
import { DiagramTools } from './diagram-tools';
import { EditorCanvas } from './canvas';
import { ShapeLibrary } from './shape-library';
import { PropertiesPanel } from './properties-panel';
import { TemplatePanel } from './template-panel';
import { GenerateModal } from '@/components/diagram/GenerateModal';
import { ExportMenu } from '@/components/export/ExportMenu';
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
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const toDiagram = useEditorStore((state) => state.toDiagram);
  const content = useEditorStore(useShallow((state) => [state.diagramId, state.name, state.type, state.nodes, state.edges, state.gantt, state.layers, state.canvasBackground, state.showGrid, state.snapToGrid, state.smartGuides, state.routing, state.theme]));
  const diagram = useMemo(() => toDiagram(), [toDiagram, content]);
  const name = useEditorStore((state) => state.name);
  const loadDiagram = useEditorStore((state) => state.loadDiagram);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [focusCanvas, setFocusCanvas] = useState(false);
  useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => { if (useEditorStore.getState().type !== 'gantt') void fitView({ padding: 0.2, maxZoom: 1.1 }); })); }, [focusCanvas, fitView]);
  const [libraryTab, setLibraryTab] = useState<'shapes' | 'templates'>('shapes');
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);
  const showTemplates = () => { setFocusCanvas(false); setLibraryTab('templates'); setMobileLibraryOpen(true); };
  const onInsert = useCallback(() => { setMobileLibraryOpen(false); requestAnimationFrame(() => { void fitView({ padding: 0.2, maxZoom: 1.1, duration: 200 }); }); }, [fitView]);
  useEffect(() => { window.addEventListener('umlforge:shape-inserted', onInsert); return () => window.removeEventListener('umlforge:shape-inserted', onInsert); }, [onInsert]);
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
      initial.ownerId = userId;
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
      if (document.querySelector('[role=dialog][aria-modal=true]')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void save(); return; }
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName);
      if (typing || (event.target as HTMLElement).isContentEditable || generateOpen || (event.target as HTMLElement).closest('[role=dialog]')) return;
      const state = useEditorStore.getState();
      if (state.type !== 'gantt') {
        const key = event.key.toLowerCase();
        if (event.ctrlKey || event.metaKey) {
          const actions: Record<string, () => void> = { c: state.copySelected, v: state.paste, d: state.duplicateSelected, a: state.selectAll, g: () => state.groupSelected(event.shiftKey) };
          if (actions[key]) { event.preventDefault(); actions[key](); }
        }
        if (['Delete', 'Backspace'].includes(event.key)) { event.preventDefault(); state.deleteSelected(); }
        if (['+', '='].includes(event.key)) { event.preventDefault(); void zoomIn(); }
        if (event.key === '-') { event.preventDefault(); void zoomOut(); }
        if (event.key === '0') { event.preventDefault(); void fitView({ padding: 0.2 }); }
      }
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      if (mod && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
      if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); void save(); }
      if (event.key === 'Escape') setChatOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [save, redo, undo, zoomIn, zoomOut, fitView, generateOpen]);

  if (!hydrated) return <div role="status" className="grid h-screen place-items-center text-slate-500">Loading diagram…</div>;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
        <button onClick={() => navigate('/app')} className="flex items-center gap-2" aria-label="Back to UML Forge dashboard"><ChevronLeft className="h-4 w-4 text-slate-400" /><Logo markClassName="h-7 w-7 rounded-md" className="[&>span:last-child]:hidden" /></button>
        <div className="hidden h-6 w-px bg-slate-200 sm:block" />
        <div className="min-w-0 w-28 sm:w-48"><input value={name} onChange={e => useEditorStore.getState().setName(e.target.value)} className="w-full truncate rounded bg-transparent focus:bg-slate-50 focus:ring-2 focus:ring-indigo-400 text-sm font-semibold outline-none" aria-label="Diagram name" /><div className="flex items-center gap-1 text-[11px] text-slate-400"><span className={cn('h-1.5 w-1.5 rounded-full', saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-400')} />{{ saved: 'Saved', saving: 'Saving...', local: 'Saved locally · sync failed', error: 'Save failed' }[saveStatus]}</div></div>
        <div className="mx-auto hidden items-center gap-1 md:flex"><button className="toolbar-icon" onClick={undo} disabled={!canUndo} aria-label="Undo"><Undo2 className="h-4 w-4" /></button><button className="toolbar-icon" onClick={redo} disabled={!canRedo} aria-label="Redo"><Redo2 className="h-4 w-4" /></button>{diagram.type !== 'gantt' && <FlowTools />}<button className="toolbar-icon" aria-label={focusCanvas ? 'Exit focus mode' : 'Focus canvas'} title={focusCanvas ? 'Show editor panels' : 'Hide panels for more drawing space'} onClick={() => setFocusCanvas(value => !value)}><Maximize2 className="h-4 w-4" /></button></div>
        <div className="ml-auto flex items-center gap-1.5"><Button aria-label="AI Assistant" variant="ghost" size="sm" onClick={() => setChatOpen((open) => !open)}><Sparkles className="h-4 w-4" /><span className="hidden sm:inline">AI Assistant</span></Button><ExportMenu diagram={diagram} /><Button aria-label="Save" size="sm" onClick={() => { void save(); }}><Save className="h-4 w-4" /><span className="hidden sm:inline">Save</span></Button></div>
      </header>
      <div className="flex min-h-0 flex-1">
        {!focusCanvas && <aside className={cn('absolute top-14 bottom-0 left-0 z-30 w-full max-w-[390px] shrink-0 border-r border-slate-200 bg-white shadow-lift lg:static lg:z-auto lg:flex lg:flex-col lg:w-72 2xl:w-[390px] lg:max-w-none lg:shadow-none', mobileLibraryOpen ? 'flex flex-col' : 'hidden')}><div className="flex shrink-0 items-center border-b border-slate-200 px-3 py-2"><div className="flex min-w-0 flex-1 gap-1 rounded-lg bg-slate-100 p-1"><button className={cn('flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors', libraryTab === 'shapes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')} onClick={() => setLibraryTab('shapes')}>Shapes</button><button className={cn('flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors', libraryTab === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')} onClick={() => setLibraryTab('templates')}>Templates</button></div><button className="ml-2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden" onClick={() => setMobileLibraryOpen(false)} aria-label="Close library"><X className="h-4 w-4" /></button></div><div className="min-h-0 flex-1">{libraryTab === 'shapes' && diagram.type !== 'gantt' ? <ShapeLibrary /> : <TemplatePanel onApplied={onInsert} />}</div><div className="shrink-0 border-t border-slate-200 p-3"><Button variant="accent" size="sm" className="w-full" onClick={() => setGenerateOpen(true)}><Sparkles className="h-3.5 w-3.5" /> Generate with AI</Button></div></aside>}
        <main className="relative flex min-w-0 flex-1 flex-col"><div className="relative min-h-0 flex-1">{diagram.type === 'gantt' ? <GanttEditor /> : <EditorCanvas />}{diagram.type !== 'gantt' && !diagram.nodes.length && <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6"><div className="pointer-events-auto max-w-sm rounded-xl border bg-white/95 p-6 text-center shadow-sm"><h1 className="font-semibold">Start your diagram</h1><p className="mt-2 text-sm text-slate-500">Choose a template, describe your assignment to AI, or click a shape in the library. Double-click a shape to rename it; drag between its dots to connect.</p><div className="mt-4 flex flex-wrap justify-center gap-2"><Button size="sm" onClick={showTemplates}>Choose a template</Button><Button size="sm" variant="outline" onClick={() => setGenerateOpen(true)}>Generate with AI</Button></div></div></div>}</div><nav aria-label="Diagram tools" className={cn("flex shrink-0 items-center gap-2 border-t bg-white p-2", !focusCanvas && "lg:hidden")}>{diagram.type !== 'gantt' && <Button size="sm" variant="ghost" onClick={() => { setFocusCanvas(false); setLibraryTab('shapes'); setMobileLibraryOpen(true); }}><Box className="h-4 w-4" />Shapes</Button>}<Button size="sm" variant="ghost" onClick={showTemplates}><LayoutTemplate className="h-4 w-4" />Templates</Button><Button size="sm" variant="accent" className="ml-auto" onClick={() => setGenerateOpen(true)}><Sparkles className="h-4 w-4" />AI</Button></nav></main>
        {!focusCanvas && diagram.type !== 'gantt' && <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white md:block"><DiagramTools /><PropertiesPanel /></aside>}
        {chatOpen && <aside className="fixed inset-y-14 right-0 z-30 w-80 border-l border-slate-200 bg-white shadow-lift md:absolute md:inset-y-14"><AIChat diagram={normalizeDiagram(diagram)} collapsed={false} onDiagramChange={(next) => useEditorStore.getState().applyDiagram(normalizeDiagram(next))} /></aside>}
      </div>
      <GenerateModal initialType={diagram.type} onTemplates={() => { setGenerateOpen(false); showTemplates(); }} open={generateOpen} onClose={() => setGenerateOpen(false)} onGenerated={(next) => { useEditorStore.getState().applyDiagram(normalizeDiagram({ ...next, id: diagram.id })); setGenerateOpen(false); }} />
    </div>
  );
}
