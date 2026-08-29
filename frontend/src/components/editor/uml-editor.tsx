import { useEffect, useRef, useState } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { Check, ChevronLeft, Download, Redo2, Save, Share2, Sparkles, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '@/store/editor-store';
import { EditorCanvas } from './canvas';
import { ShapeLibrary } from './shape-library';
import { PropertiesPanel } from './properties-panel';
import { TemplatePanel } from './template-panel';
import { GenerateModal } from '@/components/diagram/GenerateModal';
import { AIChat } from '@/components/ai/AIChat';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { persistDiagram } from '@/lib/editor/api';
import { normalizeDiagram } from '@/lib/editor/diagram-utils';
import { cn } from '@/lib/cn';

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
  const navigate = useNavigate();
  const toDiagram = useEditorStore((state) => state.toDiagram);
  const diagram = toDiagram();
  const name = useEditorStore((state) => state.name);
  const loadDiagram = useEditorStore((state) => state.loadDiagram);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'shapes' | 'templates'>('shapes');
  const [chatOpen, setChatOpen] = useState(false);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void persistDiagram(diagram).then(() => setSaved(true)).catch(() => setSaved(false));
    }, 700);
    setSaved(false);
    return () => window.clearTimeout(timer);
  }, [diagram]);

  useEffect(() => () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName);
      if (typing) return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      if (mod && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
      if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); void persistDiagram(diagram); setSaved(true); }
      if (event.key === 'Escape') setChatOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [diagram, redo, undo]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
        <button onClick={() => navigate('/app')} className="flex items-center gap-2" aria-label="Back to UML Forge dashboard"><ChevronLeft className="h-4 w-4 text-slate-400" /><Logo markClassName="h-7 w-7 rounded-md" className="[&>span:last-child]:hidden" /></button>
        <div className="hidden h-6 w-px bg-slate-200 sm:block" />
        <div className="min-w-0"><input value={name} readOnly className="w-48 truncate bg-transparent text-sm font-semibold outline-none" aria-label="Diagram name" /><div className="flex items-center gap-1 text-[11px] text-slate-400"><span className={cn('h-1.5 w-1.5 rounded-full', saved ? 'bg-emerald-500' : 'bg-amber-400')} />{saved ? 'Saved' : 'Saving...'}</div></div>
        <div className="mx-auto hidden items-center gap-1 md:flex"><button className="toolbar-icon" onClick={undo} disabled={!canUndo} aria-label="Undo"><Undo2 className="h-4 w-4" /></button><button className="toolbar-icon" onClick={redo} disabled={!canRedo} aria-label="Redo"><Redo2 className="h-4 w-4" /></button><FlowTools /></div>
        <div className="ml-auto flex items-center gap-1.5"><Button variant="ghost" size="sm" onClick={() => setChatOpen((open) => !open)}><Sparkles className="h-4 w-4" /> AI Assistant</Button><Button variant="ghost" size="sm"><Share2 className="h-4 w-4" /> Share</Button><Button size="sm" onClick={() => { void persistDiagram(diagram); setSaved(true); }}><Save className="h-4 w-4" /> Save</Button><button className="hidden h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white sm:flex" aria-label="User account">U</button></div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col"><div className="flex border-b border-slate-200 p-2"><button className={cn('flex-1 rounded-md px-2 py-1.5 text-xs font-semibold', libraryTab === 'shapes' && 'bg-slate-900 text-white')} onClick={() => setLibraryTab('shapes')}>Shapes</button><button className={cn('flex-1 rounded-md px-2 py-1.5 text-xs font-semibold', libraryTab === 'templates' && 'bg-slate-900 text-white')} onClick={() => setLibraryTab('templates')}>Templates</button></div><div className="min-h-0 flex-1">{libraryTab === 'shapes' ? <ShapeLibrary /> : <TemplatePanel />}</div><div className="border-t border-slate-200 p-2"><Button variant="accent" size="sm" className="w-full" onClick={() => setGenerateOpen(true)}><Sparkles className="h-3.5 w-3.5" /> Generate with AI</Button></div></aside>
        <main className="relative min-w-0 flex-1"><ReactFlowProvider><EditorCanvas /></ReactFlowProvider><div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-2 py-1.5 shadow-soft lg:hidden"><Button size="sm" variant="accent" onClick={() => setGenerateOpen(true)}><Sparkles className="h-3.5 w-3.5" /> AI</Button><Button size="sm" variant="ghost" onClick={() => setLibraryTab('shapes')}><Download className="h-3.5 w-3.5" /> Shapes</Button></div></main>
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white md:block"><PropertiesPanel /></aside>
        {chatOpen && <aside className="fixed inset-y-14 right-0 z-30 w-80 border-l border-slate-200 bg-white shadow-lift md:absolute md:inset-y-14"><AIChat diagram={normalizeDiagram(diagram)} collapsed={false} /></aside>}
      </div>
      <GenerateModal open={generateOpen} onClose={() => setGenerateOpen(false)} onGenerated={(next) => { loadDiagram(normalizeDiagram(next)); setGenerateOpen(false); }} />
    </div>
  );
}