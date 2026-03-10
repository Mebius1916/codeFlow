import { useEffect, useState } from 'react'
import { useShallow, useUiStore } from '@collaborative-editor/shared'
import { getCachedPreviewSize, type PreviewContentSize } from '../utils/cache/preview-size'

export function usePreviewContentSize(roomId: string) {
  const [cachedPreviewContentSize, setCachedPreviewContentSize] = useState<PreviewContentSize | null>(null)
  const previewContentSize = useUiStore(useShallow((state) => state.previewContentSize))

  useEffect(() => {
    setCachedPreviewContentSize(null)
    if (previewContentSize) return

    let cancelled = false
    getCachedPreviewSize(roomId).then((size) => {
      if (!cancelled) setCachedPreviewContentSize(size ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [roomId, previewContentSize])

  return previewContentSize ?? cachedPreviewContentSize
}
