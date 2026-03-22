import { useEffect, useMemo, useState } from 'react'
import { createLocalForageContentRepository, setContentRepository, useEditorStore } from '@collaborative-editor/shared'

type FileContent = string | Uint8Array

export function useContentLayer(args: {
  roomId: string
  collaborationEnabled?: boolean
  initialFiles?: Record<string, FileContent>
}) {
  const { roomId, collaborationEnabled, initialFiles } = args
  const [isContentReady, setIsContentReady] = useState(false)

  // 初始化
  const repo = useMemo(() => {
    if (collaborationEnabled) return null
    return createLocalForageContentRepository(roomId)
  }, [collaborationEnabled, roomId])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!repo) {
        setIsContentReady(true)
        return
      }

      const bootstrapped = initialFiles ? await repo.bootstrapIfEmpty(initialFiles) : false
      const snapshot = bootstrapped ? { files: initialFiles!, fileKeys: Object.keys(initialFiles!) } : await repo.loadAll()

      if (cancelled) return
      useEditorStore.getState().initializeFiles(snapshot.files)
      setIsContentReady(true)
    }

    run().catch(() => {
      if (!cancelled) setIsContentReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [repo, initialFiles])

  useEffect(() => {
    setContentRepository(repo)

    return () => {
      setContentRepository(null)
    }
  }, [repo])

  return { isContentReady }
}
