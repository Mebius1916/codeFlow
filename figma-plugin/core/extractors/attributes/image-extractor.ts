import type { ExtractorFn } from "../../types/extractor-types.js";
import { hasValue } from "../../utils/identity.js";

export const imageExtractor: ExtractorFn = (node, context) => {
  const imageAssets = context.globalVars.imageAssets || { nodeIds: [], imageRefs: [], svgNodeIds: [] };
  const ids = imageAssets.nodeIds;
  const imageRefs = imageAssets.imageRefs;
  const svgNodeIds = imageAssets.svgNodeIds || [];
  imageAssets.svgNodeIds = svgNodeIds;

  // Use features from analysis if available
  const isImage = context.features?.looksLikeImage;
  const isSvg = context.features?.looksLikeIcon;

  if (isImage) {
    pushUnique(ids, node.id);
  }
  if (isSvg) {
    pushUnique(svgNodeIds, node.id);
  }

  if (hasValue("fills", node) && Array.isArray(node.fills) && node.fills.length) {
    node.fills.forEach((fill: any) => {
      if (fill?.type === "PATTERN" && fill.sourceNodeId) {
        pushUnique(ids, fill.sourceNodeId);
        return;
      }
      if (fill?.type === "IMAGE") {
        if (fill.imageRef) pushUnique(imageRefs, fill.imageRef);
        if (fill.gifRef) pushUnique(imageRefs, fill.gifRef);
      }
    });
  }

  context.globalVars.imageAssets = imageAssets;
  return {};
};

function pushUnique(list: string[], id: string) {
  if (!list.includes(id)) list.push(id);
}
