import type { Edge, Node } from '@xyflow/react';

export type DiagramType =
  | 'use-case'
  | 'class'
  | 'sequence'
  | 'activity'
  | 'er'
  | 'state'
  | 'component'
  | 'deployment'
  | 'flowchart'
  | 'network'
  | 'architecture'
  | 'gantt';

export type GanttTask = {
  id: string;
  name: string;
  start: string; // ISO calendar date; duration is in calendar days, end is exclusive
  duration: number;
  assignee: string;
  progress: number;
  milestone: boolean;
  dependencies: string[]; // finish-to-start predecessor task IDs
};
export type GanttChart = { tasks: GanttTask[] };
export type DiagramLayer = { id: string; name: string; visible: boolean; locked: boolean };
export type EditorPreferences = {
  canvasBackground: string;
  showGrid: boolean;
  snapToGrid: boolean;
  smartGuides: boolean;
  routing: 'elbow' | 'straight' | 'curved';
  theme: 'classic' | 'ocean' | 'forest' | 'midnight';
};

export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export type BorderStyle = 'solid' | 'dashed' | 'dotted';

export type DiagramNodeData = {
  label: string;
  type: DiagramType;
  nodeType?: string;
  attributes?: string[] | Array<{ id: string; visibility: '+' | '-' | '#' | '~'; name: string; type?: string; params?: string; returnType?: string }>;
  methods?: string[] | Array<{ id: string; visibility: '+' | '-' | '#' | '~'; name: string; type?: string; params?: string; returnType?: string }>;
  fields?: string[];
  stereotype?: string;
  note?: string;
  imageSrc?: string;
  fill?: string;
  borderColor?: string;
  borderStyle?: BorderStyle;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  textAlign?: TextAlign;
  verticalAlign?: VerticalAlign;
  textOffsetX?: number;
  textOffsetY?: number;
  padding?: number;
  lineHeight?: number;
  letterSpacing?: number;
  opacity?: number;
  rotation?: number;
  width?: number;
  height?: number;
  textWrap?: boolean;
  autoSize?: boolean;
  borderWidth?: number;
  radius?: number;
  [key: string]: unknown;
};

export type DiagramNode = Node<DiagramNodeData>;

export type Diagram = {
  id: string;
  name: string;
  type: DiagramType;
  nodes: DiagramNode[];
  edges: Edge[];
  gantt?: GanttChart;
  layers?: DiagramLayer[];
  preferences?: EditorPreferences;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  diagramType: DiagramType;
  diagramCount: number;
  lastEdited: string;
  preview: Diagram;
  starred?: boolean;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  diagramType: DiagramType;
  uses: number;
  diagram: Diagram;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type VersionEntry = {
  id: string;
  version: string;
  label: string;
  timestamp: string;
  diagram: Diagram;
};
