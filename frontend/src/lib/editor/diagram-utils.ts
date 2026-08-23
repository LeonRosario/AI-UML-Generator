import type { Edge, Node } from '@xyflow/react';
import type { Diagram, DiagramNode, DiagramType, Template } from '@/types';
import { uid } from '@/data/diagrams';
import { createUmlNode, inferDiagramType } from './node-types';
import { autoLayout } from './layout-utils';

/* ------------------------------------------------------------------ */
/*  Member model: attributes / methods can be string[] (legacy, AI     */
/*  payload, templates) or structured MemberRow[] (editor).            */
/* ------------------------------------------------------------------ */

export type Visibility = '+' | '-' | '#' | '~';

export type MemberRow = {
  id: string;
  visibility: Visibility;
  name: string;
  type?: string;
  params?: string;
  returnType?: string;
};

const VIS_SYMBOLS: Record<Visibility, string> = { '+': '+', '-': '-', '#': '#', '~': '~' };

export function isVisibility(value: string): value is Visibility {
  return value === '+' || value === '-' || value === '#' || value === '~';
}

export function toVisibility(value: string | undefined, fallback: Visibility): Visibility {
  return isVisibility(value ?? '') ? (value as Visibility) : fallback;
}

const MEMBER_RE = /^([+#\-#~]?)\s*([A-Za-z_]\w*)\s*(?:\(([^)]*)\))?\s*(?::\s*(.+))?$/;

export function parseMember(raw: string): { visibility: string; name: string; params?: string; type?: string } {
  const match = MEMBER_RE.exec(raw.trim());
  if (!match) return { visibility: raw.trim().charAt(0) || '+', name: raw.trim() };
  const [, visibility, name, params, type] = match;
  return {
    visibility: visibility || '+',
    name: name || raw.trim(),
    ...(params !== undefined ? { params } : {}),
    ...(type ? { type } : {}),
  };
}

export function memberToRow(raw: string, kind: 'attribute' | 'method', index = 0): MemberRow {
  const parsed = parseMember(raw);
  return {
    id: uid('mem'),
    visibility: toVisibility(parsed.visibility, kind === 'attribute' ? '-' : '+'),
    name: parsed.name,
    ...(kind === 'attribute'
      ? parsed.type
        ? { type: parsed.type }
        : {}
      : { ...(parsed.params ? { params: parsed.params } : {}), ...(parsed.type ? { returnType: parsed.type } : {}) }),
  };
}

export function memberToString(row: MemberRow, kind: 'attribute' | 'method'): string {
  const vis = VIS_SYMBOLS[row.visibility] ?? '+';
  if (kind === 'attribute') {
    const type = row.type?.trim();
    return `${vis} ${row.name}${type ? `: ${type}` : ''}`.trim();
  }
  const params = row.params?.trim();
  const returnType = row.returnType?.trim();
  return `${vis} ${row.name}(${params ?? ''})${returnType ? `: ${returnType}` : ''}`.trim();
}

export function normalizeMemberList(value: unknown, kind: 'attribute' | 'method'): MemberRow[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') return memberToRow(item, kind);
      if (item && typeof item === 'object') {
        const row = item as Partial<MemberRow>;
        return {
          id: row.id ?? uid('mem'),
          visibility: toVisibility(row.visibility, kind === 'attribute' ? '-' : '+'),
          name: row.name ?? '',
          ...(row.type ? { type: String(row.type) } : {}),
          ...(row.params ? { params: String(row.params) } : {}),
          ...(row.returnType ? { returnType: String(row.returnType) } : {}),
        };
      }
      return memberToRow(String(item), kind);
    });
  }
  return [];
}

/** Rows → display strings (used for export + AI payload). */
export function membersToStrings(rows: unknown, kind: 'attribute' | 'method'): string[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    if (typeof row === 'string') return row;
    if (row && typeof row === 'object') {
      const r = row as Partial<MemberRow>;
      return memberToString(
        { id: r.id ?? '', visibility: toVisibility(r.visibility, kind === 'attribute' ? '-' : '+'), name: r.name ?? '', type: r.type, params: r.params, returnType: r.returnType },
        kind,
      );
    }
    return String(row);
  });
}

/* ------------------------------------------------------------------ */
/*  Diagram normalization / conversion                                 */
/* ------------------------------------------------------------------ */

export function normalizeDiagram(diagram: Diagram): Diagram {
  const now = new Date().toISOString();
  const nodes = (diagram.nodes ?? []).map((node) => {
    const data = node.data ?? {};
    return {
      ...node,
      type: node.type || 'rectangleNode',
      data: {
        ...data,
        nodeType: (data.nodeType as string) ?? node.type,
        type: (data.type as DiagramType) ?? inferDiagramType(node.type ?? ''),
        label: (data.label as string) ?? 'Element',
        attributes: normalizeMemberList(data.attributes, 'attribute'),
        methods: normalizeMemberList(data.methods, 'method'),
        fields: Array.isArray(data.fields) ? data.fields.map(String) : [],
        ...(data.fill === undefined ? { fill: '#ffffff' } : {}),
        ...(data.borderColor === undefined ? { borderColor: '#334155' } : {}),
        ...(data.textColor === undefined ? { textColor: '#0f172a' } : {}),
        ...(data.borderWidth === undefined ? { borderWidth: 1 } : {}),
        ...(data.radius === undefined ? { radius: 8 } : {}),
      },
    };
  });
  return {
    ...diagram,
    id: diagram.id || `diag-${Date.now()}`,
    name: diagram.name || 'Untitled diagram',
    type: diagram.type || 'class',
    nodes,
    edges: (diagram.edges ?? []).map((edge) => ({
      ...edge,
      type: 'uml-edge',
      data: edge.data && typeof edge.data === 'object' ? edge.data : { relationship: (edge.data as { relationship?: string } | undefined)?.relationship ?? 'association' },
    })),
    createdAt: diagram.createdAt || now,
    updatedAt: diagram.updatedAt || now,
    ownerId: diagram.ownerId,
  };
}

export function serializeDiagram(diagram: Diagram): Record<string, unknown> {
  return {
    id: diagram.id,
    name: diagram.name,
    type: diagram.type,
    createdAt: diagram.createdAt,
    updatedAt: diagram.updatedAt,
    ownerId: diagram.ownerId,
    nodes: diagram.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      ...(node.style ? { style: node.style } : {}),
      data: {
        ...node.data,
        attributes: membersToStrings(node.data.attributes, 'attribute'),
        methods: membersToStrings(node.data.methods, 'method'),
      },
    })),
    edges: diagram.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
      ...(edge.targetHandle ? { targetHandle: edge.targetHandle } : {}),
      ...(edge.label ? { label: edge.label } : {}),
      type: 'uml-edge',
      data: { relationship: (edge.data as { relationship?: string } | undefined)?.relationship ?? 'association' },
    })),
  };
}

export function createBlankDiagram(type: DiagramType = 'class', name = 'Untitled diagram'): Diagram {
  const now = new Date().toISOString();
  return { id: uid('diag'), name, type, nodes: [], edges: [], createdAt: now, updatedAt: now };
}

/** Convert an AI structured payload ({ nodes, edges }) into editable React Flow nodes/edges. */
export function aiNodesToDiagramNodes(
  payloadNodes: Array<Record<string, unknown>>,
  payloadEdges: Array<Record<string, unknown>>,
): { nodes: DiagramNode[]; edges: Edge[] } {
  const nodes: DiagramNode[] = payloadNodes.map((raw) => {
    const type = (raw.type as string) ?? 'classNode';
    const data = (raw.data as Record<string, unknown>) ?? {};
    const position = (raw.position as { x: number; y: number }) ?? { x: 0, y: 0 };
    const base = createUmlNode(type, position, {
      label: data.name ?? data.label ?? 'Element',
      attributes: Array.isArray(data.attributes) ? data.attributes : [],
      methods: Array.isArray(data.methods) ? data.methods : [],
      fields: Array.isArray(data.fields) ? data.fields : [],
      ...data,
    });
    return { ...base, id: (raw.id as string) ?? base.id };
  });
  const idMap = new Map(payloadNodes.map((raw, i) => [raw.id, nodes[i].id]));
  const edges: Edge[] = payloadEdges.map((raw, i) => ({
    id: (raw.id as string) ?? uid('edge'),
    type: 'uml-edge',
    source: idMap.get(raw.source) ?? String(raw.source),
    target: idMap.get(raw.target) ?? String(raw.target),
    ...(raw.label ? { label: String(raw.label) } : {}),
    data: { relationship: (raw.type as string) ?? 'association' },
  }));
  return { nodes, edges };
}

/** Load a template into a fresh editable diagram. */
export function templateToDiagram(template: Template): Diagram {
  return normalizeDiagram({
    ...template.diagram,
    id: uid('diag'),
    name: template.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/** Parse a UML Forge JSON document (export or import format). */
export function parseDiagramJson(raw: string): Diagram {
  const parsed = JSON.parse(raw) as Partial<Diagram> & { data?: unknown };
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid diagram file.');
  const nested = parsed.data && typeof parsed.data === 'object' ? parsed.data as { nodes?: unknown; edges?: unknown } : {};
  const nodes = parsed.nodes ?? nested.nodes;
  const edges = parsed.edges ?? nested.edges;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) throw new Error('Missing nodes or edges in the diagram file.');
  return normalizeDiagram({
    id: typeof parsed.id === 'string' ? parsed.id : uid('diag'),
    name: typeof parsed.name === 'string' ? parsed.name : 'Imported diagram',
    type: (parsed.type as DiagramType) ?? 'class',
    nodes: nodes as DiagramNode[],
    edges: edges as Edge[],
    createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerId: parsed.ownerId,
  });
}

/* ------------------------------------------------------------------ */
/*  Graph helpers (used by AI explain + validation)                    */
/* ------------------------------------------------------------------ */

export type GraphStats = {
  nodeCount: number;
  edgeCount: number;
  nodeKindCounts: Record<string, number>;
  unconnected: string[];
  noIncoming: string[];
  labels: Record<string, string>;
};

export function graphStats(diagram: Diagram): GraphStats {
  const labels: Record<string, string> = {};
  const nodeKindCounts: Record<string, number> = {};
  for (const node of diagram.nodes) {
    labels[node.id] = typeof node.data.label === 'string' ? node.data.label : 'Unnamed';
    nodeKindCounts[node.type ?? 'node'] = (nodeKindCounts[node.type ?? 'node'] ?? 0) + 1;
  }
  const connected = new Set<string>();
  for (const edge of diagram.edges) {
    connected.add(edge.source);
    connected.add(edge.target);
  }
  const unconnected = diagram.nodes.filter((n) => !connected.has(n.id)).map((n) => labels[n.id]);
  const noIncoming = diagram.nodes.filter((n) => !diagram.edges.some((e) => e.target === n.id)).map((n) => labels[n.id]);
  return { nodeCount: diagram.nodes.length, edgeCount: diagram.edges.length, nodeKindCounts, unconnected, noIncoming, labels };
}