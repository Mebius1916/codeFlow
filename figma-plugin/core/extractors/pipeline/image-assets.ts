import { downloadFigmaImage } from "../../utils/network-utils.js";
import { join } from "path";
import type { SimplifiedDesign } from "../../types/extractor-types.js";
import { fetchNodeRenderUrls, fetchImageFillUrls, fetchSvgMarkup } from "./utils/fetch-urls.js";
import { applyImageMapToStyles, applyImageMapToNodes } from "./utils/apply-to-nodes.js";

type ImageResolveOptions = {
  fileKey: string;
  token: string;
  format?: "png" | "jpg" | "svg" | "pdf";
  scale?: number;
  assetsDir?: string;
  assetsUrlPrefix?: string;
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

  let imageMap: ImageMap = { ...nodeImageMap, ...imageFillUrls };
  if (options.assetsDir) {
    imageMap = await downloadImagesToAssets(imageMap, options.assetsDir, options.assetsUrlPrefix);
  }

  const svgMap = await fetchSvgMarkup(
    await fetchNodeRenderUrls(svgNodeIds, { ...options, format: "svg" }),
  );
  return { imageMap, svgMap };
}

async function downloadImagesToAssets(
  imageMap: ImageMap,
  assetsDir: string,
  assetsUrlPrefix: string = ""
): Promise<ImageMap> {
  const newMap: ImageMap = {};
  const entries = Object.entries(imageMap);

  // Process in chunks
  const CHUNK_SIZE = 10;
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async ([key, url]) => {
        if (!url) return;
        try {
          const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, "_");
          // Determine extension from URL or format
          let ext = "png";
          if (url.includes(".svg")) ext = "svg";
          else if (url.includes(".jpg") || url.includes(".jpeg")) ext = "jpg";
          
          const filename = `${safeKey}.${ext}`;

          await downloadFigmaImage(filename, assetsDir, url);

          // Use POSIX style paths for web compatibility
          const filePath = join(assetsDir, filename).split("\\").join("/");
          
          // 构造本地引用路径：使用传入的 url 前缀（通常是相对路径）
          const localUrl = assetsUrlPrefix
            ? `${assetsUrlPrefix.replace(/\/$/, '')}/${filename}`
            : filePath;

          newMap[key] = localUrl;
        } catch (error) {
          console.error(`Failed to download image ${key}:`, error);
          newMap[key] = url;
        }
      }),
    );
  }
  return newMap;
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

