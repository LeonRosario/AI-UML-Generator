import { Sparkles, Undo2, Redo2, Minus, Plus, Download, X, Type, Palette, AlignLeft, AlignCenter, AlignRight, RotateCcw, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

interface UMLForgePreviewProps {
  className?: string;
}

const shapeCategories = [
  {
    label: 'Elements',
    items: [
      { icon: '👤', label: 'Actor' },
      { icon: '▭', label: 'Class' },
      { icon: '⬭', label: 'Use Case' },
      { icon: '◆', label: 'Entity' },
      { icon: '⬢', label: 'Component' },
      { icon: '⬚', label: 'Database' },
    ],
  },
];

const formatOptions = [
  { icon: Type, label: 'Font' },
  { icon: Type, label: 'Size' },
  { icon: AlignLeft, label: 'Align' },
  { icon: Palette, label: 'Color' },
];

const toolbarItems = [
  { icon: Undo2, label: 'Undo' },
  { icon: Redo2, label: 'Redo' },
  { icon: Minus, label: 'Zoom Out' },
  { icon: Plus, label: 'Zoom In' },
  { icon: Download, label: 'Export' },
];

function ToolbarButton({ icon: Icon, label, active = false }: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean }) {
  return (
    <button
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] font-medium transition-all',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      )}
    >
      <span className="h-4 w-4 text-center text-[12px]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function FormatButton({ icon: Icon, label, active = false }: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean }) {
  return (
    <button
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function CanvasNode({ label, subItems, x, y, width = 160, height = 80, isClass = true }: { label: string; subItems?: string[]; x: number; y: number; width?: number; height?: number; isClass?: boolean }) {
  return (
    <div
      style={{ position: 'absolute', left: x, top: y, width, height }}
      className="relative"
    >
      <div className="absolute inset-0 rounded-lg border border-slate-300 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-1.5 rounded-t-lg">
          <span className={cn('font-semibold text-sm text-slate-900', isClass && 'text-indigo-600')}>{label}</span>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          </div>
        </div>
        {subItems && (
          <div className="p-2 space-y-1">
            {subItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-1 py-0.5 text-xs text-slate-600 font-mono">
                <span className="text-slate-400">+</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Connection handles */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-indigo-500 border-2 border-white" />
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 h-3 w-3 rounded-full bg-indigo-500 border-2 border-white" />
      <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-indigo-500 border-2 border-white" />
      <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-indigo-500 border-2 border-white" />
    </div>
  );
}

function ConnectionLine({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label?: string }) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  return (
    <svg
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      className="overflow-visible"
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
        </marker>
      </defs>
      <path
        d={`M${x1} ${y1} L${x2} ${y2}`}
        stroke="#64748b"
        strokeWidth="1.5"
        fill="none"
        markerEnd="url(#arrowhead)"
      />
      {label && (
        <text x={midX} y={midY - 8} textAnchor="middle" className="text-[10px] font-mono text-slate-500" fill="#64748b">
          {label}
        </text>
      )}
    </svg>
  );
}

export function UMLForgePreview({ className }: UMLForgePreviewProps) {
  return (
    <div className={cn('flex h-full w-full flex-col overflow-hidden bg-white', className)}>
      {/* Top Toolbar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900">UMLForge</span>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-1">
            {toolbarItems.map((item, i) => (
              <ToolbarButton key={i} icon={item.icon} label={item.label} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all">
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Layout</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">AI Generate</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Sidebar - Elements Panel */}
        <div className="hidden w-48 shrink-0 flex-col border-r border-slate-200 bg-slate-50 md:flex">
          <div className="shrink-0 border-b border-slate-200 p-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">ELEMENTS</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {shapeCategories.map((category) => (
              <div key={category.label}>
                <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{category.label}</h4>
                <div className="space-y-1">
                  {category.items.map((item, i) => (
                    <SidebarItem key={i} icon={item.icon} label={item.label} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Canvas */}
        <div className="relative flex-1 min-w-0 overflow-hidden bg-white">
          {/* Grid background */}
          <div className="absolute inset-0 grid-bg opacity-50" />
          
          {/* Canvas content */}
          <div className="relative h-full w-full">
            {/* Connections */}
            <ConnectionLine x1={300} y1={160} x2={480} y2={160} label="enrolls" />
            <ConnectionLine x1={480} y1={240} x2={480} y2={320} label="teaches" />
            <ConnectionLine x1={660} y1={160} x2={480} y2={160} label="manages" />
            
            {/* Nodes */}
            {/* Student */}
            <CanvasNode
              label="Student"
              subItems={['+ id: int', '+ name: string', '+ email: string', '+ enroll(course): void']}
              x={180}
              y={100}
              width={180}
              height={140}
            />
            
            {/* Course */}
            <CanvasNode
              label="Course"
              subItems={['+ id: int', '+ title: string', '+ credits: int', '+ getStudents(): Student[]']}
              x={480}
              y={100}
              width={180}
              height={140}
            />
            
            {/* Teacher */}
            <CanvasNode
              label="Teacher"
              subItems={['+ id: int', '+ name: string', '+ department: string', '+ teach(course): void']}
              x={480}
              y={280}
              width={180}
              height={120}
            />
            
            {/* Admin */}
            <CanvasNode
              label="Admin"
              subItems={['+ id: int', '+ name: string', '+ role: string', '+ manageUsers(): void']}
              x={660}
              y={100}
              width={160}
              height={120}
            />
          </div>

          {/* AI Assistant floating panel */}
          <div className="absolute bottom-4 right-4 z-10 w-72 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
                  <Zap className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <span className="font-semibold text-sm text-slate-900">AI Assistant</span>
              </div>
              <button className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-sm text-slate-600">"Add Admin and connect it to Student."</p>
              <button className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                <Sparkles className="h-3.5 w-3.5 inline mr-1" /> AI Edit
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Format Panel */}
        <div className="hidden w-48 shrink-0 flex-col border-l border-slate-200 bg-slate-50 md:flex">
          <div className="shrink-0 border-b border-slate-200 p-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">FORMAT</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <div>
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Text</h4>
              <div className="flex flex-wrap gap-1.5">
                {formatOptions.map((item, i) => (
                  <FormatButton key={i} icon={item.icon} label={item.label} />
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Fill</h4>
              <div className="flex flex-wrap gap-1">
                {['#ffffff', '#fef9c3', '#dcfce7', '#dbeafe', '#ede9fe', '#fce7f3'].map((color) => (
                  <button
                    key={color}
                    className="h-6 w-6 rounded border transition-transform hover:scale-110"
                    style={{ background: color, borderColor: color === '#ffffff' ? '#e2e8f0' : 'transparent' }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Stroke</h4>
              <div className="flex flex-wrap gap-1">
                {['#0f172a', '#475569', '#6366f1', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                  <button
                    key={color}
                    className="h-6 w-6 rounded border transition-transform hover:scale-110"
                    style={{ background: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}