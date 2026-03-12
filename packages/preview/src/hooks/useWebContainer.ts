import { useState, useEffect, useRef, useCallback } from 'react'
import { getWebContainer, getLastPreviewUrl, subscribeLogs, subscribeServerReady } from '../webcontainer/runtime'
import { ensurePreviewServer } from '../webcontainer/bootstrap'
import { ensureDirectories, writeFilesConcurrently } from '../webcontainer/fs'

export function useWebContainer(files: Record<string, string | Uint8Array>) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const startedRef = useRef(false)

  const addLog = (msg: string) => {
    setLogs((prev: string[]) => [...prev.slice(-4), msg])
  }

  const runSync = useCallback(async (nextFiles: Record<string, string | Uint8Array>) => {
    const webcontainerInstance = getWebContainer()
    if (!webcontainerInstance) return
    const entries = Object.entries(nextFiles)
    if (entries.length === 0) return
    await ensureDirectories(webcontainerInstance, entries.map(([path]) => path))
    await writeFilesConcurrently(webcontainerInstance, entries, 8)
  }, [])

  useEffect(() => {
    setError(null)
    const lastUrl = getLastPreviewUrl()
    if (lastUrl) {
      setPreviewUrl(lastUrl)
      setIsLoading(false)
    } else {
      setIsLoading(true)
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
    startedRef.current = true

    // 先启动
    ensurePreviewServer(files)
      .then(() => {
        // 再写入文件
        runSync(files)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e))
        setIsLoading(false)
        startedRef.current = false
      })
  }, [files, runSync])

  return { previewUrl, isLoading, error, logs }
}
