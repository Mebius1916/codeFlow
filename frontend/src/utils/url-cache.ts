import { LruTtlCache, type ResourceContent } from './lru-cache'

const imageCache = new LruTtlCache<ResourceContent>({
  maxEntries: 50,
  ttlMs: 24 * 60 * 60 * 1000,
  storeName: 'image-cache',
})
const imageContentTypeCache = new LruTtlCache<string>({
  maxEntries: 50,
  ttlMs: 24 * 60 * 60 * 1000,
  storeName: 'image-content-type-cache',
})
export type PreviewContentSize = { width: number; height: number }
const previewSizeCache = new LruTtlCache<PreviewContentSize>({
  maxEntries: 50,
  ttlMs: 24 * 60 * 60 * 1000,
  storeName: 'preview-size-cache',
})


export async function getCachedContentByUrl(url: string) {
  return imageCache.get(url)
}

export async function getCachedContentTypeByUrl(url: string) {
  return imageContentTypeCache.get(url)
}

export function setCachedContentByUrl(url: string, content: ResourceContent, contentType: string) {
  imageCache.set(url, content)
  imageContentTypeCache.set(url, contentType)
}

export async function getCachedPreviewSize(roomId: string) {
  return previewSizeCache.get(roomId)
}

export function setCachedPreviewSize(roomId: string, size: PreviewContentSize) {
  previewSizeCache.set(roomId, size)
}
