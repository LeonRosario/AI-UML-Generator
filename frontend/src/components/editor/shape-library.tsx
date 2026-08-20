import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { SHAPE_LIBRARY } from '@/lib/editor/node-types';
import type { RelationshipType } from '@/lib/editor/node-types';
import { useEditorUi } from '@/store/editor-store';
import { cn } from '@/lib/cn';

function Category({
  title,
  items,
  defaultOpen = true,
  onArmRelationship,
  pending,
}: {
  title: string;
  items: typeof SHAPE_LIBRARY[number]['items'];
  defaultOpen?: boolean;
  onArmRelationship?: (rel: RelationshipType | null) => void;
  pending?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const requestAddAtCenter = useEditorUi((s) => s.requestAddAtCenter);

  return (
    <div className="border-b border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-1 px-2 pb-3">
          {items.map((item) => {
            const isRelationship = item.type.startsWith('rel:');
            const active = pending && isRelationship;
            return (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/umlforge', item.type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => {
                  if (isRelationship) {
                    const rel = item.type.slice(4) as RelationshipType;
                    onArmRelationship?.(active ? null : rel);
                  } else {
                    requestAddAtCenter(item.type);
                  }
                }}
                title={
                  isRelationship
                    ? 'Click to arm, then drag from a node handle'
                    : 'Drag onto the canvas, or click to add at center'
                }
                className={cn(
                  'flex cursor-grab items-center gap-2 rounded-md border px-2.5 py-1.5 text-[13px] transition-all active:cursor-grabbing',
                  active
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm',
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-indigo-500" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ShapeLibrary() {
  const [query, setQuery] = useState('');
  const pending = useEditorUi((s) => s.pendingRelationship);
  const setPendingRelationship = useEditorUi((s) => s.setPendingRelationship);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SHAPE_LIBRARY;
    return SHAPE_LIBRARY.map((cat) => ({
      ...cat,
      items: cat.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search elements…"
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-7 text-[13px] placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-400">No elements match "{query}".</p>
        ) : (
          filtered.map((cat) => (
            <Category
              key={cat.id}
              title={cat.label}
              items={cat.items}
              defaultOpen={cat.id !== 'other'}
              onArmRelationship={setPendingRelationship}
              pending={pending !== null}
            />
          ))
        )}
      </div>

      <div className="border-t border-slate-200 p-2.5 text-[11px] leading-relaxed text-slate-400">
        Drag elements onto the canvas. Click a relationship to arm it, then drag from a node handle to connect.
      </div>
    </div>
  );
}