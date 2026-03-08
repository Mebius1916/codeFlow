import type { SimplifiedNode } from "../../../types/extractor-types.js";

export function inferClusterDirection(nodes: SimplifiedNode[]): "row" | "column" {
  const rects = nodes
    .map((n) => n.absRect)
    .filter(Boolean) as NonNullable<SimplifiedNode["absRect"]>[];
  if (rects.length < 2) return "row";

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }

  const width = maxX - minX;
  const height = maxY - minY;

  if (Math.abs(width - height) <= 1) {
    const minCx = Math.min(...rects.map((r) => r.x + r.width / 2));
    const maxCx = Math.max(...rects.map((r) => r.x + r.width / 2));
    const minCy = Math.min(...rects.map((r) => r.y + r.height / 2));
    const maxCy = Math.max(...rects.map((r) => r.y + r.height / 2));
    const spreadX = maxCx - minCx;
    const spreadY = maxCy - minCy;
    return spreadY >= spreadX ? "column" : "row";
  }

  return width >= height ? "row" : "column";
}
