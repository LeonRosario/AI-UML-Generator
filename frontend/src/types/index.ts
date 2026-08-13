import type { Edge, Node } from '@xyflow/react';

export type DiagramType =
  | 'use-case'
  | 'class'
  | 'sequence'
  | 'activity'
  | 'er'
  | 'state'
  | 'component'
  | 'deployment';

export type DiagramNodeData = {
  label: string;
  type: DiagramType;
  nodeType?: string;
  attributes?: string[];
  methods?: string[];
  fields?: string[];
  stereotype?: string;
  note?: string;
  imageSrc?: string;
  fill?: string;
  borderColor?: string;
  textColor?: string;
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
