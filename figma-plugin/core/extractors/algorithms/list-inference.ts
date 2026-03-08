/**
 * 该算法暂时不启用
 * 
 * 通过计算好的 hash 指纹来判断是否是同类型元素，
 * 如果是同类型元素则将其合并为一个虚拟列表节点
 */
import type { SimplifiedNode } from "../../types/extractor-types.js";
import { generateVisualSignature } from "./utils/fingerprint.js";
import { groupRepeatedPatterns } from "./utils/list-pattern.js";

export function inferListPatterns(nodes: SimplifiedNode[]): SimplifiedNode[] {
  nodes.forEach((node) => {
    if (!node.visualSignature) {
      node.visualSignature = generateVisualSignature(node);
    }
  });

  if (nodes.length <= 1) return nodes;

  return groupRepeatedPatterns(nodes);
}
