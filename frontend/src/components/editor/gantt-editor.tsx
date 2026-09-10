import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { GanttChart, GanttTask } from '@/types';
import { useEditorStore } from '@/store/editor-store';
import { dateDay, dayDate, scheduleTasks, today } from '@/lib/editor/gantt';

const ROW = 48, HEADER = 50;
const colors = ['#4f46e5', '#0284c7', '#059669', '#c026d3', '#d97706'];

export function GanttTimeline({ chart, scale = 28, grouped = true, selected, onSelect, onShift }: {
  chart: GanttChart; scale?: number; grouped?: boolean; selected?: string;
  onSelect?: (id: string) => void; onShift?: (id: string, days: number, resize: boolean) => void;
}) {
  const marker = useId().replace(/:/g, '');
  const LABEL = Math.max(230, Math.min(440, Math.max(0, ...chart.tasks.map(t => Math.max(t.name.length, t.assignee.length))) * 7 + 28));
  const drag = useRef<{ id: string; x: number; resize: boolean } | null>(null);
  const rows = useMemo(() => {
    const owners = [...new Set(chart.tasks.map(t => t.assignee || 'Unassigned'))];
    return grouped ? owners.flatMap(owner => [{ owner, task: null as GanttTask | null }, ...chart.tasks.filter(t => (t.assignee || 'Unassigned') === owner).map(task => ({ owner, task }))]) : chart.tasks.map(task => ({ owner: task.assignee, task }));
  }, [chart, grouped]);
  const start = chart.tasks.length ? Math.min(...chart.tasks.map(t => dateDay(t.start))) - 1 : dateDay(today());
  const end = chart.tasks.length ? Math.max(...chart.tasks.map(t => dateDay(t.start) + t.duration)) + 3 : start + 30;
  const days = Math.max(14, end - start);
  const width = LABEL + days * scale, height = HEADER + rows.length * ROW + 20;
  const x = (t: GanttTask) => LABEL + (dateDay(t.start) - start) * scale;
  const rowIndex = new Map(rows.flatMap((r, i) => r.task ? [[r.task.id, i] as const] : []));
  const y = (id: string) => HEADER + (rowIndex.get(id) ?? 0) * ROW + ROW / 2;
  const tick = scale >= 20 ? 1 : scale >= 5 ? 7 : 30;
  return <svg aria-label="Gantt timeline: tasks, dates and finish-to-start dependencies" role="group" width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block bg-white text-slate-700"
    onPointerUp={e => { const d = drag.current; drag.current = null; if (d) { const days = Math.round((e.clientX - d.x) / scale); if (days) onShift?.(d.id, days, d.resize); } }} onPointerCancel={() => { drag.current = null; }}>
    <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10" fill="#64748b" /></marker></defs>
    <rect width={width} height={HEADER} fill="#f1f5f9" />
    <text x="14" y="30" fontSize="12" fontWeight="600">Task / owner</text>
    {Array.from({ length: Math.ceil(days / tick) }, (_, i) => {
      const day = start + i * tick, xx = LABEL + i * tick * scale;
      return <g key={day}><line x1={xx} x2={xx} y1={HEADER} y2={height} stroke="#e2e8f0" /><text x={xx + 4} y={28} fontSize="10">{tick === 1 ? dayDate(day).slice(8) : dayDate(day).slice(5)}</text>{(i === 0 || dayDate(day).slice(8) === '01') && <text x={xx + 4} y={12} fontSize="9">{dayDate(day).slice(0, 7)}</text>}</g>;
    })}
    {rows.map((r, i) => <g key={r.task?.id ?? `owner-${r.owner}`} role={r.task && onSelect ? 'button' : undefined} tabIndex={r.task && onSelect ? 0 : undefined} aria-label={r.task && onSelect ? `Edit task ${r.task.name}` : undefined} style={{ cursor: r.task && onSelect ? 'pointer' : undefined }} onClick={() => { if (r.task) onSelect?.(r.task.id); }} onKeyDown={e => { if (r.task && ['Enter', ' '].includes(e.key)) { e.preventDefault(); onSelect?.(r.task.id); } }}>
      <rect x="0" y={HEADER + i * ROW} width={r.task ? LABEL : width} height={ROW} fill={r.task ? '#ffffff' : '#eef2ff'} />
      <line x1="0" x2={width} y1={HEADER + (i + 1) * ROW} y2={HEADER + (i + 1) * ROW} stroke="#e2e8f0" />
      <text x="14" y={HEADER + i * ROW + 27} fontSize="12" fontWeight={r.task ? 400 : 600}>{(r.task?.name ?? r.owner).length <= (LABEL - 28) / 7 ? (r.task?.name ?? r.owner) : `${(r.task?.name ?? r.owner).slice(0, Math.floor((LABEL - 35) / 7))}…`}<title>{r.task?.name ?? r.owner}</title></text>
    </g>)}
    {chart.tasks.flatMap(task => task.dependencies.map(id => {
      const p = chart.tasks.find(t => t.id === id); if (!p) return null;
      const fromX = x(p) + p.duration * scale, toX = x(task), mid = Math.max(fromX + 10, toX - 12);
      return <path key={`${id}-${task.id}`} d={`M${fromX} ${y(id)}H${mid}V${y(task.id)}H${toX}`} fill="none" stroke="#64748b" strokeWidth="1.5" markerEnd={`url(#${marker})`}><title>{p.name} → {task.name}</title></path>;
    }))}
    {chart.tasks.map(task => {
      const yy = y(task.id), xx = x(task), w = task.duration * scale, color = colors[[...new Set(chart.tasks.map(t => t.assignee))].indexOf(task.assignee) % colors.length];
      const begin = (e: React.PointerEvent<SVGGElement>, resize = false) => { onSelect?.(task.id); if (onShift) { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { id: task.id, x: e.clientX, resize }; } };
      return <g key={task.id} tabIndex={onSelect ? 0 : undefined} role={onSelect ? 'button' : undefined} aria-label={`${task.name}, ${task.start}, ${task.duration} days, ${task.progress}% complete`} style={{ cursor: onShift ? 'grab' : 'default', touchAction: 'none' }} onPointerDown={e => begin(e)} onKeyDown={e => { if (e.key === 'Enter') onSelect?.(task.id); if (onShift && ['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); onShift(task.id, e.key === 'ArrowLeft' ? -1 : 1, e.shiftKey); } }}>
        <title>{task.name} · {task.assignee} · {task.start} · {task.duration} days · {task.progress}%</title>
        {task.milestone ? <path d={`M${xx} ${yy - 10}l10 10-10 10-10-10Z`} fill={color} stroke={selected === task.id ? '#0f172a' : 'white'} strokeWidth="2" /> : <>
          <rect x={xx} y={yy - 12} width={w} height="24" rx="4" fill={color} opacity="0.4" />
          <rect x={xx} y={yy - 12} width={w * task.progress / 100} height="24" rx="4" fill={color} />
          <rect x={xx} y={yy - 12} width={w} height="24" rx="4" fill="transparent" stroke={selected === task.id ? '#0f172a' : color} strokeWidth="2" />
          {onShift && <g style={{ cursor: 'ew-resize' }} onPointerDown={e => { e.stopPropagation(); begin(e, true); }}><rect x={xx + w - 7} y={yy - 12} width="10" height="24" fill="transparent" /><path d={`M${xx + w - 4} ${yy - 6}v12`} stroke={color} strokeWidth="2" /></g>}
        </>}
      </g>;
    })}
    {dateDay(today()) >= start && dateDay(today()) <= end && <line x1={LABEL + (dateDay(today()) - start) * scale} x2={LABEL + (dateDay(today()) - start) * scale} y1={HEADER} y2={height} stroke="#ef4444" strokeDasharray="4 4"><title>Today</title></line>}
  </svg>;
}

export function GanttEditor() {
  const chart = useEditorStore(s => s.gantt) ?? { tasks: [] };
  const setGantt = useEditorStore(s => s.setGantt);
  const [selected, setSelected] = useState<string>();
  const [scale, setScale] = useState(28);
  const [grouped, setGrouped] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<GanttTask>();
  const task = chart.tasks.find(t => t.id === selected);
  useEffect(() => setDraft(task ? structuredClone(task) : undefined), [task]);
  const commit = (tasks: GanttTask[]) => { try { setGantt(scheduleTasks(tasks)); setError(''); } catch (e) { setError((e as Error).message); } };
  const add = () => {
    const t: GanttTask = { id: crypto.randomUUID(), name: 'New task', start: today(), duration: 3, assignee: 'Unassigned', progress: 0, milestone: false, dependencies: [] };
    commit([...chart.tasks, t]); setSelected(t.id);
  };
  return <div className="flex h-full flex-col">
    <div className="flex flex-wrap items-center gap-3 border-b bg-white p-3 text-xs">
      <button className="rounded bg-indigo-600 px-3 py-2 text-white" onClick={add}>+ Task</button>
      <label>Scale <select aria-label="Timeline scale" value={scale} onChange={e => setScale(Number(e.target.value))}><option value={28}>Days</option><option value={10}>Weeks</option><option value={2}>Months</option></select></label>
      <label><input type="checkbox" checked={grouped} onChange={e => setGrouped(e.target.checked)} /> Group by owner</label>
      <span className="text-slate-500">Click a task name to edit. Drag bars to move; drag the right edge to change duration.</span>
    </div>
    {error && <p role="alert" className="bg-red-50 p-2 text-sm text-red-700">{error}</p>}
    <div className="min-h-0 flex-1 overflow-auto"><div data-gantt-export style={{ width: 'max-content' }}><GanttTimeline chart={chart} scale={scale} grouped={grouped} selected={selected} onSelect={setSelected} onShift={(id, delta, resize) => commit(chart.tasks.map(t => t.id === id ? { ...t, ...(resize && !t.milestone ? { duration: Math.max(1, t.duration + delta) } : { start: dayDate(dateDay(t.start) + delta) }) } : t))} /></div>{!chart.tasks.length && <p className="p-8 text-sm text-slate-500">Add a task, choose a project template, or generate a schedule from your project description.</p>}</div>
    {draft && <form className="flex max-h-64 flex-wrap items-end gap-3 overflow-auto border-t bg-white p-3 text-xs" onSubmit={e => { e.preventDefault(); commit(chart.tasks.map(t => t.id === draft.id ? draft : t)); }}>
      <label>Task<input className="block w-44 rounded border p-1" required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
      <label>Owner<input className="block w-28 rounded border p-1" value={draft.assignee} onChange={e => setDraft({ ...draft, assignee: e.target.value })} /></label>
      <label>Start<input className="block rounded border p-1" type="date" required value={draft.start} onChange={e => setDraft({ ...draft, start: e.target.value })} /></label>
      <label>Days<input className="block w-16 rounded border p-1" type="number" min={draft.milestone ? 0 : 1} max={3650} disabled={draft.milestone} value={draft.duration} onChange={e => setDraft({ ...draft, duration: Number(e.target.value) })} /></label>
      <label>Progress %<input className="block w-16 rounded border p-1" type="number" min="0" max="100" value={draft.progress} onChange={e => setDraft({ ...draft, progress: Number(e.target.value) })} /></label>
      <label><input type="checkbox" checked={draft.milestone} onChange={e => setDraft({ ...draft, milestone: e.target.checked, duration: e.target.checked ? 0 : 1 })} /> Milestone</label>
      <label>Predecessors<select multiple className="block max-h-20 w-44 rounded border p-1" value={draft.dependencies} onChange={e => setDraft({ ...draft, dependencies: Array.from(e.target.selectedOptions, o => o.value) })}>{chart.tasks.filter(t => t.id !== draft.id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <button className="rounded bg-indigo-600 px-3 py-2 text-white">Apply</button>
      <button type="button" className="rounded border px-3 py-2 text-red-600" onClick={() => { commit(chart.tasks.filter(t => t.id !== draft.id).map(t => ({ ...t, dependencies: t.dependencies.filter(id => id !== draft.id) }))); setSelected(undefined); }}>Delete task</button>
    </form>}
  </div>;
}
