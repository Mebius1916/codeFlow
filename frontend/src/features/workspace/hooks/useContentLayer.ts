import { useEffect, useState } from 'react'
import { createLocalForageContentRepository } from '@/features/workspace/repository/contentRepository'
import { useEditorStore } from '@/features/workspace/store/editorStore'

export function useContentLayer() {
  const [isContentReady, setIsContentReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const repo = createLocalForageContentRepository()
      const snapshot = await repo.loadAll()

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
  }, [])

  return { isContentReady }
}
