import type { SimplifiedNode } from "../../types/extractor-types.js";
import { mergeNodeIntoOnlyChildRecursively } from "./utils/merge-node.js";
/**
 * Flattens redundant nested groups/frames that don't contribute to layout or style.
 */
export function flattenRedundantNodes(
  nodes: SimplifiedNode[],
): SimplifiedNode[] {
  return nodes.map((node) => {
    if (node.children && node.children.length > 0) {
      node.children = flattenRedundantNodes(node.children);
    }

    return mergeNodeIntoOnlyChildRecursively(node);
  });
}
