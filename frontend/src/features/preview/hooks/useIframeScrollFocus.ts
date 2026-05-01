import { useEffect, useRef } from 'react'

export function useIframeScrollFocus() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isIframeFocusedRef = useRef(false)

  const focusIframe = () => {
    const iframe = iframeRef.current
    if (!iframe) return
    if (isIframeFocusedRef.current) return
    try {
      iframe.focus()
    } catch (error) {
      void error
    }
    try {
      iframe.contentWindow?.postMessage({ type: 'preview:focus' }, '*')
    } catch (error) {
      void error
    }
  }

  const handleIframeFocus = () => {
    focusIframe()
    requestAnimationFrame(() => focusIframe())
  }

  const handleIframePointerDown = () => {
    focusIframe()
    requestAnimationFrame(() => focusIframe())
  }

  const handleIframeClick = () => {
    handleIframeFocus()
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data
      if (!data || typeof data !== 'object') return
      if (data.type === 'preview:focus') {
        isIframeFocusedRef.current = true
      }
      if (data.type === 'preview:blur') {
        isIframeFocusedRef.current = false
      }
    }
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return {
    iframeRef,
    handleIframeFocus,
    handleIframePointerDown,
    handleIframeClick,
  }
}
