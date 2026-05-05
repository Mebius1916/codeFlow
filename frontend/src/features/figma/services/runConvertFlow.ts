import { createLocalForageContentRepository } from '@/features/workspace/repository/contentRepository'
import { useEditorStore } from '@/features/workspace/store/editorStore'
import { useUiStore } from '@/features/workspace/store/uiStore'
import type { FigmaConvertResult } from '../interfaces/model'
import { DEFAULT_RESET_CSS } from '@/features/workspace/utils/defaultFiles'
import { formatCss, formatHtml } from '@/utils/format'

export async function runConvertFlow(result: FigmaConvertResult) {
  const size = result.codegenResult?.size
  const nextSize = size?.width && size?.height ? size : undefined
  useUiStore.getState().setPreviewContentSize(nextSize ?? null)

  const { html, body, css } = result.codegenResult
  const files: Record<string, string> = {
    'src/index.html': formatHtml(body ?? html),
    'src/reset.css': DEFAULT_RESET_CSS,
    'src/style.css': formatCss(css),
  }

  const { initializeFiles, openFile } = useEditorStore.getState()
  initializeFiles(files)
  openFile('src/index.html')

  const repo = createLocalForageContentRepository()
  await repo.replaceAll(files)
}
