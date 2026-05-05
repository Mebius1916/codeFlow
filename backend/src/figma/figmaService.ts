import { BadRequestException, Injectable } from '@nestjs/common'
import { codegen, extractFigmaAsJSON, getDefaultOptions, setOptions } from '@codify/design2code'
import { ObjectStorageService } from '../storage/objectStorageService.ts'
import type { ConvertFigmaDto } from './figmaController.ts'

interface FigmaApiResponse {
  body?: unknown
}

@Injectable()
export class FigmaService {
  private convertQueue = Promise.resolve()

  constructor(private readonly objectStorageService: ObjectStorageService) {}

  convert(input: ConvertFigmaDto) {
    const task = this.convertQueue.then(() => this.runConvert(input))
    this.convertQueue = task.then(() => undefined, () => undefined)
    return task
  }

  private async runConvert(input: ConvertFigmaDto) {
    if (!input.figmaUrl?.trim()) throw new BadRequestException('请输入 figma url')
    if (!input.token?.trim()) throw new BadRequestException('请先填写 Figma Token')

    const parsed = new URL(input.figmaUrl)
    const pathMatch = parsed.pathname.match(/\/(?:file|design)\/([a-zA-Z0-9]+)/)
    if (!pathMatch) {
      throw new BadRequestException('无法从链接中提取 File Key，请检查链接格式')
    }

    const fileKey = pathMatch[1]
    const nodeId = parsed.searchParams.get('node-id')
    if (!nodeId) {
      throw new BadRequestException('链接中缺少 node-id 参数，请选中一个 Frame 后再复制链接')
    }

    const figmaResp = await fetch(
      `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId.replace(/-/g, ':'))}`,
      { headers: { 'X-Figma-Token': input.token.trim() } },
    )
    if (!figmaResp.ok) {
      throw new BadRequestException(`Failed to fetch Figma data: ${figmaResp.status} ${figmaResp.statusText}`)
    }

    const rawJson = await figmaResp.json() as unknown
    const figmaData = (() => {
      if (rawJson && typeof rawJson === 'object' && 'body' in (rawJson as FigmaApiResponse)) {
        const body = (rawJson as FigmaApiResponse).body
        if (typeof body === 'string') return JSON.parse(body) as unknown
        if (body && typeof body === 'object') return body
      }
      return rawJson
    })()

    const assetUrlMap = new Map<string, string>()
    const assetPathByKey = new Map<string, string>()

    setOptions(getDefaultOptions())
    if (input.algorithmOptions && Object.keys(input.algorithmOptions).length) {
      setOptions(input.algorithmOptions)
    }

    const simplifiedDesign = await extractFigmaAsJSON(figmaData as Parameters<typeof extractFigmaAsJSON>[0], {
      fileKey,
      token: input.token.trim(),
      scale: 1,
      format: 'png',
      fetcher: {
        image: async (url: string, key: string, headers?: Record<string, string>) => {
          const cachedPath = assetPathByKey.get(key)
          if (cachedPath) return cachedPath

          const resp = await fetch(url, { headers: headers || {} })
          if (!resp.ok) {
            throw new Error(`Failed to fetch image: ${resp.status} ${resp.statusText}`)
          }

          const contentType = resp.headers.get('content-type') || ''
          const relativePath = `assets/${fileKey}/${key}.${
            contentType.toLowerCase().includes('image/svg+xml')
              ? 'svg'
              : contentType.toLowerCase().includes('image/jpeg')
                ? 'jpg'
                : 'png'
          }`

          const objectUrl = await this.objectStorageService.uploadPublicObject(
            relativePath,
            contentType.includes('svg')
              ? await resp.text()
              : new Uint8Array(await (await resp.blob()).arrayBuffer()),
            contentType,
          )

          assetPathByKey.set(key, relativePath)
          assetUrlMap.set(relativePath, objectUrl)
          return relativePath
        },
        resolveCache: async (key: string) => assetPathByKey.get(key),
      },
    }).catch(() => null)

    if (!simplifiedDesign) {
      throw new BadRequestException('Figma 解析失败')
    }

    const codegenResult = (() => {
      try {
        const result = codegen(simplifiedDesign)
        let html = result.html
        let body = result.body
        let css = result.css
        for (const [path, url] of assetUrlMap) {
          html = html.split(path).join(url)
          body = body.split(path).join(url)
          css = css.split(path).join(url)
        }
        return { html, body, css, size: result.size }
      } catch {
        return null
      }
    })()

    if (!codegenResult) {
      throw new BadRequestException('Codegen 失败')
    }

    return { codegenResult }
  }
}
