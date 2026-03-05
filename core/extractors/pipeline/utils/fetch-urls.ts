
import { requestJsonWithFigmaToken, requestTextWithCache } from "./request-cache.js";
type ImageMap = Record<string, string>;
type SvgMap = Record<string, string>;
type RawImageMap = Record<string, string | null | undefined>;
type ImageResolveOptions = {
  fileKey: string;
  token: string;
  format?: "png" | "jpg" | "svg" | "pdf";
  scale?: number;
};

const DEFAULT_PNG_FORMAT: NonNullable<ImageResolveOptions["format"]> = "png";
const MAX_IDS_PER_REQUEST = 100;

// 从 Figma API 中获取节点渲染图片/svg
export async function fetchNodeRenderUrls(nodeIds: string[], options: ImageResolveOptions): Promise<ImageMap> {
  if (nodeIds.length === 0) return {};
  const { fileKey, token, format = DEFAULT_PNG_FORMAT, scale } = options;
  const chunks = chunkIds([...nodeIds].sort(), MAX_IDS_PER_REQUEST);
  const images: ImageMap = {};
  for (const chunk of chunks) {
    const params = new URLSearchParams({ ids: chunk.join(","), format });
    if (format !== "svg" && scale && Number.isFinite(scale)) params.set("scale", String(scale));
    
    // SVG 强制裁剪到节点边界 (去除阴影/外发光带来的额外空白)
    if (format === "svg") {
      params.set("use_absolute_bounds", "true");
    }

    const url = `https://api.figma.com/v1/images/${fileKey}?${params.toString()}`;
    const data = await requestJsonWithFigmaToken<{ images?: RawImageMap }>(url, token);
    if (!data?.images) continue;
    Object.entries(data.images).forEach(([key, value]) => {
      if (value) images[key] = value;
    });
  }
  return images;
}

// 从 Figma API 中获取图片填充资源
export async function fetchImageFillUrls(
  fileKey: string,
  token: string,
  imageRefs: string[],
): Promise<Record<string, string>> {
  const url = `https://api.figma.com/v1/files/${fileKey}/images`;
  const data = await requestJsonWithFigmaToken<{ meta?: { images?: RawImageMap } }>(url, token);
  const images = data?.meta?.images;
  if (!images || imageRefs.length === 0) return {};
  const result: ImageMap = {};
  imageRefs.forEach((key) => {
    const value = images[key];
    if (value) result[key] = value;
  });
  return result;
}

// 从 Figma API 中获取 SVG 标记
export async function fetchSvgMarkup(svgUrlMap: ImageMap): Promise<SvgMap> {
  const entries = Object.entries(svgUrlMap);
  if (entries.length === 0) return {};
  const results: SvgMap = {};
  for (const [nodeId, url] of entries) {
    if (!url) continue;
    const svgText = await requestTextWithCache(url);
    if (svgText) results[nodeId] = svgText;
  }
  return results;
}

// 图片分块，100张为一组
function chunkIds(ids: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
}
