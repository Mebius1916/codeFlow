import type { SimplifiedDesign } from "../../../types/extractor-types.js";

type ImageMap = Record<string, string>;

export function buildPlaceholderImageMap(
  nodes: SimplifiedDesign["nodes"],
  imageAssets: NonNullable<SimplifiedDesign["globalVars"]["imageAssets"]>,
): ImageMap {
  const DEFAULT_SIZE = 100;
  const nodeIds = imageAssets.nodeIds || [];
  const imageRefs = imageAssets.imageRefs || [];
  const svgNodeIds = imageAssets.svgNodeIds || [];

  const wantedNodeIds = new Set<string>();
  nodeIds.forEach((id) => wantedNodeIds.add(id));
  svgNodeIds.forEach((id) => wantedNodeIds.add(id));

  const imageMap: ImageMap = {};
  const stack = nodes.slice();
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;

    if (wantedNodeIds.has(node.id)) {
      const w = Math.round(node.absRect?.width ?? DEFAULT_SIZE) || DEFAULT_SIZE;
      const h = Math.round(node.absRect?.height ?? DEFAULT_SIZE) || DEFAULT_SIZE;
      imageMap[node.id] = `https://placehold.co/${w}x${h}`;
    }

    if (node.children && node.children.length > 0) {
      stack.push(...node.children);
    }
  }

  wantedNodeIds.forEach((id) => {
    if (!imageMap[id]) imageMap[id] = `https://placehold.co/${DEFAULT_SIZE}x${DEFAULT_SIZE}`;
  });

  imageRefs.forEach((ref) => {
    imageMap[ref] = `https://placehold.co/${DEFAULT_SIZE}x${DEFAULT_SIZE}`;
  });

  return imageMap;
}

