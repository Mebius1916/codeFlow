import { createLocalForageContentRepository, useEditorStore, useUiStore } from '@collaborative-editor/shared'
import type { FigmaParseResult } from '../../hooks/useFigmaUrlParser'
import { getCachedResourceByAssetPath } from '../cache/image'
import { DEFAULT_RESET_CSS } from '../ide/defaults'
import { formatCss, formatHtml } from '../formatting/code'

type FileContent = string | Uint8Array

export async function runConvertFlow(result: FigmaParseResult) {
  const size = result.codegen_result?.size
  const nextSize = size?.width && size?.height ? size : undefined
  useUiStore.getState().setPreviewContentSize(nextSize ?? null)

  if (!result.codegen_result) return

  const { html, body, css } = result.codegen_result
  const files: Record<string, FileContent> = {
    'src/index.html': formatHtml(body ?? html),
    'src/reset.css': DEFAULT_RESET_CSS,
    'src/style.css': formatCss(css),
  }

  await Promise.all(
    Array.from(result.assets_path_map.entries()).map(async ([path, assetPath]) => {
      const snapshot = await getCachedResourceByAssetPath(assetPath)
      if (snapshot?.content !== undefined) files[path] = snapshot.content
    }),
  )

  const { initializeFiles, openFile } = useEditorStore.getState()
  initializeFiles(files)
  openFile('src/index.html')

  const repo = createLocalForageContentRepository()
  await repo.replaceAll(files)
}
