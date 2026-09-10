import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Clock3, Search, Star, X } from 'lucide-react';
import { SHAPE_LIBRARY, type RelationshipType, type ShapeItem } from '@/lib/editor/node-types';
import { useEditorUi, useEditorStore } from '@/store/editor-store';
import { cn } from '@/lib/cn';
import { ShapePreview } from './shape-preview';

const FAVORITES_KEY = 'umlforge:shape-favorites';
const RECENT_KEY = 'umlforge:recent-shapes';
const MAX_RECENT = 10;
const readList = (key: string) => { try { return JSON.parse(localStorage.getItem(key) ?? '[]') as string[]; } catch { return []; } };

function ShapeTile({ item, favorite, pending, onFavorite, onUse, onArmRelationship }: { item: ShapeItem; favorite: boolean; pending: boolean; onFavorite: () => void; onUse: () => void; onArmRelationship: (rel: RelationshipType | null) => void }) {
  const requestAddAtCenter = useEditorUi((s) => s.requestAddAtCenter);
  const relationship = item.type.startsWith('rel:');
  const active = relationship && pending;
  const activate = () => {
    if (relationship) onArmRelationship(active ? null : item.type.slice(4) as RelationshipType);
    else { requestAddAtCenter(item.type); onUse(); }
  };
  return <div className="group relative min-w-0">
    <button type="button" draggable onDragStart={(event) => { event.dataTransfer.setData('application/umlforge', item.type); event.dataTransfer.effectAllowed = 'copy'; }} onClick={activate} title={relationship ? 'Click to arm, then drag from a node handle' : `Drag ${item.label} onto canvas, or click to add`} aria-label={relationship ? `Arm ${item.label} relationship` : `Add ${item.label} shape`} className={cn('flex min-h-[92px] w-full cursor-grab flex-col items-center justify-center rounded-lg border px-2 pb-2 pt-2 text-center transition-all active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1', active ? 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300' : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-sm')}>
      <ShapePreview type={item.type} className="h-10 w-[74px] shrink-0" />
      <span className="mt-1 line-clamp-2 min-h-[2.4em] text-[11px] font-medium leading-tight text-slate-700">{item.label}</span>
    </button>
    <button type="button" onClick={(event) => { event.stopPropagation(); onFavorite(); }} aria-label={`${favorite ? 'Remove' : 'Add'} ${item.label} ${favorite ? 'from' : 'to'} favorites`} className={cn('absolute right-1 top-1 rounded p-1 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100', favorite && 'opacity-100 text-amber-500')}><Star className="h-3.5 w-3.5" fill={favorite ? 'currentColor' : 'none'} /></button>
  </div>;
}

function Section({ title, items, favoriteIds, pending, onFavorite, onUse, onArmRelationship, defaultOpen = true, forceOpen = false }: { title: string; items: ShapeItem[]; favoriteIds: string[]; pending: boolean; onFavorite: (id: string) => void; onUse: (id: string) => void; onArmRelationship: (rel: RelationshipType | null) => void; defaultOpen?: boolean; forceOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { if (forceOpen) setOpen(true); }, [forceOpen]);
  return <section className="border-b border-slate-100 py-2.5 last:border-b-0"><button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-1.5 px-1 pb-2 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 hover:text-slate-800">{open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}{title}</button>{open && <div className="grid grid-cols-2 gap-2">{items.map((item) => <ShapeTile key={item.type} item={item} favorite={favoriteIds.includes(item.type)} pending={pending} onFavorite={() => onFavorite(item.type)} onUse={() => onUse(item.type)} onArmRelationship={onArmRelationship} />)}</div>}</section>;
}

export function ShapeLibrary() {
  const diagramType = useEditorStore(s => s.type);
  const categoryId = SHAPE_LIBRARY.some(c => c.id === diagramType) ? diagramType : 'uml';
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => readList(FAVORITES_KEY));
  const [recent, setRecent] = useState<string[]>(() => readList(RECENT_KEY));
  const pendingRelationship = useEditorUi((s) => s.pendingRelationship);
  const setPendingRelationship = useEditorUi((s) => s.setPendingRelationship);
  const allItems = useMemo(() => SHAPE_LIBRARY.flatMap((category) => category.items), []);
  const byType = useMemo(() => new Map(allItems.map((item) => [item.type, item])), [allItems]);
  const saveFavorites = (next: string[]) => { setFavorites(next); localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); };
  const recordUse = (type: string) => { const next = [type, ...recent.filter((item) => item !== type)].slice(0, MAX_RECENT); setRecent(next); localStorage.setItem(RECENT_KEY, JSON.stringify(next)); };
  useEffect(() => { const handler = (event: Event) => recordUse((event as CustomEvent<string>).detail); window.addEventListener('umlforge:shape-inserted', handler); return () => window.removeEventListener('umlforge:shape-inserted', handler); });
  const filtered = useMemo(() => { const value = query.trim().toLowerCase(); if (!value) return SHAPE_LIBRARY; return SHAPE_LIBRARY.map((category) => ({ ...category, items: category.items.filter((item) => item.label.toLowerCase().includes(value) || category.label.toLowerCase().includes(value) || item.aliases?.some((alias) => alias.toLowerCase().includes(value))) })).filter((category) => category.items.length); }, [query]);
  const toggleFavorite = (type: string) => saveFavorites(favorites.includes(type) ? favorites.filter((item) => item !== type) : [...favorites, type]);
  const favoriteItems = favorites.map((type) => byType.get(type)).filter((item): item is ShapeItem => Boolean(item));
  const recentItems = recent.map((type) => byType.get(type)).filter((item): item is ShapeItem => Boolean(item));
  return <div className="flex h-full min-h-0 flex-col bg-white"><div className="shrink-0 border-b border-slate-200 bg-white px-4 pb-3 pt-3"><h2 className="text-sm font-semibold text-slate-900">Shapes</h2><label className="sr-only" htmlFor="shape-search">Search shapes</label><div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="shape-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shapes…" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />{query && <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Clear search"><X className="h-4 w-4" /></button>}</div></div><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3">{!query && favoriteItems.length > 0 && <Section title="Favorites" items={favoriteItems} favoriteIds={favorites} pending={pendingRelationship !== null} onFavorite={toggleFavorite} onUse={recordUse} onArmRelationship={setPendingRelationship} />}{!query && recentItems.length > 0 && <Section title="Recently used" items={recentItems} favoriteIds={favorites} pending={pendingRelationship !== null} onFavorite={toggleFavorite} onUse={recordUse} onArmRelationship={setPendingRelationship} defaultOpen={false} />}{filtered.length === 0 ? <div className="flex flex-col items-center px-4 py-12 text-center"><Search className="h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-600">No shapes found</p><p className="mt-1 text-xs text-slate-400">Try another search term.</p></div> : [...filtered].sort((a, b) => Number(b.id === categoryId) - Number(a.id === categoryId)).map((category) => <Section key={`${diagramType}-${category.id}`} title={category.label} items={category.items} favoriteIds={favorites} pending={pendingRelationship !== null} onFavorite={toggleFavorite} onUse={recordUse} onArmRelationship={setPendingRelationship} defaultOpen={category.id === categoryId || Boolean(query)} forceOpen={Boolean(query)} />)}</div><div className="shrink-0 border-t border-slate-200 px-4 py-2.5 text-[11px] leading-relaxed text-slate-500"><Clock3 className="mr-1 inline h-3 w-3" />Drag a tile onto the canvas, or click to place it in view.</div></div>;
}
