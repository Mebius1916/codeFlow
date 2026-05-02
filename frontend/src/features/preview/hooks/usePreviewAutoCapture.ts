import { useEffect, useRef, type RefObject } from 'react'
import type { RectSize } from '../contracts'
import { blobToBase64Png } from '../utils/common'
type PreviewCaptureMessage =
  | { type: 'preview:capture:done'; payload?: { buffer?: ArrayBuffer } }
  | { type: 'preview:capture:error' }

interface PreviewAutoCaptureOptions {
  targetSize: RectSize | null
  disabled?: boolean
  iframeRef: RefObject<HTMLIFrameElement | null>
  onCapturedBase64?: (base64: string) => void
}

function readCaptureMessage(data: unknown): PreviewCaptureMessage | null {
  if (!data || typeof data !== 'object') return null
  const message = data as { type?: unknown; payload?: { buffer?: ArrayBuffer } }
  if (message.type === 'preview:capture:done') {
    return { type: message.type, payload: message.payload }
  }
  if (message.type === 'preview:capture:error') {
    return { type: message.type }
  }
  return null
}

export function usePreviewAutoCapture({
  targetSize,
  disabled,
  iframeRef,
  onCapturedBase64,
}: PreviewAutoCaptureOptions) {
  const isDisabled = disabled || !targetSize
  const captureStateRef = useRef<{ status: 'idle' | 'capturing'; lastKey: string | null }>({
    status: 'idle',
    lastKey: null,
  })

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      const message = readCaptureMessage(event.data)
      if (!message) return

      if (message.type === 'preview:capture:done') {
        const buffer = message.payload?.buffer
        if (!buffer) {
          captureStateRef.current.status = 'idle'
          captureStateRef.current.lastKey = null
          return
        }
        blobToBase64Png(new Blob([buffer], { type: 'image/png' }))
          .then((base64) => {
            captureStateRef.current.status = 'idle'
            if (!base64) {
              captureStateRef.current.lastKey = null
              return
            }
            onCapturedBase64?.(base64)
          })
          .catch(() => {
            captureStateRef.current.status = 'idle'
            captureStateRef.current.lastKey = null
          })
      }

      if (message.type === 'preview:capture:error') {
        captureStateRef.current.status = 'idle'
        captureStateRef.current.lastKey = null
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [iframeRef, onCapturedBase64])

  useEffect(() => {
    if (isDisabled || !targetSize) return
    const iframe = iframeRef.current
    const win = iframe?.contentWindow
    if (!iframe || !win) return

    const key = iframe.src
    const state = captureStateRef.current
    if (state.status === 'capturing' || state.lastKey === key) return

    state.status = 'capturing'
    state.lastKey = key
    win.postMessage({ type: 'preview:capture', payload: { width: targetSize.width, height: targetSize.height } }, '*')
  }, [iframeRef, isDisabled, targetSize?.width, targetSize?.height])
}
