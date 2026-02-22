
import type { SimplifiedNode } from "../../../types/extractor-types.js";
import { getNodeBoundingBox } from "../../../utils/geometry.js";
export function isAutoLayoutNode(node: SimplifiedNode): boolean {
  const layout = (node as any).layout;
  return (
    typeof layout === "object" &&
    !!layout &&
    "layoutMode" in layout &&
    ((layout as any).layoutMode === "HORIZONTAL" || (layout as any).layoutMode === "VERTICAL")
  );
}

// 通过间距判断具体布局方式
export function computeAutoLayoutGap(
  children: SimplifiedNode[],
  direction: "row" | "column"
): { gap: number; uniform: boolean } {
  if (!children || children.length < 2) return { gap: 0, uniform: true };
  const axis = direction === "row" ? "x" : "y";
  const sizeKey = direction === "row" ? "width" : "height";
  const sorted = [...children].sort((a, b) => {
    const rectA = getNodeBoundingBox(a);
    const rectB = getNodeBoundingBox(b);
    const startA = rectA ? rectA[axis] : 0;
    const startB = rectB ? rectB[axis] : 0;
    return startA - startB;
  });

  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevRect = getNodeBoundingBox(sorted[i - 1]);
    const currRect = getNodeBoundingBox(sorted[i]);
    if (!prevRect || !currRect) continue;
    const prevEnd = prevRect[axis] + (prevRect as any)[sizeKey];
    const gap = currRect[axis] - prevEnd;
    gaps.push(gap > 0 ? gap : 0);
  }

  if (gaps.length === 0) return { gap: 0, uniform: true };
  const baseGap = gaps[0];
  const uniform = gaps.every((g) => g === baseGap);
  return { gap: baseGap, uniform };
}
