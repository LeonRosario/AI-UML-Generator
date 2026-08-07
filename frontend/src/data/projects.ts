import type { Diagram, Project } from '@/types';
import { actorNode, classNode, edge, entityNode, useCaseNode } from './diagrams';

const foodDelivery: Diagram = {
  id: 'd-food',
  name: 'Food Delivery',
  type: 'use-case',
  createdAt: '2026-07-15T10:00:00Z',
  updatedAt: '2026-08-05T09:20:00Z',
  nodes: [
    actorNode('fd-c', 0, 60, 'Customer'),
    actorNode('fd-r', 0, 320, 'Restaurant'),
    actorNode('fd-d', 0, 580, 'Delivery Driver'),
    useCaseNode('fd-o', 280, 40, 'Place Order'),
    useCaseNode('fd-p', 280, 180, 'Track Delivery'),
    useCaseNode('fd-pay', 560, 40, 'Make Payment'),
    useCaseNode('fd-m', 280, 320, 'Manage Menu'),
    useCaseNode('fd-a', 280, 460, 'Accept Order'),
    useCaseNode('fd-del', 560, 460, 'Deliver Order'),
  ],
  edges: [
    edge('fe-1', 'fd-c', 'fd-o'),
    edge('fe-2', 'fd-c', 'fd-p'),
    edge('fe-3', 'fd-c', 'fd-pay'),
    edge('fe-4', 'fd-r', 'fd-m'),
    edge('fe-5', 'fd-r', 'fd-a'),
    edge('fe-6', 'fd-d', 'fd-del'),
  ],
};

const hospital: Diagram = {
  id: 'd-hospital',
  name: 'Hospital',
  type: 'er',
  createdAt: '2026-07-10T08:00:00Z',
  updatedAt: '2026-08-04T13:15:00Z',
  nodes: [
    entityNode('h-p', 0, 0, 'Patient', ['id: int (PK)', 'name: varchar', 'blood_type: varchar']),
    entityNode('h-d', 400, 0, 'Doctor', ['id: int (PK)', 'name: varchar', 'specialty: varchar']),
    entityNode('h-app', 200, 300, 'Appointment', ['id: int (PK)', 'patient_id: FK', 'doctor_id: FK', 'date: date']),
    entityNode('h-rec', 0, 580, 'MedicalRecord', ['id: int (PK)', 'patient_id: FK', 'diagnosis: text']),
  ],
  edges: [
    edge('he-1', 'h-p', 'h-app', '1'),
    edge('he-2', 'h-d', 'h-app', '1'),
    edge('he-3', 'h-p', 'h-rec', '1'),
  ],
};

const ecommerce: Diagram = {
  id: 'd-ecom',
  name: 'E-Commerce',
  type: 'class',
  createdAt: '2026-07-02T11:30:00Z',
  updatedAt: '2026-08-06T17:00:00Z',
  nodes: [
    classNode('ec-c', 0, 0, 'Customer', ['id: int', 'email: string', 'address: string'], ['checkout()']),
    classNode('ec-o', 400, 0, 'Order', ['id: int', 'total: decimal', 'status: string'], ['placeOrder()', 'cancel()']),
    classNode('ec-p', 0, 300, 'Product', ['id: int', 'name: string', 'price: decimal', 'stock: int'], ['getInventory()']),
    classNode('ec-oi', 400, 300, 'OrderItem', ['orderId: int', 'productId: int', 'qty: int'], []),
  ],
  edges: [
    edge('ee-1', 'ec-c', 'ec-o', '1'),
    edge('ee-2', 'ec-o', 'ec-oi', '1..*'),
    edge('ee-3', 'ec-p', 'ec-oi', '1..*'),
  ],
};

export const PROJECTS: Project[] = [
  {
    id: 'prj-sms',
    name: 'Student Management System',
    description: 'Course registration, assignments and grading for a university portal.',
    diagramType: 'class',
    diagramCount: 4,
    lastEdited: '2 hours ago',
    starred: true,
    preview: {
      id: 'd-sms',
      name: 'Student Management',
      type: 'class',
      createdAt: '2026-07-20T09:12:00Z',
      updatedAt: '2026-08-05T14:30:00Z',
      nodes: [
        classNode('p-s', 0, 0, 'Student', ['id: int', 'name: string'], ['login()']),
        classNode('p-c', 220, 0, 'Course', ['id: int', 'title: string'], ['getStudents()']),
        classNode('p-e', 110, 140, 'Enrollment', ['grade: string'], ['enroll()']),
      ],
      edges: [edge('pe-1', 'p-s', 'p-e', '1'), edge('pe-2', 'p-c', 'p-e', '1')],
    },
  },
  {
    id: 'prj-food',
    name: 'Online Food Delivery',
    description: 'Ordering, payment and live tracking across customers, restaurants and drivers.',
    diagramType: 'use-case',
    diagramCount: 3,
    lastEdited: 'yesterday',
    preview: foodDelivery,
  },
  {
    id: 'prj-hospital',
    name: 'Hospital Management System',
    description: 'Patient records, doctor scheduling and appointment workflows.',
    diagramType: 'er',
    diagramCount: 6,
    lastEdited: '3 days ago',
    preview: hospital,
  },
  {
    id: 'prj-ecom',
    name: 'E-Commerce Platform',
    description: 'Catalog, cart and order fulfillment for a multi-vendor marketplace.',
    diagramType: 'class',
    diagramCount: 2,
    lastEdited: '5 days ago',
    preview: ecommerce,
  },
  {
    id: 'prj-lib',
    name: 'Library Management System',
    description: 'Book catalog, borrowing, and fines for a public library.',
    diagramType: 'use-case',
    diagramCount: 1,
    lastEdited: '1 week ago',
    preview: {
      id: 'd-lib',
      name: 'Library',
      type: 'use-case',
      createdAt: '2026-07-01T10:00:00Z',
      updatedAt: '2026-07-30T12:00:00Z',
      nodes: [
        actorNode('l-m', 0, 60, 'Member'),
        actorNode('l-l', 0, 260, 'Librarian'),
        useCaseNode('l-b', 260, 40, 'Borrow Book'),
        useCaseNode('l-r', 260, 160, 'Return Book'),
        useCaseNode('l-f', 260, 280, 'Calculate Fine'),
      ],
      edges: [edge('le-1', 'l-m', 'l-b'), edge('le-2', 'l-m', 'l-r'), edge('le-3', 'l-l', 'l-f')],
    },
  },
  {
    id: 'prj-bank',
    name: 'Banking System',
    description: 'Accounts, transactions and transfers with audit logging.',
    diagramType: 'class',
    diagramCount: 5,
    lastEdited: '2 weeks ago',
    preview: {
      id: 'd-bank',
      name: 'Banking',
      type: 'class',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-07-25T12:00:00Z',
      nodes: [
        classNode('b-a', 0, 0, 'Account', ['id: int', 'balance: decimal'], ['deposit()', 'withdraw()']),
        classNode('b-c', 240, 0, 'Customer', ['id: int', 'name: string'], []),
        classNode('b-t', 120, 180, 'Transaction', ['amount: decimal', 'type: string'], ['execute()']),
      ],
      edges: [edge('be-1', 'b-c', 'b-a', '1..*'), edge('be-2', 'b-a', 'b-t', '1..*')],
    },
  },
];
