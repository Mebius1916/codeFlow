import type { SimplifiedDesign } from "../../types/extractor-types.js";
import { fetchNodeRenderUrls, fetchImageFillUrls, fetchSvgMarkup } from "./utils/fetch-urls.js";
import { applyImageMapToStyles, applyImageMapToNodes } from "./utils/apply-to-nodes.js";

type ImageResolveOptions = {
  fileKey: string;
  token: string;
  format?: "png" | "jpg" | "svg" | "pdf";
  scale?: number;
};

type ImageMap = Record<string, string>;
type SvgMap = Record<string, string>;
type AssetMaps = { imageMap: ImageMap; svgMap: SvgMap };

// 从 dsl 中拿到资源的 id 或者 ref 并回填具体 url 到设计中
export async function resolveImageAssetsFromFigma(
  design: SimplifiedDesign,
  options: ImageResolveOptions,
): Promise<SimplifiedDesign> {
  const imageAssets = design.globalVars.imageAssets;
  const hasNodeIds = imageAssets?.nodeIds?.length;
  const hasImageRefs = imageAssets?.imageRefs?.length;
  const hasSvgNodeIds = imageAssets?.svgNodeIds?.length;
  if (!imageAssets || (!hasNodeIds && !hasImageRefs && !hasSvgNodeIds)) {
    return design;
  }
  if (!options.fileKey || !options.token) {
    return design;
  }
  const { imageMap, svgMap } = await buildAssetMaps(imageAssets, options);
  return resolveImageAssets(design, imageMap, svgMap);
}

// 构建资源映射表
async function buildAssetMaps(
  imageAssets: NonNullable<SimplifiedDesign["globalVars"]["imageAssets"]>,
  options: ImageResolveOptions,
): Promise<AssetMaps> {
  const nodeIds = imageAssets.nodeIds || [];
  const imageRefs = imageAssets.imageRefs || [];
  const svgNodeIds = imageAssets.svgNodeIds || [];
  const imageFillUrls =
    imageRefs.length > 0 ? await fetchImageFillUrls(options.fileKey, options.token, imageRefs) : {};
  const nodeImageMap = await fetchNodeRenderUrls(nodeIds, options);
  const svgMap = await fetchSvgMarkup(
    await fetchNodeRenderUrls(svgNodeIds, { ...options, format: "svg" }),
  );
  return { imageMap: { ...nodeImageMap, ...imageFillUrls }, svgMap };
}

// 回填 图片/svg 映射表到设计中
function resolveImageAssets(
  design: SimplifiedDesign,
  imageMap?: ImageMap,
  svgMap?: SvgMap
): SimplifiedDesign {
  if (!imageMap && !svgMap) return design;
  applyImageMapToStyles(design.globalVars.styles, imageMap);
  applyImageMapToNodes(design.nodes, imageMap, svgMap);
  return design;
}

