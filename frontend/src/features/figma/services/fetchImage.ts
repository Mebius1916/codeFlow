import { buildAssetPathFromContentType } from '../utils/assetPath'
import { setSessionAssetPath } from '@/features/figma/utils/assetsMap'
import { getCachedResourceByAssetPath, setCachedResourceByAssetPath, type ResourceContent } from '../utils/imageCache'

export interface ImageFetchResult {
  path: string
  content: ResourceContent
}

export function createFrontendFetcher(ctx: { fileKey: string }) {
  return {
    image: async (url: string, key: string, headers?: Record<string, string>) => {
      const { path } = await requestImageWithCache({ url, assetKey: key, fileKey: ctx.fileKey, headers })
      return path
    },
    resolveCache: async (key: string) => {
      const pngPath = `assets/${key}.png`
      const pngSnapshot = await getCachedResourceByAssetPath(pngPath)
      if (pngSnapshot) {
        setSessionAssetPath(pngPath)
        return pngPath
      }

      const svgPath = `assets/${key}.svg`
      const svgSnapshot = await getCachedResourceByAssetPath(svgPath)
      if (svgSnapshot) {
        setSessionAssetPath(svgPath)
        return svgPath
      }
      return undefined
    },
  }
}

async function requestImageWithCache(args: {
  url: string
  assetKey: string
  fileKey: string
  headers?: Record<string, string>
}): Promise<ImageFetchResult> {
  const pngPath = `assets/${args.assetKey}.png`
  const pngSnapshot = await getCachedResourceByAssetPath(pngPath)
  if (pngSnapshot) {
    setSessionAssetPath(pngPath)
    return { path: pngPath, content: pngSnapshot.content }
  }

  const svgPath = `assets/${args.assetKey}.svg`
  const svgSnapshot = await getCachedResourceByAssetPath(svgPath)
  if (svgSnapshot) {
    setSessionAssetPath(svgPath)
    return { path: svgPath, content: svgSnapshot.content }
  }

  const resp = await fetch(args.url, { headers: args.headers || {} })
  if (!resp.ok) {
    throw new Error(`Failed to fetch image: ${resp.status} ${resp.statusText}`)
  }

  const contentType = resp.headers.get('content-type') || ''
  const content = await readResponseContent(resp)

  const { relativePath } = buildAssetPathFromContentType(args.assetKey, contentType)
  await setCachedResourceByAssetPath(relativePath, { content, contentType })
  setSessionAssetPath(relativePath)

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
