import type { SimplifiedNode } from "../../../types/extractor-types.js";
import type { BoundingBox } from "../../../types/simplified-types.js";
import { getOptions } from "../../../../options.js";

export function calculateAdjacencyThreshold(baseGap: number): number {
  const { adjacencyThreshold } = getOptions();
  const min = typeof adjacencyThreshold.min === "number" ? adjacencyThreshold.min : 2;
  const max = typeof adjacencyThreshold.max === "number" ? adjacencyThreshold.max : 24;
  const clamped = Math.max(min, Math.min(baseGap, max));
  return clamped;
}

export function computeAdjacencyBaseGap(
  candidates: { index: number; node: SimplifiedNode }[],
): number {
  if (candidates.length < 2) return 2;
  const gaps: number[] = [];
  const rectGap = (a: BoundingBox, b: BoundingBox): number => {
    const dx = Math.max(0, Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width)));
    const dy = Math.max(0, Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height)));
    return Math.max(dx, dy);
  }
  for (let i = 0; i < candidates.length; i++) {
    const rectA = candidates[i].node.absRect as BoundingBox | undefined;
    if (!rectA) continue;
    let minGap = Infinity;
    for (let j = 0; j < candidates.length; j++) {
      if (i === j) continue;
      const rectB = candidates[j].node.absRect as BoundingBox | undefined;
      if (!rectB) continue;
      const gap = rectGap(rectA, rectB);
      if (gap < minGap) minGap = gap;
    }
    if (Number.isFinite(minGap)) gaps.push(minGap);
  }

  if (gaps.length === 0) return 2;
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  return gaps.length % 2 === 1 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
}

/**
 * 分段量化尺寸 (Tiered Quantization)
 * 工业级 D2C 的最佳实践：避免单一阈值导致的过拟合或欠拟合
 * Used for Visual Fingerprinting.
 */
// roRead
export function quantizeSize(val: number): number {
  if (val < 50) {
    // 小元素 (Icon, Badge): 高精度，2px 容错
    return Math.round(val / 2) * 2;
  } else if (val < 200) {
    // 中元素 (Button, Avatar): 中等精度，5px 容错
    return Math.round(val / 5) * 5;
  } else {
    // 大元素 (Card, Image): 低精度，10px 容错
    return Math.round(val / 10) * 10;
  }
}
