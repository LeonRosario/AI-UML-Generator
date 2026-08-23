import type { Diagram, DiagramNode, DiagramType } from '@/types';
import type { Edge } from '@xyflow/react';
import { loadJSON, removeKey, saveJSON } from '@/services/storage';
import { DIAGRAM_TYPE_LABELS } from '@/data/diagrams';
import { uid } from '@/data/diagrams';
import { aiNodesToDiagramNodes, graphStats, normalizeDiagram } from './diagram-utils';
import { autoLayout } from './layout-utils';
import { createUmlNode, type RelationshipType } from './node-types';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
const DIAGRAM_INDEX_KEY = 'diagramIndex';
const DIAGRAM_PREFIX = 'diagram:';

/* ------------------------------------------------------------------ */
/*  Diagram persistence (REST when configured, localStorage otherwise) */
/* ------------------------------------------------------------------ */

export type DiagramMeta = {
  id: string;
  name: string;
  type: DiagramType;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  saved?: boolean;
};

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const body = (await response.json().catch(() => ({}))) as { detail?: string } & T;
  if (!response.ok) throw new Error(body.detail ?? 'Request failed.');
  return body;
}

function index(): DiagramMeta[] {
  return loadJSON<DiagramMeta[]>(DIAGRAM_INDEX_KEY, []);
}

function persistIndex(list: DiagramMeta[]) {
  saveJSON(DIAGRAM_INDEX_KEY, list);
}

function metaOf(diagram: Diagram): DiagramMeta {
  return {
    id: diagram.id,
    name: diagram.name,
    type: diagram.type,
    createdAt: diagram.createdAt,
    updatedAt: diagram.updatedAt,
    ownerId: diagram.ownerId,
    saved: true,
  };
}

export async function fetchDiagrams(): Promise<DiagramMeta[]> {
  if (API_URL) {
    try {
      return await api<DiagramMeta[]>('/diagrams');
    } catch {
      /* fall through to local */
    }
  }
  return index().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function fetchDiagram(id: string): Promise<Diagram | null> {
  if (API_URL) {
    try {
      return normalizeDiagram(await api<Diagram>(`/diagrams/${id}`));
    } catch {
      /* fall through to local */
    }
  }
  const raw = loadJSON<Diagram | null>(`${DIAGRAM_PREFIX}${id}`, null);
  return raw ? normalizeDiagram(raw) : null;
}

export async function persistDiagram(diagram: Diagram): Promise<void> {
  if (API_URL) {
    await api(`/diagrams/${diagram.id}`, { method: 'PUT', body: JSON.stringify(diagram) });
  }
  saveJSON(`${DIAGRAM_PREFIX}${diagram.id}`, normalizeDiagram(diagram));
  const list = index().filter((m) => m.id !== diagram.id);
  persistIndex([metaOf(diagram), ...list]);
}

export async function removeDiagram(id: string): Promise<void> {
  if (API_URL) {
    try {
      await api(`/diagrams/${id}`, { method: 'DELETE' });
    } catch {
      /* continue to local cleanup */
    }
  }
  removeKey(`${DIAGRAM_PREFIX}${id}`);
  persistIndex(index().filter((m) => m.id !== id));
}

/* ------------------------------------------------------------------ */
/*  AI payload types                                                   */
/* ------------------------------------------------------------------ */

export type AiNodePayload = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

export type AiEdgePayload = {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
};

export type AiDiagramPayload = {
  name: string;
  type: DiagramType;
  nodes: AiNodePayload[];
  edges: AiEdgePayload[];
};

export type AiModifyResult = {
  nodes: DiagramNode[];
  edges: Edge[];
  applied: string[];
  message: string;
};

export type ExplainResult = {
  overview: string;
  entities: { name: string; kind: string }[];
  relationships: { from: string; to: string; type: string; label?: string }[];
  architecture: string;
  problems: string[];
  suggestions: string[];
};

/* ------------------------------------------------------------------ */
/*  AI helpers                                                         */
/* ------------------------------------------------------------------ */

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function derivedName(requirements: string, type: DiagramType): string {
  const firstLine = requirements.split(/[\n.]/)[0].trim().replace(/\.$/, '');
  const slug = firstLine.length > 34 ? `${firstLine.slice(0, 34).trim()}…` : firstLine;
  return slug ? `${slug} — ${DIAGRAM_TYPE_LABELS[type]}` : DIAGRAM_TYPE_LABELS[type];
}

/* Entity knowledge base used by the local (offline) generator. */
const ENTITY_DEFS: Record<string, { attrs: string[]; methods: string[]; role: 'person' | 'thing' | 'system' }> = {
  user: { attrs: ['- id: number', '- name: string', '- email: string', '- passwordHash: string'], methods: ['+ login(): boolean', '+ logout(): void', '+ updateProfile(): void'], role: 'person' },
  customer: { attrs: ['- id: number', '- name: string', '- email: string', '- address: string', '- phone: string'], methods: ['+ login(): boolean', '+ checkout(): void', '+ viewOrders(): List<Order>'], role: 'person' },
  admin: { attrs: ['- id: number', '- role: string', '- permissions: List<string>'], methods: ['+ manageUsers(): void', '+ viewReports(): void'], role: 'person' },
  moderator: { attrs: ['- id: number', '- privileges: List<string>'], methods: ['+ moderateContent(): void'], role: 'person' },
  order: { attrs: ['- id: number', '- total: decimal', '- status: string', '- createdAt: date'], methods: ['+ placeOrder(): void', '+ cancel(): void', '+ calculateTotal(): decimal'], role: 'thing' },
  payment: { attrs: ['- id: number', '- method: string', '- amount: decimal', '- status: string'], methods: ['+ process(): boolean', '+ refund(): void'], role: 'thing' },
  product: { attrs: ['- id: number', '- name: string', '- price: decimal', '- stock: int'], methods: ['+ getInventory(): int', '+ restock(quantity: int): void'], role: 'thing' },
  restaurant: { attrs: ['- id: number', '- name: string', '- cuisine: string', '- rating: decimal'], methods: ['+ acceptOrder(): void', '+ updateMenu(): void'], role: 'system' },
  driver: { attrs: ['- id: number', '- name: string', '- vehicle: string', '- status: string'], methods: ['+ acceptDelivery(): void', '+ updateLocation(): void'], role: 'person' },
  deliveryagent: { attrs: ['- id: number', '- name: string', '- vehicle: string', '- status: string'], methods: ['+ acceptDelivery(): void', '+ updateLocation(): void'], role: 'person' },
  cart: { attrs: ['- id: number', '- items: List<OrderItem>', '- total: decimal'], methods: ['+ addItem(item: Product): void', '+ removeItem(id: number): void'], role: 'thing' },
  orderitem: { attrs: ['- orderId: number', '- productId: number', '- quantity: int', '- unitPrice: decimal'], methods: ['+ subtotal(): decimal'], role: 'thing' },
  review: { attrs: ['- id: number', '- rating: int', '- comment: string', '- createdAt: date'], methods: ['+ submit(): void'], role: 'thing' },
  post: { attrs: ['- id: number', '- content: string', '- likes: int', '- createdAt: date'], methods: ['+ publish(): void', '+ like(): void'], role: 'thing' },
  comment: { attrs: ['- id: number', '- body: string', '- createdAt: date'], methods: ['+ post(): void'], role: 'thing' },
  course: { attrs: ['- id: number', '- title: string', '- credits: int'], methods: ['+ getStudents(): List<Student>', '+ assignTeacher(teacher: Teacher): void'], role: 'thing' },
  student: { attrs: ['- id: number', '- name: string', '- email: string', '- major: string'], methods: ['+ enroll(course: Course): void', '+ submit(assignment: Assignment): void'], role: 'person' },
  teacher: { attrs: ['- id: number', '- name: string', '- department: string'], methods: ['+ createCourse(): void', '+ grade(assignment: Assignment): void'], role: 'person' },
  professor: { attrs: ['- id: number', '- name: string', '- department: string'], methods: ['+ createCourse(): void', '+ grade(assignment: Assignment): void'], role: 'person' },
  assignment: { attrs: ['- id: number', '- title: string', '- dueDate: date'], methods: ['+ submit(): void', '+ grade(): void'], role: 'thing' },
  enrollment: { attrs: ['- studentId: number', '- courseId: number', '- grade: string'], methods: ['+ enroll(): void'], role: 'thing' },
  book: { attrs: ['- id: number', '- title: string', '- author: string', '- isbn: string'], methods: ['+ reserve(): void'], role: 'thing' },
  member: { attrs: ['- id: number', '- name: string', '- email: string', '- joinedAt: date'], methods: ['+ borrow(book: Book): void'], role: 'person' },
  librarian: { attrs: ['- id: number', '- name: string', '- badge: string'], methods: ['+ issueFine(): void', '+ manageCatalog(): void'], role: 'person' },
  account: { attrs: ['- id: number', '- balance: decimal', '- type: string', '- openedAt: date'], methods: ['+ deposit(amount: decimal): void', '+ withdraw(amount: decimal): void'], role: 'thing' },
  transaction: { attrs: ['- id: number', '- amount: decimal', '- type: string', '- timestamp: date'], methods: ['+ execute(): void'], role: 'thing' },
  patient: { attrs: ['- id: number', '- name: string', '- bloodType: string', '- dob: date'], methods: ['+ bookAppointment(): void', '+ viewHistory(): void'], role: 'person' },
  doctor: { attrs: ['- id: number', '- name: string', '- specialty: string'], methods: ['+ viewAppointments(): void', '+ updateRecords(): void'], role: 'person' },
  appointment: { attrs: ['- patientId: number', '- doctorId: number', '- date: date', '- status: string'], methods: ['+ schedule(): void'], role: 'thing' },
  medicalrecord: { attrs: ['- id: number', '- patientId: number', '- diagnosis: text', '- createdAt: date'], methods: ['+ create(): void'], role: 'thing' },
  prescription: { attrs: ['- id: number', '- medication: string', '- dosage: string'], methods: ['+ issue(): void'], role: 'thing' },
  invoice: { attrs: ['- id: number', '- amount: decimal', '- issuedAt: date', '- paid: boolean'], methods: ['+ generate(): void', '+ pay(): void'], role: 'thing' },
  shipment: { attrs: ['- id: number', '- carrier: string', '- trackingNumber: string', '- status: string'], methods: ['+ dispatch(): void', '+ updateStatus(): void'], role: 'thing' },
  notification: { attrs: ['- id: number', '- recipientId: number', '- message: string', '- read: boolean'], methods: ['+ send(): void'], role: 'thing' },
  subscription: { attrs: ['- id: number', '- plan: string', '- renewsAt: date', '- active: boolean'], methods: ['+ renew(): void', '+ cancel(): void'], role: 'thing' },
  authservice: { attrs: ['- tokens: Map<string, string>', '- sessionTimeout: int'], methods: ['+ authenticate(credentials): Token', '+ issueToken(userId: number): string'], role: 'system' },
};

const RELATION_MAP: Record<string, [string, RelationshipType, string][]> = {
  user: [['order', 'association', 'places']],
  customer: [['cart', 'association', 'owns'], ['order', 'association', 'places'], ['review', 'association', 'writes']],
  admin: [['user', 'inheritance', '']],
  moderator: [['post', 'association', 'moderates']],
  order: [['payment', 'association', 'paid with'], ['orderitem', 'composition', 'contains'], ['shipment', 'association', 'shipped via'], ['notification', 'association', 'triggers']],
  payment: [['invoice', 'association', 'settles']],
  product: [['orderitem', 'association', 'sold as']],
  restaurant: [['order', 'association', 'receives'], ['product', 'aggregation', 'serves']],
  driver: [['shipment', 'association', 'carries']],
  deliveryagent: [['order', 'association', 'delivers']],
  cart: [['order', 'dependency', 'creates']],
  student: [['enrollment', 'association', 'has'], ['assignment', 'association', 'submits']],
  teacher: [['course', 'association', 'teaches']],
  professor: [['course', 'association', 'teaches']],
  course: [['enrollment', 'aggregation', 'enrolls'], ['assignment', 'aggregation', 'includes']],
  member: [['book', 'association', 'borrows']],
  librarian: [['book', 'association', 'manages']],
  account: [['transaction', 'composition', 'records']],
  patient: [['appointment', 'association', 'books'], ['medicalrecord', 'association', 'has']],
  doctor: [['appointment', 'association', 'schedules'], ['prescription', 'association', 'writes']],
  appointment: [['prescription', 'dependency', 'results in']],
};

const COMMON_ENTITIES = ['user', 'customer', 'admin', 'order', 'payment', 'product', 'restaurant', 'driver', 'cart', 'review'];

const UC_ACTIONS: Record<string, string[]> = {
  customer: ['Place Order', 'Track Order', 'Make Payment'],
  user: ['Login', 'Manage Profile'],
  admin: ['Manage Users', 'View Reports'],
  student: ['Register Course', 'Submit Assignment', 'View Grades'],
  teacher: ['Create Course', 'Grade Assignments'],
  professor: ['Create Course', 'Grade Assignments'],
  doctor: ['View Appointments', 'Update Records'],
  patient: ['Book Appointment', 'View History'],
  librarian: ['Issue Book', 'Calculate Fine'],
  member: ['Borrow Book', 'Return Book'],
  driver: ['Accept Delivery', 'Update Status'],
  restaurant: ['Manage Menu', 'Accept Order'],
};

function extractEntities(requirements: string): string[] {
  const text = ` ${requirements.toLowerCase()} `;
  const found: string[] = [];
  const known = Object.keys(ENTITY_DEFS).sort((a, b) => b.length - a.length);
  for (const key of known) {
    if (text.includes(` ${key} `) || text.includes(` ${key}s `) || text.includes(` ${key}ing `) || text.includes(` ${key}ed `)) {
      if (!found.includes(key)) found.push(key);
    }
  }
  /* Capitalized words are treated as custom entities. */
  const stop = new Set(['the', 'a', 'an', 'for', 'with', 'and', 'or', 'of', 'to', 'in', 'on', 'system', 'diagram', 'class', 'use', 'case', 'online', 'application', 'create', 'make', 'using', 'diagram']);
  const words = requirements.replace(/[^A-Za-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (/^[A-Z]/.test(word) && !stop.has(word.toLowerCase())) {
      const key = word.toLowerCase();
      if (!found.includes(key)) {
        found.push(key);
        if (!ENTITY_DEFS[key]) {
          ENTITY_DEFS[key] = { attrs: ['- id: number', '- name: string', '- createdAt: date'], methods: ['+ create(): void', '+ update(): void'], role: 'thing' };
        }
      }
    }
  }
  return found.slice(0, 7);
}

function entityTitle(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([a-z])([A-Z])/g, '$1 $2');
}

function describeEntity(key: string) {
  const def = ENTITY_DEFS[key] ?? ENTITY_DEFS.user;
  return { title: entityTitle(key), attrs: def.attrs, methods: def.methods, role: def.role };
}

function buildClassDiagram(requirements: string, type: DiagramType): AiDiagramPayload {
  const entities = extractEntities(requirements);
  const picked = entities.length >= 2 ? entities : [...COMMON_ENTITIES.filter((e) => !entities.includes(e)), ...entities].slice(0, Math.max(3, entities.length));
  const nodes: AiNodePayload[] = [];
  const edges: AiEdgePayload[] = [];
  const byId = new Map<string, string>();
  picked.forEach((key) => {
    const def = describeEntity(key);
    const id = key.replace(/\s+/g, '').toLowerCase();
    byId.set(key, id);
    nodes.push({ id, type: 'classNode', position: { x: 0, y: 0 }, data: { name: def.title, attributes: def.attrs, methods: def.methods } });
  });
  const connected = new Set<string>();
  for (const key of picked) {
    const rels = RELATION_MAP[key] ?? [];
    for (const [targetKey, rel, label] of rels) {
      const target = picked.find((p) => p === targetKey);
      if (!target) continue;
      edges.push({ id: uid('edge'), source: byId.get(key)!, target: byId.get(target)!, type: rel, ...(label ? { label } : {}) });
      connected.add(key);
      connected.add(target);
    }
  }
  /* Connect stragglers so nothing is isolated. */
  for (let i = 1; i < picked.length; i++) {
    const a = picked[i - 1];
    const b = picked[i];
    const already = edges.some((e) => (e.source === byId.get(a) && e.target === byId.get(b)) || (e.source === byId.get(b) && e.target === byId.get(a)));
    if (!already) edges.push({ id: uid('edge'), source: byId.get(a)!, target: byId.get(b)!, type: 'association' });
  }
  return { name: derivedName(requirements, type), type, nodes, edges };
}

function buildUseCaseDiagram(requirements: string, type: DiagramType): AiDiagramPayload {
  const entities = extractEntities(requirements);
  const actors = entities.filter((e) => (ENTITY_DEFS[e] ?? ENTITY_DEFS.user).role === 'person');
  const pool = actors.length >= 1 ? actors : ['customer', 'admin'];
  const nodes: AiNodePayload[] = [];
  const edges: AiEdgePayload[] = [];
  const useCases: { label: string; actor: string }[] = [];
  const seen = new Set<string>();
  for (const actor of pool) {
    for (const action of UC_ACTIONS[actor] ?? ['Login', 'Manage Account']) {
      if (seen.has(action)) continue;
      seen.add(action);
      useCases.push({ label: action, actor });
    }
  }
  if (useCases.length < 3) {
    for (const action of ['Register', 'View Dashboard', 'Logout']) {
      if (!seen.has(action)) useCases.push({ label: action, actor: pool[0] });
    }
  }
  const actorIds = pool.map((actor) => {
    const id = `actor-${actor}`;
    nodes.push({ id, type: 'actorNode', position: { x: 0, y: 0 }, data: { name: entityTitle(actor) } });
    return id;
  });
  void actorIds;
  useCases.forEach((uc) => {
    const id = `uc-${uc.label.replace(/\s+/g, '-').toLowerCase()}`;
    nodes.push({ id, type: 'useCaseNode', position: { x: 0, y: 0 }, data: { name: uc.label } });
    edges.push({ id: uid('edge'), source: `actor-${uc.actor}`, target: id, type: 'association' });
  });
  return { name: derivedName(requirements, type), type, nodes, edges };
}

function buildEntityDiagram(requirements: string, type: DiagramType): AiDiagramPayload {
  const entities = extractEntities(requirements);
  const picked = entities.length >= 2 ? entities : ['customer', 'order', 'payment'];
  const nodes: AiNodePayload[] = [];
  const edges: AiEdgePayload[] = [];
  picked.forEach((key, i) => {
    const def = describeEntity(key);
    nodes.push({
      id: `ent-${key}`,
      type: 'databaseNode',
      position: { x: 0, y: 0 },
      data: { name: def.title, fields: ['id: int (PK)', ...def.attrs.slice(1).map((a) => a.replace(/^[+#\-#~]?\s*/, '')), 'created_at: date'] },
    });
    if (i > 0) edges.push({ id: uid('edge'), source: `ent-${picked[i - 1]}`, target: `ent-${key}`, type: 'association', label: '1..*' });
  });
  return { name: derivedName(requirements, type), type, nodes, edges };
}

function buildSequenceDiagram(requirements: string, type: DiagramType): AiDiagramPayload {
  const entities = extractEntities(requirements);
  const actors = entities.filter((e) => (ENTITY_DEFS[e] ?? ENTITY_DEFS.user).role === 'person');
  const lifelines = actors.length ? actors : ['user', 'system', 'database'];
  const nodes: AiNodePayload[] = [];
  const edges: AiEdgePayload[] = [];
  const ids = lifelines.map((key, i) => {
    const id = `seq-${i}`;
    nodes.push({ id, type: 'genericNode', position: { x: 0, y: 0 }, data: { name: entityTitle(key), variant: 'lifeline' } });
    return id;
  });
  const messages = ['request()', 'validate()', 'process()', 'respond()'];
  messages.forEach((msg, i) => {
    const from = ids[i % ids.length];
    const to = ids[(i + 1) % ids.length];
    edges.push({ id: uid('edge'), source: from, target: to, type: 'directed-association', label: msg });
  });
  return { name: derivedName(requirements, type), type, nodes, edges };
}

function buildActivityDiagram(_requirements: string, type: DiagramType): AiDiagramPayload {
  const nodes: AiNodePayload[] = [];
  const edges: AiEdgePayload[] = [];
  const steps = ['Start', 'Request received', 'Validate input', 'Decision', 'Process result', 'Notify user', 'End'];
  steps.forEach((step, i) => {
    let variant = 'step';
    let label = step;
    if (i === 0) { variant = 'start'; label = ''; }
    else if (i === steps.length - 1) { variant = 'end'; label = ''; }
    else if (step === 'Decision') { variant = 'decision'; }
    nodes.push({ id: `act-${i}`, type: 'genericNode', position: { x: 0, y: 0 }, data: { name: label, variant } });
    if (i > 0) edges.push({ id: uid('edge'), source: `act-${i - 1}`, target: `act-${i}`, type: 'directed-association' });
  });
  return { name: derivedName(_requirements, type), type, nodes, edges };
}

function buildStateDiagram(_requirements: string, type: DiagramType): AiDiagramPayload {
  const states = ['Created', 'Pending', 'Approved', 'Rejected', 'Completed'];
  const nodes: AiNodePayload[] = [];
  const edges: AiEdgePayload[] = [];
  states.forEach((state, i) => {
    nodes.push({ id: `st-${i}`, type: 'umlNode', position: { x: 0, y: 0 }, data: { name: state } });
    if (i > 0) edges.push({ id: uid('edge'), source: `st-${i - 1}`, target: `st-${i}`, type: 'directed-association', label: 'transition' });
  });
  return { name: derivedName(_requirements, type), type, nodes, edges };
}

function buildComponentDiagram(requirements: string, type: DiagramType): AiDiagramPayload {
  const entities = extractEntities(requirements);
  const picked = entities.length >= 2 ? entities : ['web', 'api', 'database'];
  const nodes: AiNodePayload[] = [];
  const edges: AiEdgePayload[] = [];
  const ids = picked.map((key, i) => {
    const id = `comp-${i}`;
    nodes.push({ id, type: 'componentNode', position: { x: 0, y: 0 }, data: { name: entityTitle(key) } });
    return id;
  });
  for (let i = 1; i < ids.length; i++) {
    edges.push({ id: uid('edge'), source: ids[i - 1], target: ids[i], type: 'dependency' });
  }
  if (picked.some((p) => ['user', 'customer', 'admin', 'student'].includes(p))) {
    nodes.push({ id: 'comp-ui', type: 'componentNode', position: { x: 0, y: 0 }, data: { name: 'UI Layer' } });
    edges.push({ id: uid('edge'), source: 'comp-ui', target: ids[0], type: 'dependency' });
  }
  return { name: derivedName(requirements, type), type, nodes, edges };
}

function buildDeploymentDiagram(_requirements: string, type: DiagramType): AiDiagramPayload {
  const nodes: AiNodePayload[] = [
    { id: 'dep-client', type: 'umlNode', position: { x: 0, y: 0 }, data: { name: 'Client', stereotype: 'device' } },
    { id: 'dep-app', type: 'umlNode', position: { x: 0, y: 0 }, data: { name: 'App Server', stereotype: 'server' } },
    { id: 'dep-web', type: 'umlNode', position: { x: 0, y: 0 }, data: { name: 'Web Server', stereotype: 'server' } },
    { id: 'dep-db', type: 'databaseNode', position: { x: 0, y: 0 }, data: { name: 'Database', fields: ['data', 'index'] } },
    { id: 'dep-queue', type: 'umlNode', position: { x: 0, y: 0 }, data: { name: 'Message Queue', stereotype: 'service' } },
  ];
  const edges: AiEdgePayload[] = [
    { id: uid('edge'), source: 'dep-client', target: 'dep-web', type: 'association', label: 'HTTPS' },
    { id: uid('edge'), source: 'dep-web', target: 'dep-app', type: 'association', label: 'REST' },
    { id: uid('edge'), source: 'dep-app', target: 'dep-db', type: 'association', label: 'SQL' },
    { id: uid('edge'), source: 'dep-app', target: 'dep-queue', type: 'association', label: 'AMQP' },
  ];
  return { name: derivedName(_requirements, type), type, nodes, edges };
}

const BUILDERS: Record<DiagramType, (req: string, type: DiagramType) => AiDiagramPayload> = {
  class: buildClassDiagram,
  'use-case': buildUseCaseDiagram,
  er: buildEntityDiagram,
  sequence: buildSequenceDiagram,
  activity: buildActivityDiagram,
  state: buildStateDiagram,
  component: buildComponentDiagram,
  deployment: buildDeploymentDiagram,
};

/* ------------------------------------------------------------------ */
/*  AI public API                                                      */
/* ------------------------------------------------------------------ */

export async function aiGenerateDiagram(
  requirements: string,
  type: DiagramType,
  onStage?: (label: string, progress: number) => void,
): Promise<{ diagram: Diagram; applied: string[] }> {
  if (API_URL) {
    const payload = await api<AiDiagramPayload>('/ai/generate-diagram', { method: 'POST', body: JSON.stringify({ requirements, type }) });
    const { nodes, edges } = aiNodesToDiagramNodes(payload.nodes, payload.edges);
    const laid = applyLayout(type, nodes);
    const diagram = normalizeDiagram({ id: uid('diag'), name: payload.name, type: payload.type, nodes: laid, edges, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return { diagram, applied: [`Generated ${DIAGRAM_TYPE_LABELS[type]} with ${nodes.length} elements`] };
  }

  const stages = ['Analyzing requirements…', 'Identifying entities…', 'Building relationships…', 'Laying out elements…'];
  stages.forEach((label, i) => onStage?.(label, Math.round(((i + 1) / stages.length) * 100)));
  await delay(900);
  const builder = BUILDERS[type] ?? BUILDERS.class;
  const payload = builder(requirements, type);
  const { nodes, edges } = aiNodesToDiagramNodes(payload.nodes, payload.edges);
  const laid = applyLayout(type, nodes);
  const diagram = normalizeDiagram({ id: uid('diag'), name: payload.name, type, nodes: laid, edges, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  return { diagram, applied: [`Generated ${payload.nodes.length} elements and ${payload.edges.length} relationships`] };
}

function applyLayout(type: DiagramType, nodes: DiagramNode[]): DiagramNode[] {
  const positions = autoLayout(nodes, [], type === 'activity' || type === 'sequence' ? 'vertical' : 'hierarchical');
  return nodes.map((n) => ({ ...n, position: positions.get(n.id) ?? n.position }));
}

/* ------------------------------------------------------------------ */
/*  AI modify — operates on the existing graph, never regenerates it.  */
/* ------------------------------------------------------------------ */

const REL_ALIASES: Record<string, RelationshipType> = {
  association: 'association',
  associate: 'association',
  'directed association': 'directed-association',
  inheritance: 'inheritance',
  inherit: 'inheritance',
  extends: 'inheritance',
  generalization: 'inheritance',
  aggregation: 'aggregation',
  aggregates: 'aggregation',
  composition: 'composition',
  composes: 'composition',
  contains: 'composition',
  dependency: 'dependency',
  depends: 'dependency',
  'depends on': 'dependency',
  realization: 'realization',
  implements: 'realization',
};

function findNodeByLabel(nodes: DiagramNode[], label: string): DiagramNode | undefined {
  const q = label.toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    nodes.find((n) => String(n.data.label).toLowerCase().replace(/[^a-z0-9]/g, '') === q) ??
    nodes.find((n) => String(n.data.label).toLowerCase().includes(q))
  );
}

function newNodeForType(type: string, label: string, position: { x: number; y: number }): DiagramNode {
  const def = ENTITY_DEFS[label.toLowerCase()];
  const node = createUmlNode(type, position, {
    label,
    ...(def
      ? { attributes: def.attrs, methods: def.methods }
      : type === 'classNode'
        ? { attributes: ['- id: number', '- name: string'], methods: ['+ create(): void'] }
        : {}),
  });
  return node;
}

function insertPosition(nodes: DiagramNode[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 120, y: 120 };
  const selected = nodes.find((n) => n.selected);
  if (selected) return { x: selected.position.x + 240, y: selected.position.y + 80 };
  const max = nodes.reduce((acc, n) => (n.position.y > acc.position.y ? n : acc), nodes[0]);
  return { x: max.position.x + 80, y: max.position.y + 200 };
}

export async function aiModifyDiagram(instructions: string, diagram: Diagram): Promise<AiModifyResult> {
  if (API_URL) {
    const payload = await api<AiModifyResult>('/ai/modify-diagram', { method: 'POST', body: JSON.stringify({ instructions, diagram }) });
    const normalized = normalizeDiagram({ ...diagram, nodes: payload.nodes, edges: payload.edges });
    return { ...payload, nodes: normalized.nodes, edges: normalized.edges };
  }

  await delay(650);
  const nodes = diagram.nodes.map((n) => ({ ...n }));
  const edges = diagram.edges.map((e) => ({ ...e }));
  const applied: string[] = [];
  const text = instructions.toLowerCase();

  const addEntity = (label: string, kind: 'class' | 'actor' | 'use-case' | 'component' | 'database' | 'node' | 'note' | 'package') => {
    const typeMap: Record<string, string> = { class: 'classNode', actor: 'actorNode', 'use-case': 'useCaseNode', component: 'componentNode', database: 'databaseNode', node: 'umlNode', note: 'noteNode', package: 'packageNode' };
    const node = newNodeForType(typeMap[kind], label, insertPosition(nodes));
    nodes.push(node);
    applied.push(`Added ${kind} "${label}"`);
    return node;
  };

  const connect = (fromLabel: string, toLabel: string, rel: RelationshipType) => {
    const from = findNodeByLabel(nodes, fromLabel);
    const to = findNodeByLabel(nodes, toLabel);
    if (!from || !to) {
      applied.push(`Could not connect "${fromLabel}" → "${toLabel}" (one of them was not found)`);
      return;
    }
    if (edges.some((e) => e.source === from.id && e.target === to.id)) {
      applied.push(`"${from.data.label}" is already connected to "${to.data.label}"`);
      return;
    }
    edges.push({ id: uid('edge'), source: from.id, target: to.id, type: 'uml-edge', data: { relationship: rel } });
    applied.push(`Connected "${from.data.label}" → "${to.data.label}" (${rel})`);
  };

  const rename = (fromLabel: string, toLabel: string) => {
    const node = findNodeByLabel(nodes, fromLabel);
    if (!node) { applied.push(`Could not find "${fromLabel}" to rename`); return; }
    node.data = { ...node.data, label: toLabel };
    applied.push(`Renamed "${fromLabel}" to "${toLabel}"`);
  };

  const addMember = (targetLabel: string | null, memberText: string, kind: 'attribute' | 'method') => {
    const target =
      (targetLabel ? findNodeByLabel(nodes, targetLabel) : undefined) ??
      nodes.find((n) => n.selected) ??
      nodes.find((n) => ['classNode', 'interfaceNode', 'abstractClassNode', 'objectNode'].includes(n.type ?? ''));
    if (!target) { applied.push('No class-like element found to add members to'); return; }
    const listKey = kind === 'attribute' ? 'attributes' : 'methods';
    const list = Array.isArray(target.data[listKey]) ? [...(target.data[listKey] as unknown[])] : [];
    list.push(memberText);
    target.data = { ...target.data, [listKey]: list };
    applied.push(`Added ${kind} "${memberText}" to "${target.data.label}"`);
  };

  const removeEntity = (label: string) => {
    const node = findNodeByLabel(nodes, label);
    if (!node) { applied.push(`Could not find "${label}" to remove`); return; }
    const id = node.id;
    nodes.splice(0, nodes.length, ...nodes.filter((n) => n.id !== id));
    edges.splice(0, edges.length, ...edges.filter((e) => e.source !== id && e.target !== id));
    applied.push(`Removed "${node.data.label}" and its connections`);
  };

  /* ---------- pattern matching ---------- */
  const relMatch = text.match(/(?:connect|link|relate)\s*["']?([a-zA-Z][\w ]*?)["']?\s+(?:to|with|and)\s+["']?([a-zA-Z][\w ]*?)["']?\s+(?:using|with|as|via)?\s*(?:a |an )?([a-zA-Z -]+)?$/);
  const addMatch2 = text.match(/(?:^|,\s*|\band\s+|\bplease\s+)(add|create)\s+(?:a |an )?([a-zA-Z][\w ]+)\s+and\s+connect\s+(?:it|them)\s+to\s+["']?([a-zA-Z][\w ]*)["']?/);
  const addMatch = text.match(/(?:^|,\s*|\band\s+|\bplease\s+)(add|create|insert|introduce)\s+(?:a |an |the )?([a-zA-Z][\w ]+?)\s*(?:to\s+the\s+diagram)?$/);
  const renameMatch = text.match(/(?:rename|change)\s+["']?([a-zA-Z][\w ]*?)["']?\s+(?:to|into)\s+["']?([a-zA-Z][\w ]*?)["']?/);
  const attrMatch = text.match(/add\s+([a-zA-Z][\w ]*?)\s+(?:attribute|field|property|column)s?\s*(?:to\s+["']?([a-zA-Z][\w ]*)["']?)?/);
  const methodMatch = text.match(/add\s+(?:a |an )?([a-zA-Z][\w ]*?)\s+method\s*(?:to\s+["']?([a-zA-Z][\w ]*)["']?)?/);
  const removeMatch = text.match(/(?:remove|delete)\s+(?:the\s+)?["']?([a-zA-Z][\w ]*?)["']?\s*(?:class|node|element|actor|entity)?$/);
  const connectPair = text.match(/(?:connect|link)\s+["']?([a-zA-Z][\w ]*)["']?\s+(?:to|with)\s+["']?([a-zA-Z][\w ]*)["']?/);

  if (/add\s+authentication|authentication\s+system|add\s+auth\b/.test(text)) {
    const auth = addEntity('AuthService', 'class');
    const first = nodes.find((n) => n.id !== auth.id && ['classNode', 'componentNode'].includes(n.type ?? ''));
    if (first) connect('AuthService', String(first.data.label), 'dependency');
  } else if (addMatch2) {
    const [, , rawLabel, targetLabel] = addMatch2;
    const kind = /actor|person/.test(rawLabel) ? 'actor' : 'class';
    const node = addEntity(capitalize(rawLabel.replace(/[.\s]+$/, '')), kind);
    if (targetLabel) {
      const target = findNodeByLabel(nodes, targetLabel);
      if (target) {
        edges.push({ id: uid('edge'), source: node.id, target: target.id, type: 'uml-edge', data: { relationship: 'association' } });
        applied.push(`Connected "${node.data.label}" to "${target.data.label}"`);
      } else {
        applied.push(`Could not find "${targetLabel}" to connect to`);
      }
    }
  } else if (renameMatch) {
    rename(renameMatch[1].trim(), capitalize(renameMatch[2].trim()));
  } else if (attrMatch) {
    addMember(attrMatch[2]?.trim() ?? null, `- ${attrMatch[1].trim()}: string`, 'attribute');
  } else if (methodMatch) {
    addMember(methodMatch[2]?.trim() ?? null, `+ ${methodMatch[1].trim()}(param: any): void`, 'method');
  } else if (removeMatch && /remove|delete/.test(removeMatch[0])) {
    removeEntity(removeMatch[1].trim());
  } else if (connectPair) {
    const rel: RelationshipType = text.includes('inherit') || text.includes('extends')
      ? 'inheritance'
      : text.includes('aggregat')
        ? 'aggregation'
        : text.includes('compos')
          ? 'composition'
          : text.includes('depend')
            ? 'dependency'
            : text.includes('realiz') || text.includes('implement')
              ? 'realization'
              : 'association';
    connect(connectPair[1].trim(), connectPair[2].trim(), rel);
  } else if (relMatch) {
    const relKey = (relMatch[3] ?? '').trim().toLowerCase();
    const alias = Object.keys(REL_ALIASES).find((k) => relKey.includes(k));
    connect(relMatch[1].trim(), relMatch[2].trim(), REL_ALIASES[alias ?? ''] ?? 'association');
  } else if (addMatch) {
    const rawLabel = addMatch[2].trim().replace(/\b(class|actor|component|entity|node|note|package)\b/g, '').replace(/[.\s]+$/, '').trim();
    const kind = /actor|person/.test(rawLabel) ? 'actor' : 'class';
    addEntity(capitalize(rawLabel), kind);
  }

  if (applied.length === 0) {
    return {
      nodes,
      edges,
      applied: [],
      message: `I couldn't find a matching action for "${instructions}". Try "add a Payment class", "connect Admin with User using inheritance", or "rename User to Customer".`,
    };
  }

  return {
    nodes,
    edges,
    applied,
    message: `Applied ${applied.length} change${applied.length === 1 ? '' : 's'} to your diagram. Keep asking for more refinements.`,
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* ------------------------------------------------------------------ */
/*  AI explain — analyzes the current graph.                           */
/* ------------------------------------------------------------------ */

export async function aiExplainDiagram(diagram: Diagram): Promise<ExplainResult> {
  if (API_URL) {
    return api<ExplainResult>('/ai/explain-diagram', { method: 'POST', body: JSON.stringify({ diagram }) });
  }
  await delay(550);
  const stats = graphStats(diagram);
  const labels = stats.labels;
  const typeLabel = DIAGRAM_TYPE_LABELS[diagram.type] ?? 'Diagram';
  const entities = diagram.nodes.map((n) => ({ name: labels[n.id], kind: n.type ?? 'node' }));
  const relationships = diagram.edges.map((e) => ({
    from: labels[e.source] ?? e.source,
    to: labels[e.target] ?? e.target,
    type: (e.data as { relationship?: string } | undefined)?.relationship ?? 'association',
    ...(typeof e.label === 'string' ? { label: e.label } : {}),
  }));

  const overview = `This ${typeLabel} models **${stats.nodeCount} element${stats.nodeCount === 1 ? '' : 's'}** and **${stats.edgeCount} relationship${stats.edgeCount === 1 ? '' : 's'}**. ${entities.length ? `The main elements are ${entities.slice(0, 4).map((e) => e.name).join(', ')}.` : ''} ${relationships.length ? 'The core flow connects ' + relationships.slice(0, 3).map((r) => `${r.from} → ${r.to}`).join(', ') + '.' : 'No relationships have been defined yet.'}`;

  const architecture =
    diagram.type === 'class'
      ? 'This is a structural (static) model describing the classes of the system, their attributes, methods and how they relate to each other.'
      : diagram.type === 'use-case'
        ? 'This is a behavioral model showing actors and the use cases (goals) they can perform within the system.'
        : diagram.type === 'sequence'
          ? 'This is an interaction diagram describing message flow over time between participants.'
          : diagram.type === 'activity'
            ? 'This is a workflow diagram describing sequential and branching activities.'
            : diagram.type === 'state'
              ? 'This is a state machine describing the lifecycle states and transitions of an entity.'
              : diagram.type === 'er'
                ? 'This is a data model describing entities, keys and their relationships.'
                : diagram.type === 'component'
                  ? 'This is a structural model describing software components and their dependencies.'
                  : 'This is a deployment model describing physical nodes and how software is distributed.';

  const problems: string[] = [];
  if (stats.unconnected.length > 0) problems.push(`Unconnected elements: ${stats.unconnected.join(', ')} — they don't participate in any relationship.`);
  if (stats.nodeCount === 1) problems.push('The diagram contains only one element. Consider adding related classes or actors.');
  if (stats.edgeCount === 0 && stats.nodeCount > 0) problems.push('No relationships defined — elements are isolated from each other.');
  const classLike = diagram.nodes.filter((n) => ['classNode', 'interfaceNode', 'abstractClassNode', 'objectNode'].includes(n.type ?? ''));
  const withoutMethods = classLike.filter((n) => !Array.isArray(n.data.methods) || n.data.methods.length === 0);
  if (withoutMethods.length > 0) problems.push(`${withoutMethods.map((n) => labels[n.id]).join(', ')} ${withoutMethods.length === 1 ? 'has' : 'have'} no methods — behavior may be missing.`);
  if (problems.length === 0) problems.push('No obvious structural issues detected.');

  const suggestions: string[] = [];
  if (diagram.type === 'class') suggestions.push('Ask AI to "add a Payment class" or "connect Order with Customer using aggregation".');
  if (stats.unconnected.length > 0) suggestions.push('Connect the isolated elements by dragging from a node handle.');
  suggestions.push('Run Auto Layout from the diagram properties to tidy up positions.');
  suggestions.push('Export as PNG or PDF from the toolbar to share your diagram.');

  return {
    overview,
    entities,
    relationships,
    architecture: `${architecture} Review the relationships below to check direction and cardinality.`,
    problems,
    suggestions,
  };
}