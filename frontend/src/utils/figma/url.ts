import { codegen, extractFigmaAsJSON } from '@collaborative-editor/design2code'
import type { SimplifiedDesign } from '@collaborative-editor/design2code'
import type { GetFileNodesResponse, GetFileResponse } from '@figma/rest-api-spec'
import { createFrontendFetcher } from '../assets/fetch-image'

export type FigmaApiData = GetFileResponse | GetFileNodesResponse

export function parseFigmaUrl(inputUrl: string) {
  const parsed = new URL(inputUrl)

  const pathMatch = parsed.pathname.match(/\/(?:file|design)\/([a-zA-Z0-9]+)/)
  if (!pathMatch) {
    throw new Error('无法从链接中提取 File Key，请检查链接格式')
  }
  const fileKey = pathMatch[1]

  const nodeId = parsed.searchParams.get('node-id')
  if (!nodeId) {
    throw new Error('链接中缺少 node-id 参数，请选中一个 Frame 后再复制链接')
  }

  const encodedNodeId = encodeURIComponent(nodeId.replace(/-/g, ':'))

  return {
    fileKey,
    dataApiUrl: `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodedNodeId}`,
  }
}

export function normalizeFigmaApiJson(raw: unknown): FigmaApiData {
  if (raw && typeof raw === 'object' && 'body' in raw) {
    const body = (raw as { body?: unknown }).body
    if (typeof body === 'string') {
      try {
        return JSON.parse(body) as FigmaApiData
      } catch {
        throw new Error('Figma API 响应 body 解析失败')
      }
    }
    if (body && typeof body === 'object') {
      return body as FigmaApiData
    }
  }
  return raw as FigmaApiData
}

export async function fetchFigmaData(dataApiUrl: string, token: string): Promise<FigmaApiData> {
  const resp = await fetch(dataApiUrl, {
    headers: { 'X-Figma-Token': token || '' },
  })

  if (!resp.ok) {
    throw new Error(`Failed to fetch Figma data: ${resp.status} ${resp.statusText}`)
  }

  const rawJson = (await resp.json()) as unknown
  return normalizeFigmaApiJson(rawJson)
}

export async function safeExtractDesign(args: {
  figmaData: FigmaApiData
  fileKey: string
  token: string
}): Promise<SimplifiedDesign | null> {
  try {
    return await extractFigmaAsJSON(args.figmaData, {
      fileKey: args.fileKey,
      token: args.token,
      scale: 1,
      format: 'png',
      fetcher: createFrontendFetcher({ fileKey: args.fileKey }),
    })
  } catch {
    return null
  }
}

export function safeCodegen(simplifiedDesign: SimplifiedDesign | null) {
  if (!simplifiedDesign) return null
  try {
    const res = codegen(simplifiedDesign)
    return {
      html: res.html,
      body: res.body,
      css: res.css,
      size: res.size,
    }
  } catch {
    return null
  }
}
