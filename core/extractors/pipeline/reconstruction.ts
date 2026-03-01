import { removeOccludedNodes } from "../algorithms/occlusion.js";
import { mergeSpatialIcons } from "../algorithms/spatial-merging.js";
import { reparentNodes } from "../algorithms/reparenting.js";
import { groupNodesByLayout } from "../algorithms/layout-grouping.js";
import { inferListPatterns } from "../algorithms/list-inference.js";
import { groupNodesByAdjacency } from "../algorithms/adjacency-clustering.js";
import { inferSemanticTags } from "../algorithms/semantic-inference.js";
import type { SimplifiedNode, TraversalContext } from "../../types/extractor-types.js";

export type ReconstructionStageName =
  | "occlusion"
  | "spatial_merge"
  | "reparenting"
  | "layout_grouping"
  | "list_inference"
  | "adjacency"
  | "semantic"
  | "flattening";

export type ReconstructionStepFlags = Partial<Record<ReconstructionStageName, boolean>>;

/**
 * Structure + Layout Pipeline
 */
export function runReconstructionPipeline(
  nodes: SimplifiedNode[],
  globalVars?: TraversalContext["globalVars"],
  options?: { enabled?: ReconstructionStepFlags },
  parent?: SimplifiedNode
): SimplifiedNode[] {
  if (nodes.length === 0) return [];

  // 1. Occlusion Culling
  let processedNodes = isStepEnabled(options?.enabled, "occlusion")
    ? removeOccludedNodes(nodes, globalVars)
    : nodes;

  // 2. Spatial Merging
  // 小图标合并算法不太稳定可用，所以暂时移除
  // if (isStepEnabled(options?.enabled, "spatial_merge")) {
  //   processedNodes = mergeSpatialIcons(processedNodes, parent);
  // }

  // 3. Reparenting 
  if (isStepEnabled(options?.enabled, "reparenting")) {
    processedNodes = reparentNodes(processedNodes, parent);
  }

  // 4. Layout Grouping 
  if (isStepEnabled(options?.enabled, "layout_grouping")) {
    processedNodes = groupNodesByLayout(processedNodes);
  }

  // 5. List Inference
  if (isStepEnabled(options?.enabled, "list_inference")) {
    processedNodes = inferListPatterns(processedNodes);
  }

  // 6. Adjacency Clustering
  if (isStepEnabled(options?.enabled, "adjacency")) {
    processedNodes = groupNodesByAdjacency(processedNodes);
  }

  // 7. Semantic Inference
  if (isStepEnabled(options?.enabled, "semantic")) {
    processedNodes = inferSemanticTags(processedNodes);
  }

  return processedNodes;
}

function isStepEnabled(
  enabled: ReconstructionStepFlags | undefined,
  step: ReconstructionStageName
): boolean {
  if (!enabled) return true;
  return enabled[step] !== false;
}
