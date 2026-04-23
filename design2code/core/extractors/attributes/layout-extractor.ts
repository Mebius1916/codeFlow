import type { ExtractorFn, SimplifiedNode } from "../../types/extractor-types.js";
import { buildSimplifiedLayout } from "../../transformers/layout.js";
import { isLayout, isRectangle } from "../../utils/identity.js";

/**
 * Extracts layout-related properties from a node.
 */
export const layoutExtractor: ExtractorFn = (node, context) => {
  const result: Partial<SimplifiedNode> = {};

  // 1. Extract CSS Layout styles
  if (!context.smartNode) {
    return result;
  }
  
  const layout = buildSimplifiedLayout(context.smartNode);

  if (context.smartNode.isIcon()) {
    if (layout.mode !== "none") {
      layout.mode = "none";
      layout.wrap = undefined;
      layout.gap = undefined;
      layout.alignContent = undefined;
      layout.justifyContent = undefined;
      layout.alignItems = undefined;
      layout.padding = undefined;
    }
  }

  if (Object.keys(layout).length > 1) {
    result.layout = layout;
  }

  // 3. Extract Absolute Geometry for internal algorithms (Occlusion, Clustering)
  if (isLayout(node)) {
    const box = node.absoluteBoundingBox;
    if (box) {
      result.absRect = {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
    }
  } else if (isRectangle("absoluteRenderBounds", node)) {
    // Fallback to render bounds (e.g. for Groups or weird Vectors)
    const box = node.absoluteRenderBounds;
    if (box) {
      result.absRect = {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
    }
  }

  return result;
};
