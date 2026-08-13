import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  ArrowRightLeft,
  Braces,
  Box,
  ChevronsRight,
  Circle,
  CircleDashed,
  Component,
  Database,
  Diamond,
  FolderOpen,
  Gem,
  GitMerge,
  Image,
  MoveRight,
  Package,
  RectangleHorizontal,
  Square,
  StickyNote,
  Triangle,
  Type,
  User,
  Zap,
} from 'lucide-react';
import type { DiagramNode, DiagramType } from '@/types';
import { uid } from '@/data/diagrams';

export type RelationshipType =
  | 'association'
  | 'directed-association'
  | 'inheritance'
  | 'aggregation'
  | 'composition'
  | 'dependency'
  | 'realization';

export type ShapeItem = {
  type: string;
  label: string;
  icon: LucideIcon;
};

export type ShapeCategory = {
  id: string;
  label: string;
  items: ShapeItem[];
};

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  association: 'Association',
  'directed-association': 'Directed Association',
  inheritance: 'Inheritance',
  aggregation: 'Aggregation',
  composition: 'Composition',
  dependency: 'Dependency',
  realization: 'Realization',
};

export const RELATIONSHIPS: { type: RelationshipType; label: string; icon: LucideIcon }[] = [
  { type: 'association', label: RELATIONSHIP_LABELS.association, icon: MoveRight },
  { type: 'inheritance', label: RELATIONSHIP_LABELS.inheritance, icon: Triangle },
  { type: 'aggregation', label: RELATIONSHIP_LABELS.aggregation, icon: Gem },
  { type: 'composition', label: RELATIONSHIP_LABELS.composition, icon: Diamond },
  { type: 'dependency', label: RELATIONSHIP_LABELS.dependency, icon: Zap },
  { type: 'realization', label: RELATIONSHIP_LABELS.realization, icon: ChevronsRight },
  { type: 'directed-association', label: RELATIONSHIP_LABELS['directed-association'], icon: ArrowRight },
];

export const SHAPE_LIBRARY: ShapeCategory[] = [
  {
    id: 'uml',
    label: 'UML',
    items: [
      { type: 'classNode', label: 'Class', icon: Box },
      { type: 'interfaceNode', label: 'Interface', icon: Braces },
      { type: 'abstractClassNode', label: 'Abstract Class', icon: RectangleHorizontal },
      { type: 'objectNode', label: 'Object', icon: Package },
      { type: 'packageNode', label: 'Package', icon: FolderOpen },
      { type: 'componentNode', label: 'Component', icon: Component },
      { type: 'umlNode', label: 'Node', icon: Square },
      { type: 'actorNode', label: 'Actor', icon: User },
      { type: 'useCaseNode', label: 'Use Case', icon: CircleDashed },
      { type: 'systemBoundaryNode', label: 'System Boundary', icon: RectangleHorizontal },
      { type: 'interfaceSymbolNode', label: 'Interface Symbol', icon: Circle },
      { type: 'noteNode', label: 'Note', icon: StickyNote },
    ],
  },
  {
    id: 'relationships',
    label: 'Relationships',
    items: RELATIONSHIPS.map((r) => ({ type: `rel:${r.type}`, label: r.label, icon: r.icon })),
  },
  {
    id: 'other',
    label: 'Other',
    items: [
      { type: 'databaseNode', label: 'Database', icon: Database },
      { type: 'rectangleNode', label: 'Rectangle', icon: Square },
      { type: 'circleNode', label: 'Circle', icon: Circle },
      { type: 'textNode', label: 'Text', icon: Type },
      { type: 'imageNode', label: 'Image', icon: Image },
    ],
  },
];

export const DEFAULT_FILL = '#ffffff';
export const DEFAULT_BORDER = '#334155';
export const DEFAULT_TEXT = '#0f172a';

const DEFAULT_STYLE = {
  fill: DEFAULT_FILL,
  borderColor: DEFAULT_BORDER,
  textColor: DEFAULT_TEXT,
  borderWidth: 1,
  radius: 8,
};

const NODE_DEFAULTS: Record<string, { width: number; height: number; fixed: boolean; defaultData: Record<string, unknown> }> = {
  classNode: { width: 200, height: 120, fixed: false, defaultData: { attributes: ['- id: number'], methods: ['+ login(): boolean'] } },
  interfaceNode: { width: 200, height: 100, fixed: false, defaultData: { attributes: [], methods: ['+ login(): boolean'], stereotype: 'interface' } },
  abstractClassNode: { width: 200, height: 110, fixed: false, defaultData: { attributes: [], methods: ['+ templateMethod(): void'], stereotype: 'abstract' } },
  objectNode: { width: 190, height: 110, fixed: false, defaultData: { attributes: ['id = 1'], methods: [], stereotype: 'object' } },
  packageNode: { width: 180, height: 120, fixed: false, defaultData: { attributes: [], methods: [], stereotype: 'package' } },
  componentNode: { width: 180, height: 90, fixed: false, defaultData: { attributes: [], methods: [], stereotype: 'component' } },
  umlNode: { width: 170, height: 60, fixed: true, defaultData: { attributes: [], methods: [], stereotype: '' } },
  actorNode: { width: 90, height: 84, fixed: true, defaultData: {} },
  useCaseNode: { width: 160, height: 56, fixed: true, defaultData: {} },
  systemBoundaryNode: { width: 320, height: 220, fixed: false, defaultData: { attributes: [], methods: [], stereotype: '' } },
  interfaceSymbolNode: { width: 30, height: 60, fixed: true, defaultData: { attributes: [], methods: [] } },
  noteNode: { width: 170, height: 90, fixed: false, defaultData: { note: 'Add a note…', attributes: [], methods: [] } },
  databaseNode: { width: 200, height: 90, fixed: false, defaultData: { fields: ['id: int (PK)'], attributes: [], methods: [] } },
  rectangleNode: { width: 170, height: 90, fixed: true, defaultData: { attributes: [], methods: [] } },
  circleNode: { width: 100, height: 100, fixed: true, defaultData: { attributes: [], methods: [] } },
  textNode: { width: 160, height: 60, fixed: false, defaultData: { attributes: [], methods: [] } },
  imageNode: { width: 160, height: 140, fixed: true, defaultData: { imageSrc: '', attributes: [], methods: [] } },
  // legacy types
  entityNode: { width: 220, height: 100, fixed: false, defaultData: { fields: ['id: int (PK)'], attributes: [], methods: [] } },
  genericNode: { width: 170, height: 44, fixed: true, defaultData: { attributes: [], methods: [] } },
};

export function nodeDefaults(type: string): { width: number; height: number; fixed: boolean; defaultData: Record<string, unknown> } {
  return NODE_DEFAULTS[type] ?? NODE_DEFAULTS.rectangleNode;
}

export function createUmlNode(type: string, position: { x: number; y: number }, data?: Record<string, unknown>): DiagramNode {
  const defaults = nodeDefaults(type);
  const diagramType = inferDiagramType(type);
  const merged = { ...defaults.defaultData, ...(data ?? {}) };
  return {
    id: uid('node'),
    type,
    position: { x: Math.round(position.x / 24) * 24, y: Math.round(position.y / 24) * 24 },
    data: {
      label: (merged.label as string | undefined) ?? defaultLabel(type),
      nodeType: type,
      type: diagramType,
      ...merged,
      ...styleDefaults(merged),
    },
    style: defaults.fixed ? { width: defaults.width, height: defaults.height } : undefined,
  };
}

function styleDefaults(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.fill === undefined) out.fill = DEFAULT_STYLE.fill;
  if (data.borderColor === undefined) out.borderColor = DEFAULT_STYLE.borderColor;
  if (data.textColor === undefined) out.textColor = DEFAULT_STYLE.textColor;
  if (data.borderWidth === undefined) out.borderWidth = DEFAULT_STYLE.borderWidth;
  if (data.radius === undefined) out.radius = DEFAULT_STYLE.radius;
  return out;
}

export function defaultLabel(type: string): string {
  const map: Record<string, string> = {
    classNode: 'Class',
    interfaceNode: 'Interface',
    abstractClassNode: 'AbstractClass',
    objectNode: 'Object',
    packageNode: 'Package',
    componentNode: 'Component',
    umlNode: 'Node',
    actorNode: 'Actor',
    useCaseNode: 'Use Case',
    systemBoundaryNode: 'System',
    interfaceSymbolNode: '',
    noteNode: 'Note',
    databaseNode: 'Database',
    rectangleNode: 'Rectangle',
    circleNode: 'Circle',
    textNode: 'Text',
    imageNode: 'Image',
    entityNode: 'Table',
    genericNode: 'Step',
  };
  return map[type] ?? 'Element';
}

export function inferDiagramType(type: string): DiagramType {
  if (type === 'actorNode' || type === 'useCaseNode' || type === 'systemBoundaryNode' || type === 'interfaceSymbolNode') return 'use-case';
  if (type === 'classNode' || type === 'interfaceNode' || type === 'abstractClassNode' || type === 'objectNode' || type === 'packageNode') return 'class';
  if (type === 'databaseNode' || type === 'entityNode') return 'er';
  if (type === 'componentNode') return 'component';
  if (type === 'umlNode' || type === 'noteNode') return 'state';
  return 'class';
}

/** Approximate rendered size used for layout + position calculations. */
export function estimateNodeSize(node: DiagramNode): { width: number; height: number } {
  const defaults = nodeDefaults(node.type ?? 'rectangleNode');
  const style = node.style as Record<string, number> | undefined;
  const data = node.data as Record<string, unknown>;
  let width = (style?.width as number | undefined) ?? defaults.width;
  let height = (style?.height as number | undefined) ?? defaults.height;
  if (node.type === 'classNode' || node.type === 'interfaceNode' || node.type === 'abstractClassNode' || node.type === 'objectNode') {
    const attrs = (data.attributes as string[] | undefined)?.length ?? 0;
    const methods = (data.methods as string[] | undefined)?.length ?? 0;
    height = 52 + attrs * 17 + methods * 17;
  }
  if (node.type === 'databaseNode' || node.type === 'entityNode') {
    const fields = (data.fields as string[] | undefined)?.length ?? 0;
    height = 50 + fields * 17;
  }
  if (node.type === 'noteNode') height = Math.max(90, height);
  return { width, height };
}

/** Registry key → whether a node type is a class-like member editor target. */
export function isClassLike(type?: string): boolean {
  return (
    type === 'classNode' ||
    type === 'interfaceNode' ||
    type === 'abstractClassNode' ||
    type === 'objectNode' ||
    type === 'packageNode'
  );
}
