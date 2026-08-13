import type { Edge } from '@xyflow/react';
import type { Diagram, DiagramNode, DiagramType } from '@/types';

let nodeSeq = 0;
export const uid = (prefix = 'n') => `${prefix}-${++nodeSeq}-${Math.random().toString(36).slice(2, 7)}`;

export function edge(id: string, source: string, target: string, label?: string, extra: Partial<Edge> = {}): Edge {
  return { id, source, target, label, type: 'smoothstep', ...extra };
}

export function classNode(
  id: string,
  x: number,
  y: number,
  label: string,
  attributes: string[],
  methods: string[],
  stereotype?: string,
): DiagramNode {
  return {
    id,
    type: 'classNode',
    position: { x, y },
    data: { label, type: 'class', attributes, methods, stereotype },
  };
}

export function actorNode(id: string, x: number, y: number, label: string): DiagramNode {
  return { id, type: 'actorNode', position: { x, y }, data: { label, type: 'use-case' } };
}

export function useCaseNode(id: string, x: number, y: number, label: string): DiagramNode {
  return { id, type: 'useCaseNode', position: { x, y }, data: { label, type: 'use-case' } };
}

export function entityNode(id: string, x: number, y: number, label: string, fields: string[]): DiagramNode {
  return {
    id,
    type: 'entityNode',
    position: { x, y },
    data: { label, type: 'er', fields },
  };
}

export function genericNode(
  id: string,
  x: number,
  y: number,
  label: string,
  variant: 'step' | 'lifeline' | 'decision' | 'start' | 'end' = 'step',
): DiagramNode {
  return { id, type: 'genericNode', position: { x, y }, data: { label, type: 'activity', variant } };
}

/* ------------------------------------------------------------------ */
/*  Class diagram — Student Management System                          */
/* ------------------------------------------------------------------ */

export const CLASS_SMS: Diagram = {
  id: 'diag-class-sms',
  name: 'Student Management — Class',
  type: 'class',
  createdAt: '2026-07-20T09:12:00Z',
  updatedAt: '2026-08-05T14:30:00Z',
  nodes: [
    classNode('c-student', 0, 0, 'Student', ['id: int', 'name: string', 'email: string'], ['login()', 'register()']),
    classNode('c-teacher', 340, 0, 'Teacher', ['id: int', 'name: string', 'department: string'], ['createCourse()', 'gradeAssignment()']),
    classNode('c-course', 680, 0, 'Course', ['id: int', 'title: string', 'credits: int'], ['getStudents()', 'assignTeacher()']),
    classNode('c-enrollment', 200, 280, 'Enrollment', ['studentId: int', 'courseId: int', 'grade: string'], ['enroll()']),
    classNode('c-assignment', 680, 280, 'Assignment', ['id: int', 'title: string', 'dueDate: date'], ['submit()', 'grade()']),
  ],
  edges: [
    edge('e-enroll-student', 'c-student', 'c-enrollment', '1'),
    edge('e-enroll-course', 'c-course', 'c-enrollment', '1'),
    edge('e-teach', 'c-teacher', 'c-course', '1..*'),
    edge('e-assign', 'c-course', 'c-assignment', '1..*'),
  ],
};

/* ------------------------------------------------------------------ */
/*  Use case diagram                                                   */
/* ------------------------------------------------------------------ */

export const USE_CASE: Diagram = {
  id: 'diag-usecase',
  name: 'Student Portal — Use Case',
  type: 'use-case',
  createdAt: '2026-07-18T10:00:00Z',
  updatedAt: '2026-08-04T16:45:00Z',
  nodes: [
    actorNode('uc-student', 0, 60, 'Student'),
    actorNode('uc-teacher', 0, 300, 'Teacher'),
    actorNode('uc-admin', 0, 540, 'Admin'),
    useCaseNode('uc-register', 280, 40, 'Register Course'),
    useCaseNode('uc-submit', 280, 170, 'Submit Assignment'),
    useCaseNode('uc-grades', 560, 40, 'View Grades'),
    useCaseNode('uc-create', 280, 320, 'Create Course'),
    useCaseNode('uc-grade', 560, 320, 'Grade Assignments'),
    useCaseNode('uc-users', 560, 170, 'Manage Users'),
  ],
  edges: [
    edge('ue-s-reg', 'uc-student', 'uc-register'),
    edge('ue-s-sub', 'uc-student', 'uc-submit'),
    edge('ue-s-gr', 'uc-student', 'uc-grades'),
    edge('ue-t-cre', 'uc-teacher', 'uc-create'),
    edge('ue-t-gra', 'uc-teacher', 'uc-grade'),
    edge('ue-a-use', 'uc-admin', 'uc-users'),
    edge('ue-a-gra', 'uc-admin', 'uc-grade'),
  ],
};

/* ------------------------------------------------------------------ */
/*  Sequence diagram — course registration                             */
/* ------------------------------------------------------------------ */

export const SEQUENCE: Diagram = {
  id: 'diag-sequence',
  name: 'Course Registration — Sequence',
  type: 'sequence',
  createdAt: '2026-07-22T08:30:00Z',
  updatedAt: '2026-08-03T11:20:00Z',
  nodes: [
    genericNode('sq-student', 0, 0, 'Student', 'lifeline'),
    genericNode('sq-ui', 300, 0, 'CourseUI', 'lifeline'),
    genericNode('sq-ctrl', 600, 0, 'CourseController', 'lifeline'),
    genericNode('sq-db', 900, 0, 'Database', 'lifeline'),
  ],
  edges: [
    edge('se-1', 'sq-student', 'sq-ui', 'selectCourse()'),
    edge('se-2', 'sq-ui', 'sq-ctrl', 'registerCourse(studentId)'),
    edge('se-3', 'sq-ctrl', 'sq-db', 'findCourse(id)'),
    edge('se-4', 'sq-db', 'sq-ctrl', 'course'),
    edge('se-5', 'sq-ctrl', 'sq-db', 'saveEnrollment()'),
    edge('se-6', 'sq-db', 'sq-ctrl', 'ok'),
    edge('se-7', 'sq-ctrl', 'sq-ui', 'confirmation'),
    edge('se-8', 'sq-ui', 'sq-student', 'Course registered'),
  ],
};

/* ------------------------------------------------------------------ */
/*  Activity diagram — assignment grading                              */
/* ------------------------------------------------------------------ */

export const ACTIVITY: Diagram = {
  id: 'diag-activity',
  name: 'Assignment Grading — Activity',
  type: 'activity',
  createdAt: '2026-07-25T13:00:00Z',
  updatedAt: '2026-08-02T09:40:00Z',
  nodes: [
    genericNode('ac-start', 320, 0, 'Start', 'start'),
    genericNode('ac-submit', 240, 120, 'Student submits assignment', 'step'),
    genericNode('ac-valid', 320, 240, 'Validate submission', 'step'),
    genericNode('ac-decision', 320, 360, 'Valid?', 'decision'),
    genericNode('ac-grade', 0, 480, 'Grade and notify student', 'step'),
    genericNode('ac-reject', 560, 480, 'Reject with reason', 'step'),
    genericNode('ac-end', 320, 600, 'End', 'end'),
  ],
  edges: [
    edge('ae-1', 'ac-start', 'ac-submit'),
    edge('ae-2', 'ac-submit', 'ac-valid'),
    edge('ae-3', 'ac-valid', 'ac-decision'),
    edge('ae-4', 'ac-decision', 'ac-grade', 'yes'),
    edge('ae-5', 'ac-decision', 'ac-reject', 'no'),
    edge('ae-6', 'ac-grade', 'ac-end'),
    edge('ae-7', 'ac-reject', 'ac-end'),
  ],
};

/* ------------------------------------------------------------------ */
/*  ER diagram — student enrollment                                    */
/* ------------------------------------------------------------------ */

export const ER: Diagram = {
  id: 'diag-er',
  name: 'Enrollment — ER',
  type: 'er',
  createdAt: '2026-07-27T15:10:00Z',
  updatedAt: '2026-08-01T10:05:00Z',
  nodes: [
    entityNode('er-student', 0, 0, 'Student', ['id: int (PK)', 'name: varchar', 'email: varchar', 'phone: varchar']),
    entityNode('er-course', 400, 0, 'Course', ['id: int (PK)', 'title: varchar', 'credits: int']),
    entityNode('er-enroll', 200, 300, 'Enrollment', ['student_id: FK', 'course_id: FK', 'grade: varchar']),
  ],
  edges: [
    edge('ee-1', 'er-student', 'er-enroll', '1'),
    edge('ee-2', 'er-course', 'er-enroll', '1'),
  ],
};

/* ------------------------------------------------------------------ */
/*  State diagram — order lifecycle                                    */
/* ------------------------------------------------------------------ */

export const STATE: Diagram = {
  id: 'diag-state',
  name: 'Order Lifecycle — State',
  type: 'state',
  createdAt: '2026-07-28T10:00:00Z',
  updatedAt: '2026-08-06T12:00:00Z',
  nodes: [
    { id: 'st-start', type: 'circleNode', position: { x: 190, y: 0 }, data: { label: '', type: 'state', nodeType: 'circle', width: 24, height: 24, fill: '#0f172a' } },
    { id: 'st-draft', type: 'umlNode', position: { x: 120, y: 90 }, data: { label: 'Draft', type: 'state' } },
    { id: 'st-paid', type: 'umlNode', position: { x: 350, y: 90 }, data: { label: 'Paid', type: 'state' } },
    { id: 'st-ship', type: 'umlNode', position: { x: 580, y: 90 }, data: { label: 'Shipped', type: 'state' } },
    { id: 'st-del', type: 'umlNode', position: { x: 240, y: 220 }, data: { label: 'Delivered', type: 'state' } },
    { id: 'st-cancel', type: 'umlNode', position: { x: 580, y: 230 }, data: { label: 'Cancelled', type: 'state' } },
    { id: 'st-end', type: 'circleNode', position: { x: 250, y: 340 }, data: { label: '', type: 'state', nodeType: 'circle', width: 28, height: 28, fill: '#0f172a', borderColor: '#0f172a', borderWidth: 3 } },
  ],
  edges: [
    edge('ste-1', 'st-start', 'st-draft'),
    edge('ste-2', 'st-draft', 'st-paid', 'submit()'),
    edge('ste-3', 'st-draft', 'st-cancel', 'cancel()'),
    edge('ste-4', 'st-paid', 'st-ship', 'dispatch()'),
    edge('ste-5', 'st-ship', 'st-del', 'deliver()'),
    edge('ste-6', 'st-del', 'st-end'),
  ],
};

/* ------------------------------------------------------------------ */
/*  Component diagram — payment platform                               */
/* ------------------------------------------------------------------ */

export const COMPONENT: Diagram = {
  id: 'diag-component',
  name: 'Payment Platform — Component',
  type: 'component',
  createdAt: '2026-07-29T09:00:00Z',
  updatedAt: '2026-08-05T15:00:00Z',
  nodes: [
    { id: 'cp-web', type: 'componentNode', position: { x: 0, y: 0 }, data: { label: 'Web App', type: 'component' } },
    { id: 'cp-mobile', type: 'componentNode', position: { x: 340, y: 0 }, data: { label: 'Mobile App', type: 'component' } },
    { id: 'cp-gw', type: 'componentNode', position: { x: 170, y: 180 }, data: { label: 'API Gateway', type: 'component' } },
    { id: 'cp-auth', type: 'componentNode', position: { x: 0, y: 360 }, data: { label: 'Auth Service', type: 'component' } },
    { id: 'cp-pay', type: 'componentNode', position: { x: 340, y: 360 }, data: { label: 'Payment Service', type: 'component' } },
    { id: 'cp-db', type: 'databaseNode', position: { x: 620, y: 200 }, data: { label: 'Accounts DB', type: 'component', fields: ['account', 'transaction'] } },
  ],
  edges: [
    edge('cpe-1', 'cp-web', 'cp-gw'),
    edge('cpe-2', 'cp-mobile', 'cp-gw'),
    edge('cpe-3', 'cp-gw', 'cp-auth'),
    edge('cpe-4', 'cp-gw', 'cp-pay'),
    edge('cpe-5', 'cp-pay', 'cp-db'),
  ],
};

/* ------------------------------------------------------------------ */
/*  Deployment diagram — cloud order platform                          */
/* ------------------------------------------------------------------ */

export const DEPLOYMENT: Diagram = {
  id: 'diag-deployment',
  name: 'Cloud Platform — Deployment',
  type: 'deployment',
  createdAt: '2026-07-30T14:00:00Z',
  updatedAt: '2026-08-04T10:00:00Z',
  nodes: [
    { id: 'dp-client', type: 'umlNode', position: { x: 0, y: 0 }, data: { label: 'Client Browser', type: 'deployment', stereotype: 'device' } },
    { id: 'dp-app', type: 'umlNode', position: { x: 320, y: 0 }, data: { label: 'App Server', type: 'deployment', stereotype: 'server' } },
    { id: 'dp-web', type: 'umlNode', position: { x: 320, y: 200 }, data: { label: 'Web Server', type: 'deployment', stereotype: 'server' } },
    { id: 'dp-db', type: 'databaseNode', position: { x: 620, y: 200 }, data: { label: 'PostgreSQL', type: 'deployment', fields: [] } },
    { id: 'dp-queue', type: 'umlNode', position: { x: 620, y: 0 }, data: { label: 'Message Queue', type: 'deployment', stereotype: 'service' } },
  ],
  edges: [
    edge('dpe-1', 'dp-client', 'dp-web', 'HTTPS'),
    edge('dpe-2', 'dp-web', 'dp-app', 'REST'),
    edge('dpe-3', 'dp-app', 'dp-db', 'SQL'),
    edge('dpe-4', 'dp-app', 'dp-queue', 'AMQP'),
  ],
};

export const DIAGRAMS_BY_TYPE: Record<DiagramType, Diagram> = {
  'use-case': USE_CASE,
  class: CLASS_SMS,
  sequence: SEQUENCE,
  activity: ACTIVITY,
  er: ER,
  state: STATE,
  component: COMPONENT,
  deployment: DEPLOYMENT,
};

export const DIAGRAM_TYPE_LABELS: Record<DiagramType, string> = {
  'use-case': 'Use Case',
  class: 'Class',
  sequence: 'Sequence',
  activity: 'Activity',
  er: 'ER Diagram',
  state: 'State Diagram',
  component: 'Component Diagram',
  deployment: 'Deployment Diagram',
};
