import { useState, useEffect, useRef } from 'react'
import { getLastPreviewUrl, subscribeLogs, subscribeServerReady } from '../webcontainer/runtime/runtime'
import { ensurePreviewServer } from '../webcontainer/runtime/bootstrap'

export function useWebContainer(files: Record<string, string>) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const startedRef = useRef(false)

  const addLog = (msg: string) => {
    setLogs((prev: string[]) => [...prev.slice(-4), msg])
  }

  useEffect(() => {
    const lastUrl = getLastPreviewUrl()
    if (lastUrl) {
      console.log('[Preview] 使用上一次预览地址', lastUrl)
      setPreviewUrl(lastUrl)
      setIsLoading(false)
    } else {
      console.log('[Preview] 未发现预览地址，等待 server-ready')
    }
    const unsubscribeLogs = subscribeLogs(addLog)
    const unsubscribeReady = subscribeServerReady((url) => {
      console.log('[Preview] 收到 server-ready', url)
      setPreviewUrl(url)
      setIsLoading(false)
    })
    return () => {
      unsubscribeLogs()
      unsubscribeReady()
    }
  }, [])

  useEffect(() => {
    const entries = Object.entries(files)
    if (entries.length === 0) {
      console.log('[Preview] files 为空，等待文件加载后再启动预览')
      setIsLoading(true)
      return
    }
    if (startedRef.current) return
    startedRef.current = true
    setError(null)
    setIsLoading(true)
    const startAt = performance.now()
    ensurePreviewServer()
      .then(() => {
        const afterServer = performance.now()
        console.log(`[Preview] ensurePreviewServer ${(afterServer - startAt).toFixed(1)}ms`)
        const urlAfter = getLastPreviewUrl()
        if (!urlAfter) {
          console.log('[Preview] server-ready 尚未触发')
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e))
        setIsLoading(false)
        startedRef.current = false
      })
  }, [files])

  return { previewUrl, isLoading, error, logs }
}
