
import type { SimplifiedNode } from "../../types/extractor-types.js";
import { getOptions } from "../../../options.js";
import { buildContainerByGap } from "./utils/layout-inference.js";
import {
  calculateGlobalAverageSize,
  mergeAdjacentGroupsWithMeta,
  splitByProjection,
  spliteByCost
} from "./utils/group-calculation.js";
export function groupNodesByLayout(nodes: SimplifiedNode[], parent?: SimplifiedNode): SimplifiedNode[] {
  // 排除绝对定位的节点
  const flowNodes: SimplifiedNode[] = [];
  const absoluteNodes: SimplifiedNode[] = [];
  for (const node of nodes) {
    if (typeof node.layout === "object" && node.layout?.position === "absolute") {
      absoluteNodes.push(node);
    } else {
      flowNodes.push(node);
    }
  }

  if (flowNodes.length <= 1) {
    return [...flowNodes, ...absoluteNodes];
  }

  const { layoutGap } = getOptions();
  const minGap = typeof layoutGap.minGap === "number" ? layoutGap.minGap : 2;
  const globalAvgWidth = calculateGlobalAverageSize(flowNodes, "x");
  const globalAvgHeight = calculateGlobalAverageSize(flowNodes, "y");

  // 先全局投影切片
  const spliteY = splitByProjection(flowNodes, "y", minGap);
  const spliteX = splitByProjection(flowNodes, "x", minGap);

  // 后局部相邻合并
  const rowGroupMeta = mergeAdjacentGroupsWithMeta(spliteY, "y", globalAvgHeight);
  const colGroupMeta = mergeAdjacentGroupsWithMeta(spliteX, "x", globalAvgWidth);

  const rowGroups = rowGroupMeta.map(item => item.group);
  const colGroups = colGroupMeta.map(item => item.group);
  
  const bestDirection = spliteByCost(rowGroups, colGroups);

  // 根据决策结果处理
  if (bestDirection === "row") {
    const processedRows = rowGroupMeta.map((meta) => buildGroup(meta.group, "row", parent));
    return [...processedRows, ...absoluteNodes];
  } else if (bestDirection === "column") {
    const processedCols = colGroupMeta.map((meta) => buildGroup(meta.group, "column", parent));
    return [...processedCols, ...absoluteNodes];
  }

  return [...flowNodes, ...absoluteNodes];
}

function buildGroup(group: SimplifiedNode[], direction: "row" | "column", parent?: SimplifiedNode): SimplifiedNode {
  return buildContainerByGap({
    name: "Group",
    idPrefix: "virtual-layout-grouping",
    children: group,
    direction,
    allowSingle: true,
    parent,
  });
}
