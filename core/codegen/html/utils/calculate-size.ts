import type { SimplifiedNode } from "../../../types/extractor-types.js";

export function calculateDesignSize(nodes: SimplifiedNode[]): { width: number; height: number } | undefined {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const stack: SimplifiedNode[] = [...nodes];

  while (stack.length > 0) {
    const node = stack.pop() as SimplifiedNode;
    if (node.absRect) {
      minX = Math.min(minX, node.absRect.x);
      minY = Math.min(minY, node.absRect.y);
      maxX = Math.max(maxX, node.absRect.x + node.absRect.width);
      maxY = Math.max(maxY, node.absRect.y + node.absRect.height);
    }
    if (node.children && node.children.length > 0) {
      stack.push(...node.children);
    }
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return undefined;
  }

  return { width: maxX - minX, height: maxY - minY };
}