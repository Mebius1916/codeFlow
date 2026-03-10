import type { Node as FigmaDocumentNode } from "@figma/rest-api-spec";
import { hasValue } from "../../../utils/identity.js";
import { normalizeNodeType } from "../../algorithms/node-normalization.js";
import { analyzeNode } from "../../analysis/analyze.js";
import { allExtractors } from "../../attributes/built-in.js";
import { shouldPruneNode } from "../../../utils/node-check.js";
import { isVisible } from "../../../utils/common.js";
import { SmartNode } from "../../analysis/index.js";

import type {
  TraversalContext,
  SimplifiedNode,
} from "../../../types/extractor-types.js";

export function processNodes(
  nodes: FigmaDocumentNode[],
  context: TraversalContext,
  postProcessor?: (nodes: SimplifiedNode[], parent?: SimplifiedNode) => SimplifiedNode[]
): SimplifiedNode[] {
  const results: SimplifiedNode[] = [];

  for (const node of nodes) {
    // 0. Pruning Phase (Early Exit for Empty/Invisible Nodes)
    if (!isVisible(node)) {
      continue;
    }

    // 1. Analyze Features
    const features = analyzeNode(node, context.parent);
    
    // 2. Wrap in Smart Node
    const smartNode = new SmartNode(node, features, context.smartNode);

    // 3. Classify (Normalize)
    const { type: normalizedType, isLeaf } = normalizeNodeType(smartNode);

    if (!context.globalVars.layoutMetaById) context.globalVars.layoutMetaById = {};
    context.globalVars.layoutMetaById[node.id] = {
      layoutAlignSelf: smartNode.getLayoutAlignSelf(),
      layoutSizing: smartNode.getLayoutSizing(),
      layoutGrow: smartNode.getLayoutGrow(),
      layoutMode: smartNode.getRawLayoutMode() as any,
      layoutPositioning: (node as any).layoutPositioning,
    };

    // 4. Update Context with Smart Node
    const nodeContext: TraversalContext = {
      ...context,
      smartNode,
    };

    // 5. Apply Extractors (Function Composition)
    const extractedProps = allExtractors.reduce((acc, extractor) => {
      const partial = extractor(node, nodeContext);
      return { ...acc, ...partial };
    }, {} as Partial<SimplifiedNode>);

    // 6. Initialize Simplified Node
    const result: SimplifiedNode = {
      id: node.id,
      name: node.name,
      type: normalizedType as SimplifiedNode["type"],
      ...extractedProps,
    };

    // 7. Traverse Children (Recursive Step)
    if (!isLeaf) {
      const childContext: TraversalContext = {
        ...context,
        currentDepth: context.currentDepth + 1,
        parent: node,
        smartNode,
      };

      if (hasValue("children", node) && node.children.length > 0) {
        const children = processNodes(node.children, childContext, postProcessor);
        // 5. Post-Process Children (Optional)
        const processedChildren = postProcessor ? postProcessor(children, result) : children;
        
        const prunedChildren = processedChildren.filter((child) => {
          if (child.type === "CONTAINER") {
            return !shouldPruneNode(child); // 剪枝：移除空容器
          }
          return true;
        });

        if (prunedChildren.length > 0) {
          result.children = prunedChildren;
        }
      }
    }

    // 7. Early Pruning (Aggressive Pruning)
    if (result.type === "CONTAINER") {
      if (shouldPruneNode(result)) { // 剪枝：移除空容器
        continue;
      }
    }

    results.push(result);
  }

  return results;
}
