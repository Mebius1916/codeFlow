import { createLocalForageContentRepository } from '@/features/workspace/repository/content-repository'
import { useEditorStore } from '@/features/workspace/store/editor-store'
import { useUiStore } from '@/features/workspace/store/ui-store'
import type { FigmaParseResult } from '../hooks/useFigmaUrlParser'
import { getCachedResourceByAssetPath } from '@/utils/cache/image'
import { DEFAULT_RESET_CSS } from '@/utils/ide/defaults'
import { formatCss, formatHtml } from '@/utils/formatting/code'

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
