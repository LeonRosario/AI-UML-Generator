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
  aliases?: string[];
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

export type ElementDefinition = {
  id: string;
  name: string;
  category: string;
  type: string;
  icon: LucideIcon;
  defaultWidth: number;
  defaultHeight: number;
  defaultProperties: Record<string, unknown>;
  allowedConnections: string[];
  preview: 'class' | 'interface' | 'actor' | 'usecase' | 'component' | 'package' | 'database' | 'entity' | 'object' | 'state' | 'decision' | 'initial' | 'final' | 'lifeline' | 'note' | 'process' | 'data-store' | 'flowchart' | 'generic';
};

export const ELEMENT_REGISTRY: Record<string, ElementDefinition> = {
  classNode: { id: 'uml-class', name: 'Class', category: 'UML', type: 'classNode', icon: Box, defaultWidth: 200, defaultHeight: 120, defaultProperties: { attributes: ['- id: number'], methods: ['+ login(): boolean'] }, allowedConnections: ['classNode','interfaceNode','abstractClassNode','objectNode','packageNode','actorNode','useCaseNode'], preview: 'class' },
  abstractClassNode: { id: 'uml-abstract-class', name: 'Abstract Class', category: 'UML', type: 'abstractClassNode', icon: RectangleHorizontal, defaultWidth: 200, defaultHeight: 110, defaultProperties: { attributes: [], methods: ['+ templateMethod(): void'], stereotype: 'abstract' }, allowedConnections: ['classNode','interfaceNode','abstractClassNode'], preview: 'class' },
  interfaceNode: { id: 'uml-interface', name: 'Interface', category: 'UML', type: 'interfaceNode', icon: Braces, defaultWidth: 190, defaultHeight: 96, defaultProperties: { attributes: [], methods: ['+ login(): boolean'], stereotype: 'interface' }, allowedConnections: ['classNode','abstractClassNode','interfaceNode'], preview: 'interface' },
  enumerationNode: { id: 'uml-enumeration', name: 'Enumeration', category: 'UML', type: 'enumerationNode', icon: Braces, defaultWidth: 180, defaultHeight: 110, defaultProperties: { values: ['READ', 'WRITE'], stereotype: 'enum' }, allowedConnections: ['classNode','interfaceNode'], preview: 'interface' },
  objectNode: { id: 'uml-object', name: 'Object', category: 'UML', type: 'objectNode', icon: Package, defaultWidth: 190, defaultHeight: 110, defaultProperties: { attributes: ['id = 1'], methods: [], stereotype: 'object' }, allowedConnections: ['classNode','interfaceNode','actorNode'], preview: 'object' },
  packageNode: { id: 'uml-package', name: 'Package', category: 'UML', type: 'packageNode', icon: FolderOpen, defaultWidth: 200, defaultHeight: 140, defaultProperties: { attributes: [], methods: [], stereotype: 'package' }, allowedConnections: ['classNode','packageNode','componentNode','databaseNode'], preview: 'package' },
  componentNode: { id: 'uml-component', name: 'Component', category: 'UML', type: 'componentNode', icon: Component, defaultWidth: 180, defaultHeight: 90, defaultProperties: {}, allowedConnections: ['classNode','componentNode','interfaceNode'], preview: 'component' },
  umlNode: { id: 'uml-node', name: 'Node', category: 'UML', type: 'umlNode', icon: Square, defaultWidth: 170, defaultHeight: 80, defaultProperties: {}, allowedConnections: ['umlNode','componentNode','databaseNode'], preview: 'generic' },
  artifactNode: { id: 'uml-artifact', name: 'Artifact', category: 'UML', type: 'artifactNode', icon: StickyNote, defaultWidth: 170, defaultHeight: 90, defaultProperties: {}, allowedConnections: ['classNode', 'componentNode'], preview: 'process' },
  databaseNode: { id: 'uml-database', name: 'Database', category: 'UML', type: 'databaseNode', icon: Database, defaultWidth: 200, defaultHeight: 90, defaultProperties: { fields: ['id: int (PK)'] }, allowedConnections: ['classNode', 'databaseNode', 'entityNode'], preview: 'database' },
  entityNode: { id: 'uml-entity', name: 'Entity', category: 'UML', type: 'entityNode', icon: RectangleHorizontal, defaultWidth: 220, defaultHeight: 100, defaultProperties: { fields: ['id: int (PK)'] }, allowedConnections: ['classNode', 'databaseNode', 'entityNode'], preview: 'entity' },
  boundaryNode: { id: 'uml-boundary', name: 'Boundary', category: 'UML', type: 'boundaryNode', icon: RectangleHorizontal, defaultWidth: 240, defaultHeight: 180, defaultProperties: {}, allowedConnections: ['actorNode', 'useCaseNode'], preview: 'generic' },
  controlNode: { id: 'uml-control', name: 'Control', category: 'UML', type: 'controlNode', icon: Box, defaultWidth: 150, defaultHeight: 100, defaultProperties: {}, allowedConnections: ['actorNode', 'useCaseNode', 'classNode'], preview: 'generic' },
  dataStoreNode: { id: 'uml-data-store', name: 'Data Store', category: 'UML', type: 'dataStoreNode', icon: Database, defaultWidth: 180, defaultHeight: 90, defaultProperties: {}, allowedConnections: ['classNode','processNode','flowProcessNode'], preview: 'data-store' },
  actorNode: { id: 'uml-actor', name: 'Actor', category: 'UML', type: 'actorNode', icon: User, defaultWidth: 100, defaultHeight: 90, defaultProperties: {}, allowedConnections: ['useCaseNode', 'classNode'], preview: 'actor' },
  useCaseNode: { id: 'uml-use-case', name: 'Use Case', category: 'UML', type: 'useCaseNode', icon: CircleDashed, defaultWidth: 160, defaultHeight: 58, defaultProperties: {}, allowedConnections: ['actorNode', 'classNode', 'useCaseNode'], preview: 'usecase' },
  systemBoundaryNode: { id: 'uml-system-boundary', name: 'System Boundary', category: 'UML', type: 'systemBoundaryNode', icon: RectangleHorizontal, defaultWidth: 320, defaultHeight: 220, defaultProperties: {}, allowedConnections: ['actorNode', 'useCaseNode'], preview: 'generic' },
  activityInitialNode: { id: 'activity-initial', name: 'Initial Node', category: 'Activity', type: 'activityInitialNode', icon: Circle, defaultWidth: 32, defaultHeight: 32, defaultProperties: {}, allowedConnections: ['activityActionNode', 'activityDecisionNode'], preview: 'initial' },
  activityActionNode: { id: 'activity-action', name: 'Action', category: 'Activity', type: 'activityActionNode', icon: RectangleHorizontal, defaultWidth: 150, defaultHeight: 64, defaultProperties: {}, allowedConnections: ['activityActionNode', 'activityDecisionNode', 'activityFinalNode'], preview: 'generic' },
  activityDecisionNode: { id: 'activity-decision', name: 'Decision', category: 'Activity', type: 'activityDecisionNode', icon: Diamond, defaultWidth: 120, defaultHeight: 80, defaultProperties: {}, allowedConnections: ['activityActionNode', 'activityDecisionNode'], preview: 'decision' },
  activityFinalNode: { id: 'activity-final', name: 'Final Node', category: 'Activity', type: 'activityFinalNode', icon: Circle, defaultWidth: 36, defaultHeight: 36, defaultProperties: {}, allowedConnections: ['activityActionNode'], preview: 'final' },
  activityForkNode: { id: 'activity-fork', name: 'Fork', category: 'Activity', type: 'activityForkNode', icon: GitMerge, defaultWidth: 150, defaultHeight: 12, defaultProperties: {}, allowedConnections: ['activityActionNode'], preview: 'generic' },
  stateNode: { id: 'state-node', name: 'State', category: 'State', type: 'stateNode', icon: RectangleHorizontal, defaultWidth: 170, defaultHeight: 80, defaultProperties: {}, allowedConnections: ['stateNode', 'stateChoiceNode'], preview: 'state' },
  stateChoiceNode: { id: 'state-choice', name: 'Decision', category: 'State', type: 'stateChoiceNode', icon: Diamond, defaultWidth: 120, defaultHeight: 80, defaultProperties: {}, allowedConnections: ['stateNode'], preview: 'decision' },
  stateFinalNode: { id: 'state-final', name: 'Final State', category: 'State', type: 'stateFinalNode', icon: Circle, defaultWidth: 40, defaultHeight: 40, defaultProperties: {}, allowedConnections: ['stateNode'], preview: 'final' },
  sequenceLifelineNode: { id: 'sequence-lifeline', name: 'Lifeline', category: 'Sequence', type: 'sequenceLifelineNode', icon: MoveRight, defaultWidth: 120, defaultHeight: 150, defaultProperties: {}, allowedConnections: ['sequenceLifelineNode'], preview: 'lifeline' },
  sequenceActorNode: { id: 'sequence-actor', name: 'Actor', category: 'Sequence', type: 'sequenceActorNode', icon: User, defaultWidth: 100, defaultHeight: 90, defaultProperties: {}, allowedConnections: ['sequenceLifelineNode'], preview: 'actor' },
  sequenceFragmentNode: { id: 'sequence-fragment', name: 'Interaction', category: 'Sequence', type: 'sequenceFragmentNode', icon: Braces, defaultWidth: 220, defaultHeight: 120, defaultProperties: {}, allowedConnections: ['sequenceLifelineNode'], preview: 'generic' },
  flowProcessNode: { id: 'flow-process', name: 'Process', category: 'Flowchart', type: 'flowProcessNode', icon: RectangleHorizontal, defaultWidth: 170, defaultHeight: 88, defaultProperties: {}, allowedConnections: ['flowProcessNode', 'flowDecisionNode', 'flowDatabaseNode'], preview: 'process' },
  flowDecisionNode: { id: 'flow-decision', name: 'Decision', category: 'Flowchart', type: 'flowDecisionNode', icon: Diamond, defaultWidth: 130, defaultHeight: 88, defaultProperties: {}, allowedConnections: ['flowProcessNode', 'flowDecisionNode'], preview: 'decision' },
  flowTerminatorNode: { id: 'flow-terminator', name: 'Start/End', category: 'Flowchart', type: 'flowTerminatorNode', icon: Circle, defaultWidth: 120, defaultHeight: 60, defaultProperties: {}, allowedConnections: ['flowProcessNode'], preview: 'initial' },
  flowInputOutputNode: { id: 'flow-input-output', name: 'Input/Output', category: 'Flowchart', type: 'flowInputOutputNode', icon: ArrowRightLeft, defaultWidth: 170, defaultHeight: 86, defaultProperties: {}, allowedConnections: ['flowProcessNode'], preview: 'generic' },
  flowDocumentNode: { id: 'flow-document', name: 'Document', category: 'Flowchart', type: 'flowDocumentNode', icon: StickyNote, defaultWidth: 160, defaultHeight: 80, defaultProperties: {}, allowedConnections: ['flowProcessNode'], preview: 'process' },
  flowDatabaseNode: { id: 'flow-database', name: 'Database', category: 'Flowchart', type: 'flowDatabaseNode', icon: Database, defaultWidth: 160, defaultHeight: 80, defaultProperties: {}, allowedConnections: ['flowProcessNode'], preview: 'database' },
  flowConnectorNode: { id: 'flow-connector', name: 'Connector', category: 'Flowchart', type: 'flowConnectorNode', icon: Circle, defaultWidth: 34, defaultHeight: 34, defaultProperties: {}, allowedConnections: ['flowProcessNode', 'flowDecisionNode'], preview: 'generic' },
  erEntityNode: { id: 'er-entity', name: 'Entity', category: 'ER Diagram', type: 'erEntityNode', icon: RectangleHorizontal, defaultWidth: 180, defaultHeight: 90, defaultProperties: { fields: ['id: int (PK)'] }, allowedConnections: ['erEntityNode', 'erRelationshipNode'], preview: 'entity' },
  erWeakEntityNode: { id: 'er-weak-entity', name: 'Weak Entity', category: 'ER Diagram', type: 'erWeakEntityNode', icon: RectangleHorizontal, defaultWidth: 180, defaultHeight: 92, defaultProperties: { fields: ['id: int (PK)'] }, allowedConnections: ['erEntityNode', 'erRelationshipNode'], preview: 'entity' },
  erAttributeNode: { id: 'er-attribute', name: 'Attribute', category: 'ER Diagram', type: 'erAttributeNode', icon: Circle, defaultWidth: 120, defaultHeight: 48, defaultProperties: {}, allowedConnections: ['erEntityNode'], preview: 'generic' },
  erRelationshipNode: { id: 'er-relationship', name: 'Relationship', category: 'ER Diagram', type: 'erRelationshipNode', icon: Diamond, defaultWidth: 120, defaultHeight: 76, defaultProperties: {}, allowedConnections: ['erEntityNode'], preview: 'decision' },
  messageNode: { id: 'sequence-message', name: 'Message', category: 'Sequence', type: 'messageNode', icon: ArrowRight, defaultWidth: 160, defaultHeight: 56, defaultProperties: {}, allowedConnections: ['sequenceLifelineNode'], preview: 'generic' },
  returnMessageNode: { id: 'sequence-return-message', name: 'Return Message', category: 'Sequence', type: 'returnMessageNode', icon: ArrowRightLeft, defaultWidth: 160, defaultHeight: 56, defaultProperties: {}, allowedConnections: ['sequenceLifelineNode'], preview: 'generic' },
  selfMessageNode: { id: 'sequence-self-message', name: 'Self Message', category: 'Sequence', type: 'selfMessageNode', icon: ArrowRight, defaultWidth: 120, defaultHeight: 80, defaultProperties: {}, allowedConnections: ['sequenceLifelineNode'], preview: 'generic' },
  createMessageNode: { id: 'sequence-create-message', name: 'Create Message', category: 'Sequence', type: 'createMessageNode', icon: ArrowRight, defaultWidth: 160, defaultHeight: 56, defaultProperties: {}, allowedConnections: ['sequenceLifelineNode'], preview: 'generic' },
  destroyMessageNode: { id: 'sequence-destroy-message', name: 'Destroy Message', category: 'Sequence', type: 'destroyMessageNode', icon: ArrowRight, defaultWidth: 160, defaultHeight: 56, defaultProperties: {}, allowedConnections: ['sequenceLifelineNode'], preview: 'generic' },
  noteNode: { id: 'uml-note', name: 'Note', category: 'UML', type: 'noteNode', icon: StickyNote, defaultWidth: 170, defaultHeight: 90, defaultProperties: { note: 'Add a note…' }, allowedConnections: ['classNode','useCaseNode','actorNode'], preview: 'note' },
  commentNode: { id: 'uml-comment', name: 'Comment', category: 'UML', type: 'commentNode', icon: StickyNote, defaultWidth: 150, defaultHeight: 84, defaultProperties: {}, allowedConnections: ['classNode','useCaseNode'], preview: 'note' },
  constraintNode: { id: 'uml-constraint', name: 'Constraint', category: 'UML', type: 'constraintNode', icon: Square, defaultWidth: 140, defaultHeight: 60, defaultProperties: {}, allowedConnections: ['classNode','useCaseNode'], preview: 'generic' },
  stereotypeNode: { id: 'uml-stereotype', name: 'Stereotype', category: 'UML', type: 'stereotypeNode', icon: Box, defaultWidth: 150, defaultHeight: 68, defaultProperties: {}, allowedConnections: ['classNode'], preview: 'generic' },
  interactionNode: { id: 'uml-interaction', name: 'Interaction', category: 'UML', type: 'interactionNode', icon: Braces, defaultWidth: 220, defaultHeight: 120, defaultProperties: {}, allowedConnections: ['sequenceLifelineNode'], preview: 'generic' },
  signalNode: { id: 'uml-signal', name: 'Signal', category: 'UML', type: 'signalNode', icon: Circle, defaultWidth: 120, defaultHeight: 70, defaultProperties: {}, allowedConnections: ['classNode','useCaseNode','flowProcessNode'], preview: 'generic' },
  portNode: { id: 'uml-port', name: 'Port', category: 'UML', type: 'portNode', icon: Circle, defaultWidth: 48, defaultHeight: 48, defaultProperties: {}, allowedConnections: ['componentNode','umlNode'], preview: 'generic' },
  processNode: { id: 'dfd-process', name: 'Process', category: 'DFD', type: 'processNode', icon: RectangleHorizontal, defaultWidth: 170, defaultHeight: 88, defaultProperties: {}, allowedConnections: ['externalEntityNode', 'dataStoreNode'], preview: 'process' },
  externalEntityNode: { id: 'dfd-external-entity', name: 'External Entity', category: 'DFD', type: 'externalEntityNode', icon: User, defaultWidth: 120, defaultHeight: 80, defaultProperties: {}, allowedConnections: ['processNode'], preview: 'actor' },
  dfdProcessNode: { id: 'dfd-process-2', name: 'DFD Process', category: 'DFD', type: 'dfdProcessNode', icon: RectangleHorizontal, defaultWidth: 170, defaultHeight: 88, defaultProperties: {}, allowedConnections: ['externalEntityNode', 'dataStoreNode'], preview: 'process' },
  dataFlowNode: { id: 'dfd-data-flow', name: 'Data Flow', category: 'DFD', type: 'dataFlowNode', icon: ArrowRight, defaultWidth: 150, defaultHeight: 50, defaultProperties: {}, allowedConnections: ['processNode', 'dataStoreNode'], preview: 'generic' },
};

export const SHAPE_LIBRARY: ShapeCategory[] = [
  {
    id: 'uml',
    label: 'UML',
    items: [
      { type: 'classNode', label: 'Class', icon: Box },
      { type: 'abstractClassNode', label: 'Abstract Class', icon: RectangleHorizontal },
      { type: 'interfaceNode', label: 'Interface', icon: Braces },
      { type: 'enumerationNode', label: 'Enumeration', icon: Braces },
      { type: 'objectNode', label: 'Object', icon: Package },
      { type: 'packageNode', label: 'Package', icon: FolderOpen },
      { type: 'componentNode', label: 'Component', icon: Component },
      { type: 'umlNode', label: 'Node', icon: Square },
      { type: 'artifactNode', label: 'Artifact', icon: StickyNote },
      { type: 'databaseNode', label: 'Database', icon: Database },
      { type: 'entityNode', label: 'Entity', icon: RectangleHorizontal },
      { type: 'boundaryNode', label: 'Boundary', icon: RectangleHorizontal },
      { type: 'controlNode', label: 'Control', icon: Box },
      { type: 'dataStoreNode', label: 'Data Store', icon: Database },
      { type: 'actorNode', label: 'Actor', icon: User },
      { type: 'useCaseNode', label: 'Use Case', icon: CircleDashed },
      { type: 'systemBoundaryNode', label: 'System Boundary', icon: RectangleHorizontal },
      { type: 'noteNode', label: 'Note', icon: StickyNote },
      { type: 'commentNode', label: 'Comment', icon: StickyNote },
      { type: 'constraintNode', label: 'Constraint', icon: Square },
      { type: 'stereotypeNode', label: 'Stereotype', icon: Box },
    ],
  },
  { id: 'behavioral', label: 'Behavioral', items: [
    { type: 'useCaseNode', label: 'Use Case', icon: CircleDashed },
    { type: 'actorNode', label: 'Actor', icon: User },
    { type: 'systemBoundaryNode', label: 'System Boundary', icon: RectangleHorizontal },
    { type: 'activityActionNode', label: 'Action', icon: RectangleHorizontal },
    { type: 'activityDecisionNode', label: 'Decision', icon: Diamond },
    { type: 'activityInitialNode', label: 'Initial Node', icon: Circle },
    { type: 'activityFinalNode', label: 'Final Node', icon: Circle },
    { type: 'activityForkNode', label: 'Fork', icon: GitMerge },
    { type: 'stateNode', label: 'State', icon: RectangleHorizontal },
    { type: 'stateChoiceNode', label: 'State Machine', icon: Diamond },
  ]},
  { id: 'sequence', label: 'Sequence', items: [
    { type: 'sequenceLifelineNode', label: 'Lifeline', icon: MoveRight },
    { type: 'activityActionNode', label: 'Activation', icon: RectangleHorizontal },
    { type: 'objectNode', label: 'Object', icon: Package },
    { type: 'messageNode', label: 'Message', icon: ArrowRight },
    { type: 'returnMessageNode', label: 'Return Message', icon: ArrowRightLeft },
    { type: 'selfMessageNode', label: 'Self Message', icon: ArrowRight },
    { type: 'createMessageNode', label: 'Create Message', icon: ArrowRight },
    { type: 'destroyMessageNode', label: 'Destroy Message', icon: ArrowRight },
  ]},
  { id: 'flowchart', label: 'Flowchart', items: [
    { type: 'flowProcessNode', label: 'Process', icon: RectangleHorizontal, aliases: ['action'] },
    { type: 'flowDecisionNode', label: 'Decision', icon: Diamond, aliases: ['choice'] },
    { type: 'flowTerminatorNode', label: 'Start/End', icon: Circle, aliases: ['start', 'end'] },
    { type: 'flowInputOutputNode', label: 'Input/Output', icon: ArrowRightLeft },
    { type: 'flowDocumentNode', label: 'Document', icon: StickyNote },
    { type: 'flowDatabaseNode', label: 'Database', icon: Database, aliases: ['db'] },
    { type: 'flowConnectorNode', label: 'Connector', icon: Circle },
  ]},
  { id: 'er', label: 'ER Diagram', items: [
    { type: 'erEntityNode', label: 'Entity', icon: RectangleHorizontal, aliases: ['table'] },
    { type: 'erWeakEntityNode', label: 'Weak Entity', icon: RectangleHorizontal },
    { type: 'erAttributeNode', label: 'Attribute', icon: Circle },
    { type: 'erRelationshipNode', label: 'Relationship', icon: Diamond },
    { type: 'databaseNode', label: 'Database', icon: Database, aliases: ['db'] },
  ]},
  { id: 'dfd', label: 'DFD', items: [
    { type: 'processNode', label: 'Process', icon: RectangleHorizontal },
    { type: 'externalEntityNode', label: 'External Entity', icon: User },
    { type: 'dataStoreNode', label: 'Data Store', icon: Database },
    { type: 'dataFlowNode', label: 'Data Flow', icon: ArrowRight },
  ]},
  { id: 'relationships', label: 'Relationships', items: RELATIONSHIPS.map((r) => ({ type: `rel:${r.type}`, label: r.label, icon: r.icon })) },
  { id: 'other', label: 'Other', items: [
    { type: 'noteNode', label: 'Note', icon: StickyNote },
    { type: 'sequenceFragmentNode', label: 'Interaction', icon: Braces },
    { type: 'signalNode', label: 'Signal', icon: Circle },
    { type: 'portNode', label: 'Port', icon: Circle },
    { type: 'rectangleNode', label: 'Rectangle', icon: Square },
    { type: 'circleNode', label: 'Circle', icon: Circle },
    { type: 'textNode', label: 'Text', icon: Type },
    { type: 'imageNode', label: 'Image', icon: Image },
  ]},
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
  enumerationNode: { width: 180, height: 110, fixed: false, defaultData: { values: ['READ', 'WRITE'], stereotype: 'enum' } },
  boundaryNode: { width: 240, height: 180, fixed: false, defaultData: {} },
  controlNode: { width: 150, height: 100, fixed: true, defaultData: {} },
  dataStoreNode: { width: 180, height: 90, fixed: false, defaultData: {} },
  messageNode: { width: 160, height: 56, fixed: true, defaultData: {} },
  returnMessageNode: { width: 160, height: 56, fixed: true, defaultData: {} },
  selfMessageNode: { width: 120, height: 80, fixed: true, defaultData: {} },
  createMessageNode: { width: 160, height: 56, fixed: true, defaultData: {} },
  destroyMessageNode: { width: 160, height: 56, fixed: true, defaultData: {} },
  commentNode: { width: 150, height: 84, fixed: false, defaultData: {} },
  constraintNode: { width: 140, height: 60, fixed: true, defaultData: {} },
  stereotypeNode: { width: 150, height: 68, fixed: true, defaultData: {} },
  interactionNode: { width: 220, height: 120, fixed: false, defaultData: {} },
  signalNode: { width: 120, height: 70, fixed: true, defaultData: {} },
  portNode: { width: 48, height: 48, fixed: true, defaultData: {} },
  processNode: { width: 170, height: 88, fixed: false, defaultData: {} },
  externalEntityNode: { width: 120, height: 80, fixed: true, defaultData: {} },
  dfdProcessNode: { width: 170, height: 88, fixed: false, defaultData: {} },
  dataFlowNode: { width: 150, height: 50, fixed: true, defaultData: {} },
  // legacy types
  entityNode: { width: 220, height: 100, fixed: false, defaultData: { fields: ['id: int (PK)'], attributes: [], methods: [] } },
  genericNode: { width: 170, height: 44, fixed: true, defaultData: { attributes: [], methods: [] } },
};

export function nodeDefaults(type: string): { width: number; height: number; fixed: boolean; defaultData: Record<string, unknown> } {
  if (!NODE_DEFAULTS[type] && /^(flow|er|sequence|activity|state|deployment|network|arch|cloud)/.test(type)) {
    let width = 160, height = 92;
    if (['sequenceActorNode', 'networkClientNode', 'archClientNode'].includes(type)) { width = 100; height = 84; }
    if (['activityInitialNode', 'stateInitialNode', 'flowConnectorNode'].includes(type)) { width = 32; height = 32; }
    if (['activityFinalNode', 'stateFinalNode'].includes(type)) { width = 40; height = 40; }
    if (type === 'activityForkNode') { width = 144; height = 12; }
    if (type === 'sequenceLifelineNode') { width = 130; height = 144; }
    if (['sequenceFragmentNode', 'swimlaneNode'].includes(type)) { width = 224; height = 128; }
    if (['networkRouterNode', 'networkSwitchNode'].includes(type)) { width = 144; height = 80; }
    return { width, height, fixed: true, defaultData: {} };
  }
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
  return map[type] ?? SHAPE_LIBRARY.flatMap(category => category.items).find(item => item.type === type)?.label ?? type.replace(/Node$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function inferDiagramType(type: string): DiagramType {
  if (type.startsWith('flow')) return 'flowchart';
  if (type.startsWith('network')) return 'network';
  if (type.startsWith('arch') || type.startsWith('cloud')) return 'architecture';
  if (type.startsWith('er')) return 'er';
  if (type.startsWith('sequence')) return 'sequence';
  if (type.startsWith('activity') || type === 'swimlaneNode') return 'activity';
  if (type.startsWith('deployment') || type === 'artifactNode') return 'deployment';
  if (type.startsWith('state')) return 'state';
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
