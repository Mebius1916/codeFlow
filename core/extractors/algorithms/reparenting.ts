/**
 * Reparenting Algorithm (Strict Layer-Based Recursive)
 */

import type { SimplifiedNode } from "../../types/extractor-types.js";
import { getRectArea, isRectContained, areRectsTouching, calculateRelativePosition } from "../../utils/geometry.js";
import { canBeParent } from "../../utils/candidate-check.js";
import { getOptions } from "../../../options.js";
import type { SimplifiedLayout } from "../../types/simplified-types.js";

export function reparentNodes(nodes: SimplifiedNode[], parent?: SimplifiedNode): SimplifiedNode[] {
  if (nodes.length === 0) return [];
  const { reparenting } = getOptions();
  const partlyContainThreshold = reparenting.partlyContainThreshold;

  const processingNodes = [...nodes];

  // 用于存储处理后的新子节点列表 (未被吃掉的节点)
  const remainingNodes: SimplifiedNode[] = [];

  while (processingNodes.length > 0) {
    // 取出当前层级最低的节点
    const parent = processingNodes.shift()!;

    if (!canBeParent(parent) || !parent.absRect) {
      remainingNodes.push(parent);
      continue;
    }

    // 尝试在剩余的节点 (层级比它高的，即浮在它上面的) 中寻找孩子
    const nonChildren: SimplifiedNode[] = [];
    for (const potentialChild of processingNodes) {
      if (!potentialChild.absRect) {
        nonChildren.push(potentialChild);
        continue;
      }
      // FULLY_CONTAIN：A 完全包含 B，直接建立父子关系
      if (isRectContained(parent.absRect, potentialChild.absRect) &&
        getRectArea(parent.absRect) >= getRectArea(potentialChild.absRect)) {
        adoptAsAbsoluteChild(parent, potentialChild);
      } else if (canBeParent(parent)) {
        // Partly_CONTAIN：B 主要区域落在 A 内部，也建立父子关系
        const overlapRatio = getOverlapRatio(parent.absRect, potentialChild.absRect);
        if (
          overlapRatio >= partlyContainThreshold &&
          getRectArea(parent.absRect) >= getRectArea(potentialChild.absRect)
        ) {
          adoptAsAbsoluteChild(parent, potentialChild);
        } else {
          nonChildren.push(potentialChild);
        }
      } else {
        nonChildren.push(potentialChild);
      }
    }

    processingNodes.length = 0;
    processingNodes.push(...nonChildren);

    remainingNodes.push(parent);
  }
  detectAbsoluteChildrenInList(remainingNodes, parent,reparenting.absoluteOverlapThreshold);

  return remainingNodes;
}

// AABB 碰撞检测，用于选出绝对定位的节点
function detectAbsoluteChildrenInList(nodes: SimplifiedNode[], parent?: SimplifiedNode, threshold?:number) {
  if (nodes.length < 2) return;

  // Align with FigmaToCode: If parent is Auto Layout, respect native layout.
  if (parent && typeof parent.layout === "object" && parent.layout && parent.layout.mode !== "none") {
    return;
  }

  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    if (!nodeA.absRect) continue;

    for (let j = i + 1; j < nodes.length; j++) {
      const nodeB = nodes[j];
      if (!nodeB.absRect) continue;

      // 是否相交
      if (!areRectsTouching(nodeA.absRect, nodeB.absRect, threshold)) continue;

      // 确定是相交关系
      if (getRectArea(nodeA.absRect) < getRectArea(nodeB.absRect)) {
        nodeA.layout = {
          mode: "none",
          ...(typeof nodeA.layout === "object" && nodeA.layout ? nodeA.layout : {}),
          position: "absolute",
        };
        // 补充坐标计算
        if (parent?.absRect && nodeA.absRect) {
          const resolvedLayout = nodeA.layout as SimplifiedLayout;
          resolvedLayout.locationRelativeToParent =  
            calculateRelativePosition(nodeA.absRect, parent.absRect);
        }
      } else {
        nodeB.layout = {
          mode: "none",
          ...(typeof nodeB.layout === "object" && nodeB.layout ? nodeB.layout : {}),
          position: "absolute",
        };
        // 补充坐标计算
        if (parent?.absRect && nodeB.absRect) {
          const resolvedLayout = nodeB.layout as SimplifiedLayout;
          resolvedLayout.locationRelativeToParent = 
            calculateRelativePosition(nodeB.absRect, parent.absRect);
        }
      }
    }
  }
}

// 将 child 追加进 parent.children，并把 child 转成相对 parent 的绝对定位
function adoptAsAbsoluteChild(parent: SimplifiedNode, child: SimplifiedNode) {
  if (!parent.absRect || !child.absRect) return;
  if (!parent.children) parent.children = [];
  parent.children.push(child);
  parent.layout = {
    ...(typeof parent.layout === "object" && parent.layout ? parent.layout : { mode: "none" }),
    position: "relative",
  };
  child.layout = {
    ...(typeof child.layout === "object" && child.layout ? child.layout : { mode: "none" }),
    position: "absolute",
    parentMode: "none",
    locationRelativeToParent: 
      calculateRelativePosition(child.absRect, parent.absRect),
  };
}

// 返回 b 的面积中有多少比例与 a 发生重叠（intersectionArea / bArea）
function getOverlapRatio(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): number {
  const ix1 = Math.max(a.x, b.x);
  const iy1 = Math.max(a.y, b.y);
  const ix2 = Math.min(a.x + a.width, b.x + b.width);
  const iy2 = Math.min(a.y + a.height, b.y + b.height);
  const iw = ix2 - ix1;
  const ih = iy2 - iy1;
  if (iw <= 0 || ih <= 0) return 0;
  const intersectionArea = iw * ih;
  const bArea = b.width * b.height;
  if (bArea <= 0) return 0;
  return intersectionArea / bArea;
}
