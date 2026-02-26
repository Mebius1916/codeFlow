import type { SimplifiedNode } from "../../types/extractor-types.js";
import type { BoundingBox } from "../../types/simplified-types.js";
import { createVirtualFrame } from "./utils/virtual-node.js";
import { areRectsTouching } from "../../utils/geometry.js";
import { UnionFind } from "./utils/union-find.js";
import { isMergeCandidate } from "../../utils/candidate-check.js";
import { getOptions } from "../../../options.js";

export function mergeSpatialIcons(nodes: SimplifiedNode[]): SimplifiedNode[] {
  if (nodes.length < 2) return nodes;
  const { spatialMerging } = getOptions();

  const candidates: { index: number; rect: BoundingBox; node: SimplifiedNode }[] = [];
  const nonCandidates: { index: number; node: SimplifiedNode }[] = [];

  // 1. Filter candidates
  nodes.forEach((node, i) => {
    if (isMergeCandidate(node, spatialMerging.threshold)) {
      candidates.push({ index: i, rect: node.absRect!, node });
    } else {
      nonCandidates.push({ index: i, node });
    }
  });

  if (candidates.length < 2) return nodes;

  // 2. Clustering using Union-Find
  const uf = new UnionFind(candidates.length);
  const dynamicDistance = computeAverageNeighborGap(candidates, spatialMerging.distance);

  // 并查集将符合条件的碎片合并到一个集合中
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      if (areRectsTouching(candidates[i].rect, candidates[j].rect, dynamicDistance)) {
        uf.union(i, j);
      }
    }
  }

  // 3. Group by cluster
  const groupIndices = uf.getGroups();
  const clusters = new Map<number, typeof candidates>();

  // 并查集存储的是 id，所以这里需要根据 id 找到对应的碎片
  for (const [root, indices] of groupIndices) {
    const parts = indices.map(idx => candidates[idx]);
    clusters.set(root, parts);
  }

  // 4. 恢复节点列表原始排序（不合法节点保持原位置）
  const finalNodes = [...nonCandidates.map(nc => ({ node: nc.node, sortIdx: nc.index }))];
  
  for (const [_, clusterParts] of clusters) {
    if (clusterParts.length > 1) {
      // 小图标合并后的虚拟节点
      const mergedNode = createMergedIconNode(clusterParts.map(c => c.node));
      // 插入位置选择最早出现的碎片index
      const minIdx = Math.min(...clusterParts.map(c => c.index));
      finalNodes.push({ node: mergedNode, sortIdx: minIdx });
    } else {
      finalNodes.push({ node: clusterParts[0].node, sortIdx: clusterParts[0].index });
    }
  }

  return finalNodes.sort((a, b) => a.sortIdx - b.sortIdx).map(n => n.node);
}

// 计算所有碎片的总包围矩形
function createMergedIconNode(parts: SimplifiedNode[]): SimplifiedNode {
  return createVirtualFrame({
    name: "Merged Icon",
    type: "CONTAINER",
    layout: {
      mode: "none",
      position: "static",
    },
    semanticTag: "icon",
    children: parts,
  });
}

function computeAverageNeighborGap(
  candidates: { index: number; rect: BoundingBox; node: SimplifiedNode }[],
  fallback: number
): number {
  if (candidates.length < 2) return fallback;
  const gaps: number[] = [];
  const rectGap = (a: BoundingBox, b: BoundingBox): number => {
    const dx = Math.max(0, Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width)));
    const dy = Math.max(0, Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height)));
    return Math.max(dx, dy);
  };
  for (let i = 0; i < candidates.length; i++) {
    const rectA = candidates[i].rect;
    let minGap = Infinity;
    for (let j = 0; j < candidates.length; j++) {
      if (i === j) continue;
      const rectB = candidates[j].rect;
      const gap = rectGap(rectA, rectB);
      if (gap < minGap) minGap = gap;
    }
    if (Number.isFinite(minGap)) gaps.push(minGap);
  }
  if (gaps.length === 0) return fallback;
  const sum = gaps.reduce((acc, val) => acc + val, 0);
  const avg = sum / gaps.length;
  return Number.isFinite(avg) ? avg : fallback;
}
