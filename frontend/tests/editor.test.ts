import { fetchDiagrams, persistDiagram } from '../src/lib/editor/api';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useEditorStore as store, DEFAULT_PREFS, DEFAULT_LAYERS } from '../src/store/editor-store';
import { createBlankDiagram, normalizeDiagram, parseDiagramJson, serializeDiagram } from '../src/lib/editor/diagram-utils';
import { projectPreset, scheduleTasks, validateGantt } from '../src/lib/editor/gantt';
import { alignmentDelta } from '../src/lib/editor/alignment';
import { EXTENDED_TEMPLATES } from '../src/data/extended-templates';
import { resolveTextStyle } from '../src/components/editor/nodes/shared';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) } });
const fixture = () => { store.getState().loadDiagram(normalizeDiagram(EXTENDED_TEMPLATES[0].diagram)); return store.getState(); };

test('copy across diagrams preserves internal relationships, data and group identity with new IDs', () => {
  fixture().selectAll(); store.getState().groupSelected(); store.getState().copySelected();
  const original = store.getState().nodes;
  store.getState().loadDiagram(createBlankDiagram('network'));
  store.getState().paste();
  const state = store.getState();
  assert.equal(state.nodes.length, original.length);
  assert.equal(state.edges.length, EXTENDED_TEMPLATES[0].diagram.edges.length);
  assert.ok(state.nodes.every(n => !original.some(o => o.id === n.id)));
  assert.equal(new Set(state.nodes.map(n => n.data.groupId)).size, 1);
  assert.ok(state.edges.every(e => state.nodes.some(n => n.id === e.source) && state.nodes.some(n => n.id === e.target)));
  state.updateNodeData(state.nodes[0].id, { label: 'Changed copy' });
  assert.notEqual(original[0].data.label, 'Changed copy');
  store.getState().undo(); store.getState().undo();
  assert.equal(store.getState().nodes.length, 0);
});

test('drag, resize, delete and redo operate atomically on a multi-selection', () => {
  fixture().selectAll(); const initial = store.getState().nodes;
  store.getState().beginDrag();
  store.getState().applyNodeChanges(initial.map(n => ({ type: 'position', id: n.id, position: { x: n.position.x + 24, y: n.position.y + 24 }, dragging: true })));
  store.getState().undo(); assert.deepEqual(store.getState().nodes, initial);
  store.getState().resizeSelected(2); assert.equal(store.getState().nodes[1].position.x, initial[1].position.x * 2);
  assert.equal(store.getState().nodes[1].data.scale, 2);
  store.getState().undo(); assert.deepEqual(store.getState().nodes, initial);
  store.getState().deleteSelected(); assert.equal(store.getState().edges.length, 0);
  store.getState().undo(); assert.equal(store.getState().edges.length, EXTENDED_TEMPLATES[0].diagram.edges.length);
  store.getState().redo(); assert.equal(store.getState().nodes.length, 0);
});

test('locked and hidden layers cannot be selected, changed or deleted', () => {
  fixture().setLayers([{ ...DEFAULT_LAYERS[0], locked: true }]);
  store.getState().selectAll(); store.getState().deleteSelected();
  const before = store.getState().nodes;
  store.getState().updateNodeData(before[0].id, { label: 'Forbidden' });
  store.getState().applyAutoLayout('vertical');
  assert.deepEqual(store.getState().nodes, before);
  store.getState().setLayers([{ ...DEFAULT_LAYERS[0], visible: false }]);
  store.getState().selectAll(); assert.ok(store.getState().nodes.every(n => !n.selected));
});

test('themes, layers, routing and Gantt survive JSON roundtrip and history', () => {
  fixture().applyTheme('ocean');
  store.getState().setPrefs({ routing: 'curved', snapToGrid: false });
  store.getState().updateEdge(store.getState().edges[0].id, { data: { routing: 'straight', color: '#123456', relationship: 'dependency' } });
  const original = store.getState().toDiagram();
  const restored = parseDiagramJson(JSON.stringify(serializeDiagram(original)));
  assert.deepEqual(restored.preferences, original.preferences);
  assert.deepEqual(restored.layers, original.layers);
  assert.deepEqual(restored.edges[0].data, original.edges[0].data);
  store.getState().loadDiagram(restored);
  store.getState().addNode('archApiNode', { x: 13, y: 17 });
  assert.equal(store.getState().nodes.at(-1)?.data.fill, '#e0f2fe');
  assert.deepEqual(store.getState().nodes.at(-1)?.position, { x: 13, y: 17 });
  const gantt = projectPreset('2026-09-10');
  store.getState().applyDiagram({ ...createBlankDiagram('gantt'), gantt });
  assert.equal(store.getState().type, 'gantt');
  assert.deepEqual(parseDiagramJson(JSON.stringify(serializeDiagram(store.getState().toDiagram()))).gantt, gantt);
  store.getState().undo(); assert.equal(store.getState().type, original.type);
});

test('schedule edits push successors forward, preserve parallel tasks and reject cycles', () => {
  const chart = projectPreset('2026-09-10');
  chart.tasks[0].duration = 5;
  const next = scheduleTasks(chart.tasks);
  assert.equal(next.tasks[1].start, '2026-09-15');
  assert.equal(next.tasks.at(-1)?.start, '2026-10-04');
  next.tasks[0].dependencies = ['launch'];
  assert.throws(() => scheduleTasks(next.tasks), /cycles/);
  assert.throws(() => validateGantt({ tasks: [{ ...chart.tasks[0], start: '2026-02-30' }] }), /dates/);
});

test('text formatting metadata produces CSS-safe style values', () => {
  assert.deepEqual(resolveTextStyle({
    fontFamily: 'Arial',
    fontSize: 18,
    fontWeight: 700,
    italic: true,
    underline: true,
    letterSpacing: 1.5,
    lineHeight: 1.35,
    textAlign: 'center',
  }), {
    color: '#0f172a',
    fontFamily: 'Arial',
    fontSize: '18px',
    fontWeight: 700,
    fontStyle: 'italic',
    textDecoration: 'underline',
    letterSpacing: '1.5px',
    lineHeight: 1.35,
    textAlign: 'center',
  });
});

test('smart guides align the selection bounds without distorting relative positions', () => {
  const nodes = normalizeDiagram(EXTENDED_TEMPLATES[0].diagram).nodes;
  const moving = [{ ...nodes[0], position: { x: 98, y: 98 } }];
  const target = [{ ...nodes[1], position: { x: 100, y: 300 } }];
  assert.equal(alignmentDelta(moving, target).dx, 2);
  assert.equal(alignmentDelta(moving, target).x, 100);
  assert.equal(alignmentDelta(moving, target).dy, 0);
});

test('every new type has multiple nonempty presets', () => {
  for (const type of ['flowchart', 'network', 'architecture', 'gantt']) {
    const templates = EXTENDED_TEMPLATES.filter(t => t.diagramType === type);
    assert.ok(templates.length >= 2);
    templates.forEach(t => { if (type === 'gantt') assert.ok(validateGantt(t.diagram.gantt!).tasks.length); else assert.ok(t.diagram.nodes.length); });
  }
});


test('failed saves stay discoverable in Recent and do not leak another student’s local diagrams', async () => {
  storage.clear();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => null } });
  const originalFetch = globalThis.fetch;
  const student = { ...createBlankDiagram('class', 'Library assignment'), ownerId: 'student-a' };
  const other = { ...createBlankDiagram('class', 'Private assignment'), ownerId: 'student-b' };
  try {
    globalThis.fetch = async () => { throw new Error('Offline'); };
    assert.equal(await persistDiagram(student), false);
    assert.equal(await persistDiagram(other), false);
    assert.deepEqual((await fetchDiagrams('student-a')).map(d => d.id), [student.id]);
    globalThis.fetch = async () => new Response('[]', { status: 200 });
    const recovered = await fetchDiagrams('student-a');
    assert.equal(recovered[0].saved, false);
    assert.equal(recovered[0].name, 'Library assignment');
    assert.equal(await persistDiagram(student), true);
    globalThis.fetch = async () => new Response(JSON.stringify([student]), { status: 200 });
    assert.equal((await fetchDiagrams('student-a')).length, 1);
  } finally { globalThis.fetch = originalFetch; storage.clear(); }
});

test('a late successful save cannot conceal a newer failed edit', async () => {
  storage.clear();
  const originalFetch = globalThis.fetch;
  const initial = { ...createBlankDiagram(), ownerId: 'student-a', updatedAt: '2026-09-10T00:00:00Z' };
  const newer = { ...initial, name: 'Latest assignment', updatedAt: '2026-09-10T00:00:01Z' };
  let complete!: (response: Response) => void;
  try {
    globalThis.fetch = () => new Promise<Response>(resolve => { complete = resolve; });
    const pending = persistDiagram(initial);
    globalThis.fetch = async () => { throw new Error('Offline'); };
    await persistDiagram(newer);
    complete(new Response('{}', { status: 200 }));
    await pending;
    const recovered = await fetchDiagrams('student-a');
    assert.equal(recovered[0].name, 'Latest assignment');
    assert.equal(recovered[0].saved, false);
  } finally { globalThis.fetch = originalFetch; storage.clear(); }
});
