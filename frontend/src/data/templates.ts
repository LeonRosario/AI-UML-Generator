import type { Diagram, Template } from '@/types';
import { actorNode, classNode, edge, entityNode, genericNode, useCaseNode } from './diagrams';

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
  'Education',
  'Healthcare',
  'E-Commerce',
  'Banking',
  'Social Media',
  'Management',
  'Authentication',
] as const;

export const TEMPLATES: Template[] = [
  {
    id: 'tpl-student',
    name: 'Student Management System',
    description: 'Classes, enrollments and assignments for a university portal.',
    category: 'Education',
    diagramType: 'class',
    uses: 1284,
    diagram: studentMgmt,
  },
  {
    id: 'tpl-hospital',
    name: 'Hospital Management System',
    description: 'Patients, doctors and appointments in a relational schema.',
    category: 'Healthcare',
    diagramType: 'er',
    uses: 962,
    diagram: hospital,
  },
  {
    id: 'tpl-shopping',
    name: 'Online Shopping System',
    description: 'Customers, checkout and catalog management as use cases.',
    category: 'E-Commerce',
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
    category: 'Management',
    diagramType: 'use-case',
    uses: 611,
    diagram: library,
  },
  {
    id: 'tpl-food',
    name: 'Food Delivery System',
    description: 'Ordering and delivery flows between customers and drivers.',
    category: 'E-Commerce',
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
];
