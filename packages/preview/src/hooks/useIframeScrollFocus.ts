import { useRef } from 'react'
import type { WheelEvent } from 'react'

export function useIframeScrollFocus() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isIframeHoveringRef = useRef(false)

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (isIframeHoveringRef.current) return
    const iframeWindow = iframeRef.current?.contentWindow
    if (!iframeWindow) return
    let didScroll = false
    try {
      iframeWindow.scrollBy({ top: event.deltaY, left: event.deltaX })
      didScroll = true
    } catch {}
    if (didScroll) {
      event.preventDefault()
    }
  }

  const handleIframeFocus = () => {
    iframeRef.current?.focus()
  }

  const handleIframeMouseEnter = () => {
    isIframeHoveringRef.current = true
    handleIframeFocus()
  }

  const handleIframeMouseLeave = () => {
    isIframeHoveringRef.current = false
  }

  return {
    iframeRef,
    handleWheel,
    handleIframeFocus,
    handleIframeMouseEnter,
    handleIframeMouseLeave,
  }
}
