import { runReconstructionPipeline } from "./reconstruction.js";
import type {
  TraversalContext,
  SimplifiedNode,
} from "../../types/extractor-types.js";
import type { ReconstructionStepFlags } from "./reconstruction.js";
import { processNodes } from "./utils/core-process.js";
import { flattenRedundantNodes } from "../algorithms/flattening.js";
import { normalizeNodeStyles } from "../algorithms/style-normalization.js";

/**
 * Traverse the Figma node tree and extract simplified nodes.
 *
 * This function orchestrates the traversal and delegates specific extraction
 * logic to the `processNodes` function.
 */
export function extractFromDesign(
  nodes: any[], // Raw Figma nodes
  globalVars: TraversalContext["globalVars"] = { styles: {} },
  options?: { reconstruction?: { enabled?: ReconstructionStepFlags } },
): { nodes: SimplifiedNode[]; globalVars: TraversalContext["globalVars"] } {

  const context: TraversalContext = {
    currentDepth: 0,
    parent: undefined,
    globalVars,
  };

  // 1. Extraction Phase (with Injected Structure Pass)
  let rootNodes = processNodes(nodes, context, (children) =>
    runReconstructionPipeline(children, globalVars, options?.reconstruction),
  );

  rootNodes = flattenRedundantNodes(rootNodes);
  rootNodes = normalizeNodeStyles(rootNodes, globalVars);

  // 剪枝操作，减少内存占用
  if (globalVars.extraStyles) {
    delete globalVars.extraStyles;
  }

  return {
    nodes: rootNodes,
    globalVars,
  };
}
