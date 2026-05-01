import { useEffect, useRef, useState, type RefObject } from 'react'

type LayoutPayload = { scale: number; width: number; height: number } | null
type PreviewLayoutMessage =
  | { type: 'preview:ready'; payload?: { bootId?: string | null } }
  | { type: 'preview:layout:applied'; payload?: { bootId?: string | null } }

function readLayoutMessage(data: unknown): PreviewLayoutMessage | null {
  if (!data || typeof data !== 'object') return null
  const message = data as { type?: unknown; payload?: { bootId?: string | null } }
  if (message.type === 'preview:ready') {
    return { type: message.type, payload: message.payload }
  }
  if (message.type === 'preview:layout:applied') {
    return { type: message.type, payload: message.payload }
  }
  return null
}

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
      if (event.source !== iframeRef.current?.contentWindow) return
      const message = readLayoutMessage(event.data)
      if (!message) return

      if (message.type === 'preview:ready') {
        bootIdRef.current = message.payload?.bootId ?? null
        readyRef.current = true
        postLayout()
        return
      }

      if (message.type === 'preview:layout:applied') {
        const bootId = message.payload?.bootId ?? null
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
