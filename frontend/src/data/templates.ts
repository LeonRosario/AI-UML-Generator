import type { Diagram, Template } from '@/types';
import { actorNode, classNode, edge, entityNode, genericNode, useCaseNode } from './diagrams';

function node(id: string, type: string, x: number, y: number, label: string, extra: Record<string, unknown> = {}): Diagram['nodes'][number] {
  return { id, type, position: { x, y }, data: { label, type: 'state', ...extra } };
}

function build(nodes: Diagram['nodes'], edges: Diagram['edges'], type: Diagram['type'], name: string): Diagram {
  return { id: `t-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name, type, nodes, edges, createdAt: '', updatedAt: '' };
}

const studentMgmt: Diagram = build(
  [
    classNode('ts-c', 0, 0, 'Course', ['id: int', 'title: string', 'credits: int'], ['getStudents()']),
    classNode('ts-s', 240, 0, 'Student', ['id: int', 'name: string', 'email: string'], ['enroll()']),
    classNode('ts-a', 120, 200, 'Assignment', ['id: int', 'due: date'], ['submit()']),
  ],
  [edge('ts-1', 'ts-c', 'ts-s', '1..*'), edge('ts-2', 'ts-c', 'ts-a', '1..*')],
  'class',
  'Student Management',
);

const hospital: Diagram = build(
  [
    entityNode('th-p', 0, 0, 'Patient', ['id (PK)', 'name', 'blood_type']),
    entityNode('th-d', 300, 0, 'Doctor', ['id (PK)', 'name', 'specialty']),
    entityNode('th-ap', 150, 200, 'Appointment', ['patient_id (FK)', 'doctor_id (FK)', 'date']),
  ],
  [edge('th-1', 'th-p', 'th-ap', '1'), edge('th-2', 'th-d', 'th-ap', '1')],
  'er',
  'Hospital System',
);

const shopping: Diagram = build(
  [
    actorNode('tsh-u', 0, 60, 'Customer'),
    useCaseNode('tsh-o', 260, 40, 'Place Order'),
    useCaseNode('tsh-pay', 260, 200, 'Checkout'),
    actorNode('tsh-a', 0, 340, 'Admin'),
    useCaseNode('tsh-cat', 260, 340, 'Manage Catalog'),
  ],
  [edge('tsh-1', 'tsh-u', 'tsh-o'), edge('tsh-2', 'tsh-u', 'tsh-pay'), edge('tsh-3', 'tsh-a', 'tsh-cat')],
  'use-case',
  'Online Shopping',
);

const banking: Diagram = build(
  [
    classNode('tb-a', 0, 0, 'Account', ['balance: decimal', 'type: string'], ['deposit()', 'withdraw()']),
    classNode('tb-t', 260, 0, 'Transaction', ['amount: decimal', 'timestamp: date'], ['execute()']),
    classNode('tb-u', 130, 200, 'Customer', ['name: string', 'ssn: string'], ['openAccount()']),
  ],
  [edge('tb-1', 'tb-u', 'tb-a', '1..*'), edge('tb-2', 'tb-a', 'tb-t', '1..*')],
  'class',
  'Banking System',
);

const library: Diagram = build(
  [
    actorNode('tl-m', 0, 60, 'Member'),
    actorNode('tl-l', 0, 300, 'Librarian'),
    useCaseNode('tl-b', 260, 40, 'Borrow Book'),
    useCaseNode('tl-r', 260, 160, 'Return Book'),
    useCaseNode('tl-f', 260, 300, 'Issue Fine'),
  ],
  [edge('tl-1', 'tl-m', 'tl-b'), edge('tl-2', 'tl-m', 'tl-r'), edge('tl-3', 'tl-l', 'tl-f')],
  'use-case',
  'Library System',
);

const food: Diagram = build(
  [
    actorNode('tf-c', 0, 60, 'Customer'),
    useCaseNode('tf-o', 280, 40, 'Place Order'),
    useCaseNode('tf-t', 280, 200, 'Track Order'),
    actorNode('tf-d', 0, 340, 'Driver'),
    useCaseNode('tf-del', 280, 340, 'Deliver Order'),
  ],
  [edge('tf-1', 'tf-c', 'tf-o'), edge('tf-2', 'tf-c', 'tf-t'), edge('tf-3', 'tf-d', 'tf-del')],
  'use-case',
  'Food Delivery',
);

const auth: Diagram = build(
  [
    genericNode('ta-u', 0, 0, 'User', 'lifeline'),
    genericNode('ta-s', 320, 0, 'AuthServer', 'lifeline'),
    genericNode('ta-d', 640, 0, 'Database', 'lifeline'),
  ],
  [
    edge('ta-1', 'ta-u', 'ta-s', 'login(credentials)'),
    edge('ta-2', 'ta-s', 'ta-d', 'verifyUser()'),
    edge('ta-3', 'ta-s', 'ta-u', 'issueToken()'),
  ],
  'sequence',
  'Authentication',
);

export const TEMPLATE_CATEGORIES = [
  'All',
  'E-Commerce',
  'Banking',
  'Hospital',
  'Library',
  'Student Management',
  'Food Delivery',
  'Social Media',
  'Authentication',
  'Online Shopping',
  'Management',
] as const;

export const TEMPLATES: Template[] = [
  {
    id: 'tpl-student',
    name: 'Student Management System',
    description: 'Classes, enrollments and assignments for a university portal.',
    category: 'Student Management',
    diagramType: 'class',
    uses: 1284,
    diagram: studentMgmt,
  },
  {
    id: 'tpl-hospital',
    name: 'Hospital Management System',
    description: 'Patients, doctors and appointments in a relational schema.',
    category: 'Hospital',
    diagramType: 'er',
    uses: 962,
    diagram: hospital,
  },
  {
    id: 'tpl-shopping',
    name: 'Online Shopping System',
    description: 'Customers, checkout and catalog management as use cases.',
    category: 'Online Shopping',
    diagramType: 'use-case',
    uses: 1431,
    diagram: shopping,
  },
  {
    id: 'tpl-banking',
    name: 'Banking System',
    description: 'Accounts, customers and transactions with domain methods.',
    category: 'Banking',
    diagramType: 'class',
    uses: 738,
    diagram: banking,
  },
  {
    id: 'tpl-library',
    name: 'Library Management System',
    description: 'Borrowing, returns and fines for a public library.',
    category: 'Library',
    diagramType: 'use-case',
    uses: 611,
    diagram: library,
  },
  {
    id: 'tpl-food',
    name: 'Food Delivery System',
    description: 'Ordering and delivery flows between customers and drivers.',
    category: 'Food Delivery',
    diagramType: 'use-case',
    uses: 887,
    diagram: food,
  },
  {
    id: 'tpl-auth',
    name: 'Authentication Flow',
    description: 'Token-based login sequence across user and server lifelines.',
    category: 'Authentication',
    diagramType: 'sequence',
    uses: 1054,
    diagram: auth,
  },
  {
    id: 'tpl-social',
    name: 'Social Media Platform',
    description: 'Posts, follows and notifications for a social network.',
    category: 'Social Media',
    diagramType: 'er',
    uses: 542,
    diagram: build(
      [
        entityNode('ts-u', 0, 0, 'User', ['id (PK)', 'username', 'email']),
        entityNode('ts-p', 320, 0, 'Post', ['id (PK)', 'author_id (FK)', 'content']),
        entityNode('ts-l', 160, 220, 'Like', ['user_id (FK)', 'post_id (FK)']),
      ],
      [edge('ts-1', 'ts-u', 'ts-p', '1..*'), edge('ts-2', 'ts-u', 'ts-l', '1..*'), edge('ts-3', 'ts-p', 'ts-l', '1..*')],
      'er',
      'Social Media',
    ),
  },
  {
    id: 'tpl-payroll',
    name: 'Payroll Management',
    description: 'Employees, salaries and payslips for HR departments.',
    category: 'Management',
    diagramType: 'class',
    uses: 409,
    diagram: build(
      [
        classNode('tp-e', 0, 0, 'Employee', ['id: int', 'name: string', 'role: string'], ['calculateSalary()']),
        classNode('tp-p', 260, 0, 'Payslip', ['month: string', 'gross: decimal', 'net: decimal'], ['generate()']),
        classNode('tp-d', 130, 200, 'Department', ['name: string', 'budget: decimal'], []),
      ],
      [edge('tp-1', 'tp-e', 'tp-p', '1..*'), edge('tp-2', 'tp-d', 'tp-e', '1..*')],
      'class',
      'Payroll',
    ),
  },
  {
    id: 'tpl-online-shop',
    name: 'Online Shopping — Class',
    description: 'Customer, cart, orders and payments modeled as classes.',
    category: 'Online Shopping',
    diagramType: 'class',
    uses: 1219,
    diagram: build(
      [
        classNode('tos-c', 0, 0, 'Customer', ['id: int', 'name: string', 'email: string', 'address: string'], ['login()', 'checkout()']),
        classNode('tos-cart', 320, 0, 'Cart', ['id: int', 'items: List'], ['addItem()', 'removeItem()']),
        classNode('tos-p', 320, 240, 'Product', ['id: int', 'name: string', 'price: decimal', 'stock: int'], ['getInventory()']),
        classNode('tos-o', 640, 0, 'Order', ['id: int', 'status: string', 'total: decimal'], ['placeOrder()', 'cancel()']),
        classNode('tos-oi', 640, 240, 'OrderItem', ['orderId: int', 'productId: int', 'qty: int'], []),
        classNode('tos-pay', 960, 0, 'Payment', ['id: int', 'method: string', 'amount: decimal'], ['process()']),
      ],
      [
        { ...edge('tos-1', 'tos-c', 'tos-cart', '1'), type: 'uml', data: { relationship: 'association' } },
        { ...edge('tos-2', 'tos-c', 'tos-o', 'places 1'), type: 'uml', data: { relationship: 'association' } },
        { ...edge('tos-3', 'tos-o', 'tos-oi', 'contains'), type: 'uml', data: { relationship: 'composition' } },
        { ...edge('tos-4', 'tos-cart', 'tos-oi', ''), type: 'uml', data: { relationship: 'association' } },
        { ...edge('tos-5', 'tos-p', 'tos-oi', '1..*'), type: 'uml', data: { relationship: 'association' } },
        { ...edge('tos-6', 'tos-o', 'tos-pay', '1'), type: 'uml', data: { relationship: 'aggregation' } },
      ],
      'class',
      'Online Shopping',
    ),
  },
  {
    id: 'tpl-order-state',
    name: 'Order Lifecycle — State',
    description: 'Order states from draft to delivered with cancellation paths.',
    category: 'E-Commerce',
    diagramType: 'state',
    uses: 618,
    diagram: build(
      [
        node('tsd-1', 'circleNode', 170, 0, '', { fill: '#0f172a', width: 24, height: 24 }),
        node('tsd-2', 'umlNode', 90, 110, 'Draft'),
        node('tsd-3', 'umlNode', 330, 110, 'Paid'),
        node('tsd-4', 'umlNode', 570, 110, 'Shipped'),
        node('tsd-5', 'umlNode', 230, 250, 'Delivered'),
        node('tsd-6', 'umlNode', 570, 260, 'Cancelled'),
        node('tsd-7', 'circleNode', 240, 380, '', { fill: '#0f172a', width: 28, height: 28, borderColor: '#0f172a', borderWidth: 3 }),
      ],
      [
        { ...edge('tste-1', 'tsd-1', 'tsd-2', ''), type: 'uml', data: { relationship: 'association' } },
        { ...edge('tste-2', 'tsd-2', 'tsd-3', 'submit()'), type: 'uml', data: { relationship: 'association' } },
        { ...edge('tste-3', 'tsd-2', 'tsd-6', 'cancel()'), type: 'uml', data: { relationship: 'association' } },
        { ...edge('tste-4', 'tsd-3', 'tsd-4', 'dispatch()'), type: 'uml', data: { relationship: 'association' } },
        { ...edge('tste-5', 'tsd-4', 'tsd-5', 'deliver()'), type: 'uml', data: { relationship: 'association' } },
        { ...edge('tste-6', 'tsd-5', 'tsd-7', ''), type: 'uml', data: { relationship: 'association' } },
      ],
      'state',
      'Order Lifecycle',
    ),
  },
  {
    id: 'tpl-payment',
    name: 'Payment Platform — Component',
    description: 'Web, mobile and gateway components around payment services.',
    category: 'E-Commerce',
    diagramType: 'component',
    uses: 487,
    diagram: build(
      [
        node('componentNode', 0, 0, 'Web App', { type: 'component' }),
        node('componentNode', 340, 0, 'Mobile App', { type: 'component' }),
        node('componentNode', 170, 180, 'API Gateway', { type: 'component' }),
        node('componentNode', 0, 360, 'Auth Service', { type: 'component' }),
        node('componentNode', 340, 360, 'Payment Service', { type: 'component' }),
        node('databaseNode', 620, 200, 'Accounts DB', { type: 'component', fields: ['account', 'transaction'] }),
      ],
      [
        { ...edge('tpm-1', 'tp-1', 'tp-3', ''), type: 'uml', data: { relationship: 'association' } },
        { ...edge('tpm-2', 'tp-2', 'tp-3', ''), type: 'uml', data: { relationship: 'association' } },
        { ...edge('tpm-3', 'tp-3', 'tp-4', ''), type: 'uml', data: { relationship: 'dependency' } },
        { ...edge('tpm-4', 'tp-3', 'tp-5', ''), type: 'uml', data: { relationship: 'dependency' } },
        { ...edge('tpm-5', 'tp-5', 'tp-6', ''), type: 'uml', data: { relationship: 'association' } },
      ],
      'component',
      'Payment Platform',
    ),
  },
  {
    id: 'tpl-deploy',
    name: 'Cloud Platform — Deployment',
    description: 'Physical nodes for a cloud-hosted order platform.',
    category: 'Management',
    diagramType: 'deployment',
    uses: 356,
    diagram: build(
      [
        node('tdp-1', 'umlNode', 0, 0, 'Client Browser', { type: 'deployment', stereotype: 'device' }),
        node('tdp-2', 'umlNode', 320, 0, 'App Server', { type: 'deployment', stereotype: 'server' }),
        node('tdp-3', 'umlNode', 320, 200, 'Web Server', { type: 'deployment', stereotype: 'server' }),
        node('tdp-4', 'databaseNode', 620, 200, 'PostgreSQL', { type: 'deployment', fields: [] }),
        node('tdp-5', 'umlNode', 620, 0, 'Message Queue', { type: 'deployment', stereotype: 'service' }),
      ],
      [
        { ...edge('td-1', 'tdp-1', 'tdp-3', 'HTTPS'), type: 'uml', data: { relationship: 'association' } },
        { ...edge('td-2', 'tdp-3', 'tdp-2', 'REST'), type: 'uml', data: { relationship: 'association' } },
        { ...edge('td-3', 'tdp-2', 'tdp-4', 'SQL'), type: 'uml', data: { relationship: 'association' } },
        { ...edge('td-4', 'tdp-2', 'tdp-5', 'AMQP'), type: 'uml', data: { relationship: 'association' } },
      ],
      'deployment',
      'Cloud Platform',
    ),
  },
];
