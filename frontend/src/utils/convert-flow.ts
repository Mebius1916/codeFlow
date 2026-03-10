import { setSnapshot } from '@collaborative-editor/yjs-local-forage'
import { useEditorStore, useUiStore } from '@collaborative-editor/shared'
import type { FigmaParseResult } from '../hooks/useFigmaUrlParser'
import { handleFigmaConvertSuccess as handleFigmaConvertSuccessImpl } from './figma/convert-success'
import { getCachedContentByUrl } from './cache/image'
import { setCachedPreviewSize } from './cache/preview-size'
import { createRoomId, setRoomIdInUrl } from './room-id'

export async function runConvertFlow(result: FigmaParseResult) {
  const nextRoomId = createRoomId()
  const size = result.codegen_result?.size
  const nextSize = size?.width && size?.height ? size : undefined
  useUiStore.getState().setPreviewContentSize(nextSize ?? null)

  const { initializeFiles, openFile } = useEditorStore.getState()
  await handleFigmaConvertSuccessImpl(result, {
    getCachedContentByUrl,
    initializeFiles,
    openFile,
  })

  const files = useEditorStore.getState().files
  await setSnapshot(nextRoomId, files)
  if (nextSize) setCachedPreviewSize(nextRoomId, nextSize)
  setRoomIdInUrl(nextRoomId)

  return nextRoomId
}
