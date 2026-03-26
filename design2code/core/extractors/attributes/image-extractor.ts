import type { ExtractorFn } from "../../types/extractor-types.js";
import { hasValue } from "../../utils/identity.js";

export const imageExtractor: ExtractorFn = (node, context) => {
  const imageAssets = context.globalVars.imageAssets || { nodeIds: [], imageRefs: [], svgNodeIds: [] };
  const ids = imageAssets.nodeIds;
  const imageRefs = imageAssets.imageRefs;
  const svgNodeIds = imageAssets.svgNodeIds || [];
  imageAssets.svgNodeIds = svgNodeIds;

  // Use smartNode for identification if available
  const isImage = context.smartNode?.isImage();
  const isSvg = context.smartNode?.isIcon();

  if (isImage || isSvg) {
    if (isImage) pushUnique(ids, node.id);
    if (isSvg) pushUnique(svgNodeIds, node.id);
    context.globalVars.imageAssets = imageAssets;
    return {};
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
