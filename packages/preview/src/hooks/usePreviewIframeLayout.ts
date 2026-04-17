import { useEffect, useRef, useState, type RefObject } from 'react'

type LayoutPayload = { scale: number; width: number; height: number } | null

export function usePreviewIframeLayout({
  iframeRef,
  previewUrl,
  layoutPayload,
}: {
  iframeRef: RefObject<HTMLIFrameElement | null>
  previewUrl: string | null
  layoutPayload: LayoutPayload
}) {
  const [isIframeLoaded, setIsIframeLoaded] = useState(false)
  const readyRef = useRef(false) // 是否已经握手
  const bootIdRef = useRef<string | null>(null) // iframe 唯一标识
  const layoutPayloadRef = useRef<LayoutPayload>(layoutPayload) // 布局参数

  layoutPayloadRef.current = layoutPayload

  const postLayout = () => {
    if (!readyRef.current) return
    const payload = layoutPayloadRef.current
    if (!payload) return
    iframeRef.current?.contentWindow?.postMessage?.(
      { type: 'preview:layout', payload: { ...payload, bootId: bootIdRef.current } },
      '*',
    )
  }

  useEffect(() => {
    setIsIframeLoaded(false)
    readyRef.current = false
    bootIdRef.current = null
  }, [previewUrl])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data
      if (event.source !== iframeRef.current?.contentWindow) return
      if (!data || typeof data !== 'object') return

      if ((data as any).type === 'preview:ready') {
        bootIdRef.current = (data as any).payload?.bootId ?? null
        readyRef.current = true
        postLayout()
        return
      }

      if ((data as any).type === 'preview:layout:applied') {
        const { bootId } = (data as any).payload ?? {}
        if (bootIdRef.current && bootId !== bootIdRef.current) return
        setIsIframeLoaded(true)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [iframeRef])

  useEffect(() => {
    postLayout()
  }, [previewUrl, layoutPayload])

  return { isIframeLoaded }
}
