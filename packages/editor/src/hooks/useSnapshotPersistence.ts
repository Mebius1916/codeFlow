import { useEffect, useRef } from 'react'
import { useEditorStore } from '@collaborative-editor/shared'
import { getSnapshot, setSnapshot } from '@collaborative-editor/yjs-local-forage'

export function useSnapshotPersistence({
  roomId,
  initialFiles,
  enabled = true,
  debounceMs = 1000,
}: {
  roomId: string
  initialFiles?: Record<string, string>
  enabled?: boolean
  debounceMs?: number
}) {
  const snapshotRef = useRef<Record<string, string | Uint8Array>>({})
  const readyRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return

    const init = async () => {
      const snapshot = await getSnapshot(roomId)
      snapshotRef.current = snapshot && Object.keys(snapshot).length > 0 ? snapshot : (initialFiles ?? {})
      readyRef.current = true
    }

    init()
  }, [roomId, initialFiles, enabled])

  useEffect(() => {
    if (!enabled) return

    const unsubscribe = useEditorStore.subscribe((state) => {
      if (!readyRef.current) return
      const activeFile = state.activeFile
      if (!activeFile) return
      const content = state.activeContent
      if (content === null) return
      if (snapshotRef.current[activeFile] === content) return

      snapshotRef.current = { ...snapshotRef.current, [activeFile]: content }

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        setSnapshot(roomId, snapshotRef.current)
      }, debounceMs)
    })

    return () => {
      unsubscribe()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [roomId, enabled, debounceMs])
}
