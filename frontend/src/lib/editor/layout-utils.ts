import type { Edge, XYPosition } from '@xyflow/react';
import { estimateNodeSize } from './node-types';
import type { DiagramNode } from '@/types';

export type LayoutMode = 'hierarchical' | 'horizontal' | 'vertical';

const GAP = 120;
const GRID = 24;

function snap(value: number) {
  return Math.round(value / GRID) * GRID;
}

/**
 * Layered auto layout.
 *  - horizontal:   nodes flow left → right (layers are columns)
 *  - vertical:     nodes flow top → bottom (layers are rows)
 *  - hierarchical: tree-like left → right flow with parents centered
 *                  over their children.
 * Even gaps are preserved so nodes never overlap.
 */
export function autoLayout(
  nodes: DiagramNode[],
  edges: Edge[],
  mode: LayoutMode,
): Map<string, XYPosition> {
  const positions = new Map<string, XYPosition>();
  if (nodes.length === 0) return positions;
  if (nodes.length === 1) {
    positions.set(nodes[0].id, { x: snap(GAP), y: snap(GAP) });
    return positions;
  }

  const sizes = new Map(nodes.map((n) => [n.id, estimateNodeSize(n)]));
  const childrenOf = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
  const parentCount = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  for (const edge of edges) {
    childrenOf.get(edge.source)?.push(edge.target);
    parentCount.set(edge.target, (parentCount.get(edge.target) ?? 0) + 1);
  }
  const incoming = (id: string) => edges.filter((e) => e.target === id).map((e) => e.source);

  /* 1. Layer assignment: layer(n) = 1 + max(layer(parents)). */
  const layerOf = new Map<string, number>();
  const queue: string[] = nodes.filter((n) => (parentCount.get(n.id) ?? 0) === 0).map((n) => n.id);
  if (queue.length === 0) queue.push(nodes[0].id);
  for (const id of queue) layerOf.set(id, 0);
  while (queue.length > 0) {
    const id = queue.shift() as string;
    const layer = layerOf.get(id) ?? 0;
    for (const child of childrenOf.get(id) ?? []) {
      layerOf.set(child, Math.max(layerOf.get(child) ?? 0, layer + 1));
      queue.push(child);
    }
  }
  let fallback = 0;
  const maxAssigned = Math.max(0, ...Array.from(layerOf.values()));
  for (const n of nodes) {
    if (!layerOf.has(n.id)) layerOf.set(n.id, maxAssigned + 1 + fallback++);
  }

  const layers = new Map<number, string[]>();
  for (const n of nodes) {
    const layer = layerOf.get(n.id) ?? 0;
    const list = layers.get(layer) ?? [];
    list.push(n.id);
    layers.set(layer, list);
  }

  /* 2. Order within each layer so children follow parent order. */
  const orderWithin = new Map<string, number>();
  for (const [, ids] of layers) {
    ids.sort((a, b) => {
      const pa = incoming(a)[0] ?? '';
      const pb = incoming(b)[0] ?? '';
      if (pa !== pb) return (orderWithin.get(pa) ?? 0) - (orderWithin.get(pb) ?? 0);
      return a.localeCompare(b);
    });
    ids.forEach((id, i) => orderWithin.set(id, i));
  }

  const sortedLayers = [...layers.entries()].sort(([a], [b]) => a - b);

  /* 3. Compute positions. */
  const vertical = mode === 'vertical';
  let cursorX = GAP;
  const columnXs = new Map<number, number>();
  for (const [layer, ids] of sortedLayers) {
    columnXs.set(layer, cursorX);
    const maxW = Math.max(...ids.map((id) => sizes.get(id)?.width ?? 170));
    cursorX += maxW + GAP;
  }

  for (const [layer, ids] of sortedLayers) {
    if (!vertical) {
      const x = columnXs.get(layer) ?? GAP;
      let y = GAP;
      for (const id of ids) {
        positions.set(id, { x: snap(x), y: snap(y) });
        y += (sizes.get(id)?.height ?? 90) + GAP;
      }
    }
  }

  if (vertical) {
    /* Rows = layers; stack them top → bottom. */
    let cursorY = GAP;
    for (const [, ids] of sortedLayers) {
      let rowX = GAP;
      for (const id of ids) {
        positions.set(id, { x: snap(rowX), y: snap(cursorY) });
        rowX += (sizes.get(id)?.width ?? 170) + GAP;
      }
      cursorY += Math.max(...ids.map((id) => sizes.get(id)?.height ?? 90)) + GAP;
    }
  }

  /* 4. Hierarchical: center parents over their children. */
  if (mode === 'hierarchical') {
    for (const [layer, ids] of sortedLayers) {
      for (const id of ids) {
        const childIds = (childrenOf.get(id) ?? []).filter((c) => layerOf.get(c) === layer + 1);
        if (childIds.length === 0) continue;
        const childYs = childIds.map((c) => positions.get(c)?.y ?? 0);
        const center = (Math.min(...childYs) + Math.max(...childYs)) / 2;
        const pos = positions.get(id);
        if (pos) positions.set(id, { x: pos.x, y: snap(center - (sizes.get(id)?.height ?? 90) / 2) });
      }
    }
  }

  /* 5. Remove overlaps along the flow axis (safety pass). */
  const groups = vertical
    ? [nodes.map((n) => n.id)]
    : sortedLayers.map(([, ids]) => ids);
  for (const group of groups) {
    const sorted = [...group].sort((a, b) => {
      const pa = positions.get(a);
      const pb = positions.get(b);
      const ya = vertical ? pa?.x ?? 0 : pa?.y ?? 0;
      const yb = vertical ? pb?.x ?? 0 : pb?.y ?? 0;
      return ya - yb;
    });
    for (let i = 1; i < sorted.length; i++) {
      const prev = positions.get(sorted[i - 1]);
      const curr = positions.get(sorted[i]);
      if (!prev || !curr) continue;
      const prevBottom = vertical ? prev.x + (sizes.get(sorted[i - 1])?.width ?? 170) : prev.y + (sizes.get(sorted[i - 1])?.height ?? 90);
      const currStart = vertical ? curr.x : curr.y;
      if (currStart < prevBottom + GAP) {
        const fixed = vertical
          ? { x: prevBottom + GAP, y: curr.y }
          : { x: curr.x, y: prevBottom + GAP };
        positions.set(sorted[i], { x: snap(fixed.x), y: snap(fixed.y) });
      }
    }
  }

  return positions;
}

/** Bounding box of all nodes — used for export framing. */
export function diagramBounds(nodes: DiagramNode[]) {
  if (nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    const size = estimateNodeSize(n);
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + size.width);
    maxY = Math.max(maxY, n.position.y + size.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
