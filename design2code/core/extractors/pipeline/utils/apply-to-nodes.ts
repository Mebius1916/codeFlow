import type { SimplifiedDesign } from "../../../types/extractor-types.js";
import type { SimplifiedFill, SimplifiedImageFill, SimplifiedPatternFill, SimplifiedStroke } from "../../../types/simplified-types.js";

type ImageMap = Record<string, string>;

// 回填图片映射表到设计中
export function applyImageMapToStyles(styles: Record<string, any>, imageMap?: ImageMap) {
  if (!imageMap) return;
  Object.values(styles).forEach((style) => {
    if (!style) return;
    if (Array.isArray(style)) {
      style.forEach((fill) => applyImageMapToFill(fill, imageMap));
      return;
    }
    if ("colors" in style) {
      const stroke = style as SimplifiedStroke;
      stroke.colors?.forEach((fill) => applyImageMapToFill(fill, imageMap));
    }
  });
}

// 回填svg映射表到节点中
export function applyImageMapToNodes(
  nodes: SimplifiedDesign["nodes"],
  imageMap?: ImageMap,
) {
  nodes.forEach((node) => {
    if (node.type === "IMAGE" && !node.src && imageMap) {
      const mapped = imageMap[node.id];
      if (mapped) node.src = mapped;
    }
    if (node.type === "SVG" && !node.src && imageMap) {
      const mapped = imageMap[node.id];
      if (mapped) node.src = mapped;
    }
    if (node.children && node.children.length > 0) {
      applyImageMapToNodes(node.children, imageMap);
    }
  });
}

// 应用图片映射表到填充中
function applyImageMapToFill(fill: SimplifiedFill, imageMap: ImageMap) {
  if (typeof fill === "string") return;
  if ("type" in fill) {
    if (fill.type === "IMAGE") {
      const imageFill = fill as SimplifiedImageFill;
      const mapped = imageMap[imageFill.imageRef];
      if (mapped) imageFill.imageRef = mapped;
      return;
    }
    if (fill.type === "PATTERN") {
      const patternFill = fill as SimplifiedPatternFill;
      const mapped = imageMap[patternFill.patternSource.nodeId];
      if (mapped) patternFill.patternSource.url = mapped;
    }
  }
}