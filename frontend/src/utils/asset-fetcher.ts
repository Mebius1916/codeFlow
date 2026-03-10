import { buildAssetPathFromContentType } from './asset-path'
import { setSessionPathUrl } from './path-map'
import { getCachedContentByUrl, getCachedContentTypeByUrl, setCachedContentByUrl } from './url-cache'
import type { ResourceContent } from './lru-cache'

export interface ImageFetchResult {
  path: string
  content: ResourceContent
}

export const frontendFetcher = {
  image: async (url: string, key: string, headers?: Record<string, string>) => {
    const { path } = await requestImageWithCache(url, key, headers)
    return path
  },
}

async function requestImageWithCache(
  url: string,
  key: string,
  headers: Record<string, string> = {},
): Promise<ImageFetchResult> {
  const cached = await getCachedContentByUrl(url)
  if (cached !== undefined) {
    const cachedType = (await getCachedContentTypeByUrl(url)) || 'image/png'
    const { relativePath } = buildAssetPathFromContentType(key, cachedType)
    setSessionPathUrl(relativePath, url)
    return { path: relativePath, content: cached }
  }

  const resp = await fetch(url, { headers })
  if (!resp.ok) {
    throw new Error(`Failed to fetch image: ${resp.status} ${resp.statusText}`)
  }

  const contentType = resp.headers.get('content-type') || ''
  const content = await readResponseContent(resp)

  setCachedContentByUrl(url, content, contentType)

  const { relativePath } = buildAssetPathFromContentType(key, contentType)
  setSessionPathUrl(relativePath, url)

  return { path: relativePath, content }
}

async function readResponseContent(resp: Response): Promise<ResourceContent> {
  const contentType = resp.headers.get('content-type') || ''
  if (contentType.includes('svg')) {
    return resp.text()
  }
  const blob = await resp.blob()
  const buffer = await blob.arrayBuffer()
  return new Uint8Array(buffer)
}
