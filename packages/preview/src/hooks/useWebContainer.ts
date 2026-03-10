import { useState, useEffect, useRef, useCallback } from 'react'
import { useIdleDebounce } from './useIdleDebounce'
import { getWebContainer, getLastPreviewUrl, subscribeLogs, subscribeServerReady } from '../webcontainer/runtime'
import { ensurePreviewServer } from '../webcontainer/bootstrap'
import { writeChangedFiles } from '../webcontainer/fs'

export function useWebContainer(files: Record<string, string | Uint8Array>) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const previousFilesRef = useRef<Record<string, string | Uint8Array>>({})
  const startedRef = useRef(false)

  const addLog = (msg: string) => {
    setLogs((prev: string[]) => [...prev.slice(-4), msg])
  }

  const filesRef = useRef(files)

  const runSync = useCallback(async () => {
    const webcontainerInstance = getWebContainer()
    if (!webcontainerInstance) return
    const currentFiles = filesRef.current
    const previousFiles = previousFilesRef.current
    await writeChangedFiles(webcontainerInstance, currentFiles, previousFiles)
  }, [])

  const { schedule: scheduleSync } = useIdleDebounce(runSync, 200)

  useEffect(() => {
    filesRef.current = files
  }, [files])

  useEffect(() => {
    if (typeof window === 'undefined') return

    setError(null)

    const entry = resolveEntry(filesRef.current)
    if (!entry) {
      setPreviewUrl(null)
      setIsLoading(true)
    } else {
      const lastUrl = getLastPreviewUrl()
      if (lastUrl) {
        setPreviewUrl(lastUrl)
        setIsLoading(false)
      } else {
        setIsLoading(true)
      }
    }

    const unsubscribeLogs = subscribeLogs(addLog)
    const unsubscribeReady = subscribeServerReady((url) => {
      setPreviewUrl(url)
      setIsLoading(false)
    })

    return () => {
      unsubscribeLogs()
      unsubscribeReady()
    }
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    const entry = resolveEntry(files)
    if (!entry) return
    startedRef.current = true

    ensurePreviewServer(() => filesRef.current)
      .then(() => {
        previousFilesRef.current = { ...filesRef.current }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e))
        setIsLoading(false)
        startedRef.current = false
      })
  }, [files])

  useEffect(() => {
    scheduleSync()
  }, [files, scheduleSync])

  return { previewUrl, isLoading, error, logs }
}

function resolveEntry(currentFiles: Record<string, string | Uint8Array>) {
  return currentFiles['src/index.html'] != null ? './src/index.html' : null
}
