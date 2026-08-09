import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type RefObject, type SetStateAction } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ReactFlowProvider, useReactFlow, type Connection, type Edge, type Viewport } from '@xyflow/react';
import {
  Box,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  CircleEllipsis,
  Database,
  History,
  ListChecks,
  MessageSquare,
  Save,
  Sparkles,
  User,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Diagram, DiagramType, VersionEntry } from '@/types';
import { DIAGRAMS_BY_TYPE } from '@/data/diagrams';
import { TEMPLATES } from '@/data/templates';
import { PROJECTS } from '@/data/projects';
import { createNode, buildPlantUml } from '@/lib/uml';
import { loadJSON, saveJSON } from '@/services/storage';
import { DiagramCanvas } from '@/components/diagram/DiagramCanvas';
import { GenerateModal } from '@/components/diagram/GenerateModal';
import { ValidationPanel } from '@/components/diagram/ValidationPanel';
import { VersionHistory } from '@/components/diagram/VersionHistory';
import { AIChat } from '@/components/ai/AIChat';
import { ExportMenu } from '@/components/export/ExportMenu';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

type Snapshot = { nodes: Diagram['nodes']; edges: Diagram['edges'] };

const PALETTE = [
  { type: 'actorNode', label: 'Actor', icon: User },
  { type: 'classNode', label: 'Class', icon: Box },
  { type: 'useCaseNode', label: 'Use Case', icon: CircleEllipsis },
  { type: 'entityNode', label: 'Entity', icon: Database },
];

function resolveInitial(searchParams: URLSearchParams): Diagram {
  const templateId = searchParams.get('template');
  if (templateId) {
    const t = TEMPLATES.find((x) => x.id === templateId);
    if (t) return { ...t.diagram, id: `diag-${Date.now()}`, name: t.name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
  const type = (searchParams.get('type') as DiagramType) ?? 'class';
  const base = DIAGRAMS_BY_TYPE[type] ?? DIAGRAMS_BY_TYPE.class;
  return {
    ...base,
    id: `diag-${Date.now()}`,
    name: 'Untitled diagram',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function Editor() {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const initial = useMemo(() => {
    const project = projectId && projectId !== 'new' ? PROJECTS.find((p) => p.id === projectId) : undefined;
    const base = project
      ? { ...project.preview, id: projectId as string }
      : resolveInitial(searchParams);
    const saved = loadJSON<Diagram | null>(`diagram:${base.id}`, null);
    return saved ?? base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const [name, setName] = useState(initial.name);
  const [nodes, setNodes] = useState(initial.nodes);
  const [edges, setEdges] = useState(initial.edges);

  const [versions, setVersions] = useState<VersionEntry[]>([
    { id: 'v1', version: 'v1', label: 'Initial diagram', timestamp: 'just now', diagram: initial },
  ]);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [rightTool, setRightTool] = useState<'chat' | 'analysis'>('chat');
  const [rightOpen, setRightOpen] = useState(true);

  /* ---------- undo / redo ---------- */
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [, force] = useState(0);

  const takeSnapshot = useCallback(() => ({ nodes, edges }), [nodes, edges]);

  const apply = useCallback((snap: Snapshot) => {
    setNodes(snap.nodes);
    setEdges(snap.edges);
  }, []);

  const commit = useCallback(
    (snap: Snapshot) => {
      past.current.push(takeSnapshot());
      if (past.current.length > 60) past.current.shift();
      future.current = [];
      apply(snap);
      setCanUndo(true);
      setCanRedo(false);
      force((n) => n + 1);
    },
    [takeSnapshot, apply],
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(takeSnapshot());
    apply(prev);
    setCanUndo(past.current.length > 0);
    setCanRedo(true);
  }, [takeSnapshot, apply]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(takeSnapshot());
    apply(next);
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
  }, [takeSnapshot, apply]);

  /* ---------- diagram ---------- */
  const currentDiagram: Diagram = useMemo(
    () => ({
      id: initial.id,
      name,
      type: initial.type,
      nodes,
      edges,
      createdAt: initial.createdAt,
      updatedAt: new Date().toISOString(),
    }),
    [initial, name, nodes, edges],
  );

  useEffect(() => {
    const t = window.setTimeout(() => saveJSON(`diagram:${initial.id}`, currentDiagram), 800);
    return () => window.clearTimeout(t);
  }, [currentDiagram, initial.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDiagram]);

  const save = useCallback(() => {
    setVersions((v) => {
      if (v[0]?.label === 'Manual save' && v[0]?.diagram.nodes === nodes) return v;
      return [{ id: `v${v.length + 1}`, version: `v${v.length + 1}`, label: 'Manual save', timestamp: 'just now', diagram: currentDiagram }, ...v];
    });
    saveJSON(`diagram:${initial.id}`, currentDiagram);
    setSaveFlash(true);
    window.setTimeout(() => setSaveFlash(false), 1400);
    toast('success', 'Diagram saved');
  }, [currentDiagram, initial.id, nodes, toast]);

  const onGenerated = useCallback(
    (diagram: Diagram) => {
      setName(diagram.name);
      past.current.push(takeSnapshot());
      setNodes(diagram.nodes);
      setEdges(diagram.edges);
      setVersions((v) => [{ id: `v${v.length + 1}`, version: `v${v.length + 1}`, label: `Generated ${diagram.type} diagram`, timestamp: 'just now', diagram }, ...v]);
      setGenerateOpen(false);
      toast('success', `Generated ${diagram.name}`);
    },
    [takeSnapshot, toast],
  );

  const addNode = useCallback(
    (nodeType: string, position: { x: number; y: number }) => {
      const node = createNode(nodeType, position);
      commit({ nodes: [...nodes, node], edges });
    },
    [nodes, edges, commit],
  );

  const editNode = useCallback(
    (id: string, label: string) => {
      commit({
        nodes: nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)),
        edges,
      });
    },
    [nodes, edges, commit],
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      commit({ nodes, edges: [...edges, { ...conn, id: `edge-${Date.now()}` }] });
    },
    [nodes, edges, commit],
  );

  const onDelete = useCallback(() => {
    commit(takeSnapshot());
  }, [takeSnapshot, commit]);

  const onDragStop = useCallback(() => {
    commit(takeSnapshot());
  }, [takeSnapshot, commit]);

  const restore = useCallback(
    (version: VersionEntry) => {
      past.current.push(takeSnapshot());
      setNodes(version.diagram.nodes);
      setEdges(version.diagram.edges);
      setVersions((v) => {
        const others = v.filter((x) => x.id !== version.id);
        return [{ ...version, timestamp: 'just now' }, ...others];
      });
      toast('success', `Restored ${version.version}`);
    },
    [takeSnapshot, toast],
  );

  const copyUml = useCallback(() => {
    void navigator.clipboard?.writeText(buildPlantUml(currentDiagram)).catch(() => undefined);
  }, [currentDiagram]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* ---------- Top bar ---------- */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 md:px-4">
        <div className="flex items-center gap-2">
          <a href="/app" className="flex items-center" aria-label="Back to dashboard">
            <Logo markClassName="h-6 w-6 rounded-md" className="[&>span:last-child]:hidden" />
          </a>
          <div className="hidden h-5 w-px bg-slate-200 sm:block" />
          <div className="hidden flex-col sm:flex">
            <span className="text-xs font-semibold text-slate-900">Student Management System</span>
            <span className="text-[11px] text-slate-400">Class diagram · auto-saved</span>
          </div>
        </div>

        <div className="mx-auto hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" className="text-slate-500" aria-label="Back">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700">Editor</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-500" aria-label="Version history" onClick={() => setHistoryOpen(true)}>
            <History className="h-4.5 w-4.5" />
          </Button>
          <ExportMenu diagram={currentDiagram} elementRef={canvasRef} onCopyUml={copyUml} />
          <Button variant="ghost" size="sm" className="text-slate-500" aria-label="Share">
            <ShareIcon /> Share
          </Button>
          <Button
            size="sm"
            onClick={save}
            className={cn('transition-colors', saveFlash && 'bg-emerald-600 hover:bg-emerald-600')}
          >
            {saveFlash ? <CheckSquare className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saveFlash ? 'Saved' : 'Save'}
          </Button>
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <div className="flex min-h-0 flex-1">
        {/* Palette */}
        <aside className="hidden w-44 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="border-b border-slate-200 p-3">
            <Button variant="accent" size="sm" className="w-full" onClick={() => setGenerateOpen(true)}>
              <Sparkles className="h-3.5 w-3.5" /> Generate with AI
            </Button>
          </div>
          <p className="px-3 pt-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">Elements</p>
          <div className="space-y-1 p-2.5">
            {PALETTE.map((p) => (
              <div
                key={p.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/umlforge', p.type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="flex cursor-grab items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-soft transition-all hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-lift active:cursor-grabbing"
              >
                <span className="h-4 w-4 text-slate-400">{<p.icon className="h-4 w-4" />}</span>
                {p.label}
              </div>
            ))}
          </div>
          <p className="mt-auto px-3 pb-4 text-[11px] leading-relaxed text-slate-400">
            Drag an element onto the canvas, or click to add at the center.
          </p>
        </aside>

        {/* Canvas */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ReactFlowProvider>
            <EditorFlow
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
              onConnect={onConnect}
              addNode={addNode}
              editNode={editNode}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onDelete={onDelete}
              onDragStop={onDragStop}
              onSave={save}
              arrowEdges={initial.type === 'use-case' || initial.type === 'activity'}
              canvasRef={canvasRef}
              rightOpen={rightOpen}
            />
          </ReactFlowProvider>
        </div>

        {/* Right panel */}
        <aside className={cn('relative hidden shrink-0 border-l border-slate-200 bg-white transition-[width] duration-200 md:block', rightOpen ? 'w-80' : 'w-10')}>
          {!rightOpen && (
            <div className="flex h-full flex-col items-center gap-1 border-r border-slate-200 bg-white py-2">
              <ToolTab icon={<MessageSquare className="h-4 w-4" />} label="AI Chat" active={rightTool === 'chat'} onClick={() => { setRightTool('chat'); setRightOpen(true); }} />
              <ToolTab icon={<ListChecks className="h-4 w-4" />} label="Analysis" active={rightTool === 'analysis'} onClick={() => { setRightTool('analysis'); setRightOpen(true); }} />
            </div>
          )}
          {rightOpen && (
            <motion.div className="flex h-full flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-1 border-b border-slate-200 px-2 py-2">
                <ToolTab icon={<MessageSquare className="h-4 w-4" />} label="AI Chat" active={rightTool === 'chat'} onClick={() => setRightTool('chat')} />
                <ToolTab icon={<ListChecks className="h-4 w-4" />} label="Analysis" active={rightTool === 'analysis'} onClick={() => setRightTool('analysis')} />
                <button
                  onClick={() => setRightOpen(false)}
                  className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Collapse panel"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                {rightTool === 'chat' ? <AIChat diagram={currentDiagram} collapsed={false} /> : <ValidationPanel diagram={currentDiagram} />}
              </div>
            </motion.div>
          )}
        </aside>

        {/* Mobile right panel */}
        {rightOpen && (
          <div className="fixed inset-y-14 right-0 z-30 w-72 border-l border-slate-200 bg-white md:hidden">
            <div className="flex items-center gap-1 border-b border-slate-200 px-2 py-2">
              <ToolTab icon={<MessageSquare className="h-4 w-4" />} label="AI" active={rightTool === 'chat'} onClick={() => setRightTool('chat')} />
              <ToolTab icon={<ListChecks className="h-4 w-4" />} label="Analysis" active={rightTool === 'analysis'} onClick={() => setRightTool('analysis')} />
              <button onClick={() => setRightOpen(false)} className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close panel">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[calc(100%-49px)]">
              {rightTool === 'chat' ? <AIChat diagram={currentDiagram} collapsed={false} /> : <ValidationPanel diagram={currentDiagram} />}
            </div>
          </div>
        )}
      </div>

      {/* Mobile palette bar */}
      <div className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-3 py-2 lg:hidden">
        <Button size="sm" variant="accent" onClick={() => setGenerateOpen(true)}>
          <Sparkles className="h-3.5 w-3.5" /> Generate
        </Button>
        <div className="flex gap-1.5 overflow-x-auto">
          {PALETTE.map((p) => (
            <div
              key={p.type}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('application/umlforge', p.type)}
              className="shrink-0 cursor-grab rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600"
            >
              {p.label}
            </div>
          ))}
        </div>
      </div>

      <GenerateModal open={generateOpen} onClose={() => setGenerateOpen(false)} onGenerated={onGenerated} />
      <VersionHistory open={historyOpen} onClose={() => setHistoryOpen(false)} versions={versions} onRestore={restore} />
    </div>
  );
}

function ToolTab({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */

function EditorFlow({
  nodes,
  edges,
  setNodes,
  setEdges,
  onConnect,
  addNode,
  editNode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDelete,
  onDragStop,
  onSave,
  arrowEdges,
  canvasRef,
  rightOpen,
}: {
  nodes: Diagram['nodes'];
  edges: Diagram['edges'];
  setNodes: Dispatch<SetStateAction<Diagram['nodes']>>;
  setEdges: Dispatch<SetStateAction<Diagram['edges']>>;
  onConnect: (conn: Connection) => void;
  addNode: (type: string, pos: { x: number; y: number }) => void;
  editNode: (id: string, label: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDelete: () => void;
  onDragStop: () => void;
  onSave: () => void;
  arrowEdges: boolean;
  canvasRef: RefObject<HTMLDivElement>;
  rightOpen: boolean;
}) {
  const { fitView, zoomIn, zoomOut, screenToFlowPosition } = useReactFlow();
  const [zoom, setZoom] = useState(1);

  const onViewportChange = useCallback((vp: Viewport) => setZoom(Math.round(vp.zoom * 100)), []);

  const addAtCenter = useCallback(
    (type: string) => {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      addNode(type, screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }));
    },
    [addNode, canvasRef, screenToFlowPosition],
  );

  void addAtCenter;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={canvasRef} className={cn('min-h-0 flex-1 bg-slate-50', !rightOpen && '')}>
        <DiagramCanvas
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          onConnect={onConnect}
          onAddNode={addNode}
          onEditNode={editNode}
          onUndo={onUndo}
          onRedo={onRedo}
          onSelectNode={(n) => {
            void n;
          }}
          onViewportChange={onViewportChange}
          arrowEdges={arrowEdges}
          onNodesDelete={onDelete}
          onEdgesDelete={onDelete}
          onNodeDragStop={onDragStop}
        />
      </div>

      {/* ---------- Bottom bar ---------- */}
      <div className="flex h-10 shrink-0 items-center gap-1.5 border-t border-slate-200 bg-white px-2 text-slate-500 md:px-3">
        <span className="hidden font-mono text-[11px] text-slate-400 md:block">
          {nodes.length} nodes · {edges.length} edges
        </span>

        <div className="ml-auto flex items-center gap-0.5">
          <button onClick={() => void zoomOut()} className="rounded-md p-1.5 transition-colors hover:bg-slate-100 hover:text-slate-900" aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom(1)} className="w-12 text-center font-mono text-xs tabular-nums hover:text-slate-900" title="Reset zoom">
            {zoom}%
          </button>
          <button onClick={() => void zoomIn()} className="rounded-md p-1.5 transition-colors hover:bg-slate-100 hover:text-slate-900" aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => void fitView({ padding: 0.2 })} className="ml-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-slate-100 hover:text-slate-900">
            Fit
          </button>
        </div>

        <div className="flex items-center gap-0.5 border-l border-slate-200 pl-2">
          <button onClick={onUndo} disabled={!canUndo} className="rounded-md p-1.5 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Undo" title="Undo (Ctrl+Z)">
            <UndoIcon className="h-4 w-4" />
          </button>
          <button onClick={onRedo} disabled={!canRedo} className="rounded-md p-1.5 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            <RedoIcon className="h-4 w-4" />
          </button>
          <button onClick={onSave} className="ml-1 hidden items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 md:flex" title="Save (Ctrl+S)">
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path d="M11 5.5 8 3v2.2C4.5 5.8 3 8 3 11c1-1.4 2.2-2 4-2.2V11l3-2.5 1-3z" fill="currentColor" />
    </svg>
  );
}

function UndoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M5 3 2 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6h5.5a4 4 0 1 1 0 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RedoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M11 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6H7.5a4 4 0 1 0 0 8H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}