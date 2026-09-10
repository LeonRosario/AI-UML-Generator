import type { GanttChart, GanttTask } from '@/types';

const DAY = 86400000;
export const dateDay = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY;
export const dayDate = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);
export const today = () => new Date().toISOString().slice(0, 10);

/** Validate imports and provider responses before using them as timeline coordinates. */
export function validateGantt(chart: GanttChart): GanttChart {
  if (!chart || !Array.isArray(chart.tasks) || chart.tasks.length > 300) throw new Error('Invalid Gantt task list (maximum 300).');
  const ids = new Set<string>();
  for (const t of chart.tasks) {
    if (!t || typeof t.id !== 'string' || !t.id || ids.has(t.id) || typeof t.name !== 'string' || !t.name.trim()) throw new Error('Tasks need names and unique IDs.');
    ids.add(t.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.start) || !Number.isFinite(dateDay(t.start)) || dayDate(dateDay(t.start)) !== t.start) throw new Error('Use valid YYYY-MM-DD dates.');
    if (!Number.isInteger(t.duration) || t.duration < 0 || t.duration > 3650 || typeof t.milestone !== 'boolean' || t.milestone !== (t.duration === 0)) throw new Error('Tasks need 1–3650 days; milestones need zero days.');
    if (typeof t.assignee !== 'string' || !Number.isInteger(t.progress) || t.progress < 0 || t.progress > 100 || !Array.isArray(t.dependencies)) throw new Error('Invalid owner, progress or dependencies.');
  }
  const tasks = new Map(chart.tasks.map(t => [t.id, t]));
  const active = new Set<string>(), visited = new Set<string>();
  const visit = (t: GanttTask) => {
    if (active.has(t.id)) throw new Error('Dependencies cannot contain cycles.');
    if (visited.has(t.id)) return;
    active.add(t.id);
    t.dependencies.forEach(id => {
      const predecessor = tasks.get(id);
      if (!predecessor) throw new Error('Unknown task dependency.');
      visit(predecessor);
      if (dateDay(t.start) < dateDay(predecessor.start) + predecessor.duration) throw new Error('Tasks must start after their predecessors finish.');
    });
    active.delete(t.id); visited.add(t.id);
  };
  chart.tasks.forEach(visit);
  if (chart.tasks.length && Math.max(...chart.tasks.map(t => dateDay(t.start) + t.duration)) - Math.min(...chart.tasks.map(t => dateDay(t.start))) > 3650) throw new Error('Schedule span must be at most ten years.');
  return chart;
}

/** Move successors forward after an edit, preserving intentional gaps and independent work. */
export function scheduleTasks(tasks: GanttTask[]): GanttChart {
  const next = structuredClone(tasks);
  const byId = new Map(next.map(t => [t.id, t]));
  const active = new Set<string>(), visited = new Set<string>();
  const visit = (t: GanttTask) => {
    if (active.has(t.id)) throw new Error('Dependencies cannot contain cycles.');
    if (visited.has(t.id)) return;
    active.add(t.id);
    for (const id of t.dependencies) {
      const p = byId.get(id);
      if (!p) throw new Error('Unknown task dependency.');
      visit(p);
      if (dateDay(t.start) < dateDay(p.start) + p.duration) t.start = dayDate(dateDay(p.start) + p.duration);
    }
    active.delete(t.id); visited.add(t.id);
  };
  next.forEach(visit);
  return validateGantt({ tasks: next });
}

export function projectPreset(start = today()): GanttChart {
  return { tasks: [
    { id: 'scope', name: 'Scope & requirements', start, duration: 3, assignee: 'Product', progress: 100, milestone: false, dependencies: [] },
    { id: 'design', name: 'Design', start: dayDate(dateDay(start) + 3), duration: 5, assignee: 'Design', progress: 40, milestone: false, dependencies: ['scope'] },
    { id: 'build', name: 'Implementation', start: dayDate(dateDay(start) + 8), duration: 10, assignee: 'Engineering', progress: 0, milestone: false, dependencies: ['design'] },
    { id: 'test', name: 'Acceptance testing', start: dayDate(dateDay(start) + 18), duration: 4, assignee: 'QA', progress: 0, milestone: false, dependencies: ['build'] },
    { id: 'launch', name: 'Launch', start: dayDate(dateDay(start) + 22), duration: 0, assignee: 'Product', progress: 0, milestone: true, dependencies: ['test'] },
  ] };
}
