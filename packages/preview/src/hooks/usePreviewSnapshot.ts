import { useCallback, useEffect, useState } from 'react'
import { getSnapshot } from '@collaborative-editor/yjs-local-forage'

export function usePreviewSnapshot(roomId: string) {
  const [previewFiles, setPreviewFiles] = useState<Record<string, string | Uint8Array>>({})
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false)

  const resolveFiles = useCallback(async () => {
    const snapshot = await getSnapshot(roomId)
    if (snapshot && Object.keys(snapshot).length > 0) {
      setPreviewFiles(snapshot)
      return
    }

    setPreviewFiles({})
  }, [roomId])

  const runWithLoading = useCallback(
    async () => {
      setIsSnapshotLoading(true)
      try {
        await resolveFiles()
      } finally {
        setIsSnapshotLoading(false)
      }
    },
    [resolveFiles],
  )

  useEffect(() => {
    runWithLoading()
  }, [runWithLoading])

  const refreshSnapshot = useCallback(() => runWithLoading(), [runWithLoading])

  return { previewFiles, isSnapshotLoading, refreshSnapshot }
}
