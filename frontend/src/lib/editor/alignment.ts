import type { DiagramNode } from '@/types';

export function alignmentDelta(moving: DiagramNode[], others: DiagramNode[], threshold = 6) {
  const size = (n: DiagramNode) => ({ width: n.measured?.width ?? (Number(n.style?.width) || 160), height: n.measured?.height ?? (Number(n.style?.height) || 92) });
  const result: { dx: number; dy: number; x?: number; y?: number } = { dx: 0, dy: 0 };
  if (!moving.length) return result;
  const left = Math.min(...moving.map(n => n.position.x)), top = Math.min(...moving.map(n => n.position.y));
  const right = Math.max(...moving.map(n => n.position.x + size(n).width)), bottom = Math.max(...moving.map(n => n.position.y + size(n).height));
  let closestX = threshold, closestY = threshold;
  for (const n of others) {
    const { width, height } = size(n);
    for (const target of [n.position.x, n.position.x + width / 2, n.position.x + width]) {
      for (const source of [left, (left + right) / 2, right]) if (Math.abs(target - source) < closestX) { closestX = Math.abs(target - source); result.dx = target - source; result.x = target; }
    }
    for (const target of [n.position.y, n.position.y + height / 2, n.position.y + height]) {
      for (const source of [top, (top + bottom) / 2, bottom]) if (Math.abs(target - source) < closestY) { closestY = Math.abs(target - source); result.dy = target - source; result.y = target; }
    }
  }
  return result;
}
