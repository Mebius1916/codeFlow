import type { SimplifiedDesign } from "../../types/extractor-types.js";
import { fetchNodeRenderUrls, fetchImageFillUrls } from "./utils/fetch-urls.js";
import { applyImageMapToStyles, applyImageMapToNodes } from "./utils/apply-to-nodes.js";
import type { FetcherAdapter } from "./design-extractor.js";

type ImageResolveOptions = {
  fileKey: string;
  token: string;
  format?: "png" | "jpg" | "svg" | "pdf";
  scale?: number;
  fetcher?: FetcherAdapter;
};

type ImageMap = Record<string, string>;
type AssetMaps = { imageMap: ImageMap };

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
  const { imageMap } = await buildAssetMaps(imageAssets, options);
  return resolveImageAssets(design, imageMap);
}

// 构建资源映射表
async function buildAssetMaps(
  imageAssets: NonNullable<SimplifiedDesign["globalVars"]["imageAssets"]>,
  options: ImageResolveOptions,
): Promise<AssetMaps> {
  const nodeIds = imageAssets.nodeIds || [];
  const imageRefs = imageAssets.imageRefs || [];
  const svgNodeIds = imageAssets.svgNodeIds || [];

  const { cachedMap: cachedNodeMap, remaining: remainingNodeIds } = await splitByCache(nodeIds, options.fetcher?.resolveCache);
  const { cachedMap: cachedRefMap, remaining: remainingImageRefs } = await splitByCache(imageRefs, options.fetcher?.resolveCache);
  const { cachedMap: cachedSvgMap, remaining: remainingSvgNodeIds } = await splitByCache(svgNodeIds, options.fetcher?.resolveCache);

  const imageFillUrls =
    remainingImageRefs.length > 0 ? await fetchImageFillUrls(options.fileKey, options.token, remainingImageRefs) : {};
  const nodeImageMap =
    remainingNodeIds.length > 0 ? await fetchNodeRenderUrls(remainingNodeIds, options) : {};
  const svgUrlMap =
    remainingSvgNodeIds.length > 0 ? await fetchNodeRenderUrls(remainingSvgNodeIds, { ...options, format: "svg" }) : {};

  let remoteMap = { ...nodeImageMap, ...imageFillUrls, ...svgUrlMap };
  if (options.fetcher?.image) {
    remoteMap = await fetchImagesThroughAdapter(remoteMap, options.fetcher.image);
  }

  const imageMap = { ...cachedNodeMap, ...cachedRefMap, ...cachedSvgMap, ...remoteMap };
  return { imageMap };
}

async function fetchImagesThroughAdapter(
  imageMap: ImageMap,
  fetchImage: NonNullable<FetcherAdapter["image"]>
): Promise<ImageMap> {
  const newMap: ImageMap = {};
  const entries = Object.entries(imageMap);

  const CHUNK_SIZE = 10;
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async ([key, url]) => {
        if (!url) return;
        try {
          const result = await fetchImage(url, key);
          newMap[key] = result;
        } catch (error) {
          console.error(`Failed to fetch image ${key} through adapter:`, error);
          newMap[key] = url;
        }
      }),
    );
  }
  return newMap;
}

async function splitByCache(
  keys: string[],
  resolveCache?: NonNullable<FetcherAdapter["resolveCache"]>,
): Promise<{ cachedMap: ImageMap; remaining: string[] }> {
  if (!resolveCache || keys.length === 0) {
    return { cachedMap: {}, remaining: keys };
  }
  const results = await Promise.all(
    keys.map(async (key) => {
      const cached = await resolveCache(key);
      return { key, cached };
    }),
  );
  const cachedMap: ImageMap = {};
  const remaining: string[] = [];
  results.forEach(({ key, cached }) => {
    if (cached) {
      cachedMap[key] = cached;
    } else {
      remaining.push(key);
    }
  });
  return { cachedMap, remaining };
}

// 回填 图片/svg 映射表到设计中
function resolveImageAssets(
  design: SimplifiedDesign,
  imageMap?: ImageMap,
): SimplifiedDesign {
  if (!imageMap) return design;
  applyImageMapToStyles(design.globalVars.styles, imageMap);
  applyImageMapToNodes(design.nodes, imageMap);
  return design;
}
