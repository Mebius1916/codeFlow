import { LruTtlCache, type ResourceContent } from './lru-cache'
import { setSessionPathUrl } from './path-map'

export interface ImageFetchResult {
  path: string;
  content: ResourceContent;
}
export const imageCache = new LruTtlCache<ResourceContent>({ maxEntries: 50, ttlMs: 24 * 60 * 60 * 1000, storeName: 'image-cache' });

export async function getCachedContentByUrl(url: string) {
  return imageCache.get(url);
}

export const frontendFetcher = {
  image: async (url: string, key: string, headers?: Record<string, string>) => {
    const { path } = await requestImageWithCache(url, key, headers);
    return path;
  }
};

async function requestImageWithCache(url: string, key: string, headers: Record<string, string> = {}): Promise<ImageFetchResult> {
  const { relativePath } = buildAssetPath(url, key);

  const cached = await imageCache.get(url);
  
  if (cached !== undefined) {
    // 二级存储
    setSessionPathUrl(relativePath, url);
    return { path: relativePath, content: cached };
  }

  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    throw new Error(`Failed to fetch image: ${resp.status} ${resp.statusText}`);
  }

  // 读取资源内容：svg 存 string；其余图片存 Uint8Array
  const storageValue = await readResponseContent(resp);
  
  imageCache.set(url, storageValue);
  
  setSessionPathUrl(relativePath, url);
  
  return { path: relativePath, content: storageValue };
}

// 生成稳定的相对路径，用于回写到设计结构里
function buildAssetPath(url: string, key: string) {
  const safeFilenameBase = (key: string) => {
    const normalized = key
      .replace(/[^a-zA-Z0-9-_]+/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_+|_+$/g, "");
    return normalized || "asset";
  }
  const inferFileExtFromUrl = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes(".svg")) return "svg";
    if (lowerUrl.includes(".png")) return "png";
    if (lowerUrl.includes(".jpg") || lowerUrl.includes(".jpeg")) return "jpg";
    return "png";
  }
  const safeBase = safeFilenameBase(key);
  const ext = inferFileExtFromUrl(url);
  const filename = `${safeBase}.${ext}`;
  const relativePath = `assets/${filename}`;
  return { relativePath, filename };
}

// 读取资源内容：svg 存 string；其余图片存 Uint8Array
async function readResponseContent(resp: Response): Promise<ResourceContent> {
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('svg')) {
    return resp.text();
  }
  const blob = await resp.blob();
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}
