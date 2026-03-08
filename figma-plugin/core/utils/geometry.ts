import type { SimplifiedNode } from "../types/extractor-types.js";
import type { BoundingBox } from "../types/simplified-types.js";
import { pixelRound } from "./common.js";

// 计算相对位置
export function calculateRelativePosition(
  childRect: { x: number; y: number },
  parentRect: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: pixelRound(childRect.x - parentRect.x),
    y: pixelRound(childRect.y - parentRect.y),
  };
}

// 获取节点的几何信息
export function getNodeBoundingBox(node: SimplifiedNode): BoundingBox | null {
  if (node.absRect) {
    return {
      x: node.absRect.x,
      y: node.absRect.y,
      width: node.absRect.width,
      height: node.absRect.height,
    };
  }
  return null;
}

// 计算矩形的面积
export function getRectArea(rect: BoundingBox | undefined | null): number {
  if (!rect) return 0;
  return rect.width * rect.height;
}

// 判断一个矩形是否完全包含在另一个矩形内
export function isRectContained(parent: BoundingBox, child: BoundingBox, epsilon = 1): boolean {
  return (
    child.x >= parent.x - epsilon &&
    child.y >= parent.y - epsilon &&
    child.x + child.width <= parent.x + parent.width + epsilon &&
    child.y + child.height <= parent.y + parent.height + epsilon
  );
}

// AABB 碰撞检测
export function areRectsTouching(a: BoundingBox, b: BoundingBox, gap = 0): boolean {
  return (
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y
  );
}

// 寻找一个能把所有碎片包裹在内的最小矩形
export function getUnionRect(rects: { x: number; y: number; width: number; height: number }[]) {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// 从矩形 rect 中减去 occluder，返回剩余的矩形区域，用于查看一个元素是否被完全遮挡
export function subtractRect(rect: BoundingBox, occluder: BoundingBox): BoundingBox[] {
  // 1. 计算交集
  const intersectX = Math.max(rect.x, occluder.x);
  const intersectY = Math.max(rect.y, occluder.y);
  const intersectRight = Math.min(rect.x + rect.width, occluder.x + occluder.width);
  const intersectBottom = Math.min(rect.y + rect.height, occluder.y + occluder.height);

  const intersectWidth = intersectRight - intersectX;
  const intersectHeight = intersectBottom - intersectY;

  // 如果没有交集，返回原矩形
  if (intersectWidth <= 0 || intersectHeight <= 0) {
    return [rect];
  }

  const result: BoundingBox[] = [];

  // 2. 切割 Top
  if (rect.y < intersectY) {
    result.push({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: intersectY - rect.y,
    });
  }

  // 3. 切割 Bottom
  if (rect.y + rect.height > intersectBottom) {
    result.push({
      x: rect.x,
      y: intersectBottom,
      width: rect.width,
      height: rect.y + rect.height - intersectBottom,
    });
  }

  // 4. 切割 Left (注意高度范围限制在交集垂直范围内，避免与 Top/Bottom 重叠)
  if (rect.x < intersectX) {
    result.push({
      x: rect.x,
      y: intersectY,
      width: intersectX - rect.x,
      height: intersectHeight,
    });
  }

  // 5. 切割 Right (注意高度范围限制在交集垂直范围内，避免与 Top/Bottom 重叠)
  if (rect.x + rect.width > intersectRight) {
    result.push({
      x: intersectRight,
      y: intersectY,
      width: rect.x + rect.width - intersectRight,
      height: intersectHeight,
    });
  }

  return result;
}
