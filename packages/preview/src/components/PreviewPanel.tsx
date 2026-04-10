import { Loading, useEditorStore } from '@collaborative-editor/shared'
import { useEffect, useRef, useState } from 'react'
import { useIframeScrollFocus } from '../hooks/useIframeScrollFocus'
import { useWebContainer } from '../hooks/useWebContainer'
import { useContainerSize } from '../hooks/useContainerSize'
import { PreviewExportButton } from './PreviewExportButton'

type PreviewContentSize = { width: number; height: number }

export function PreviewPanel({
  previewContentSize,
}: {
  roomId: string
  previewContentSize?: PreviewContentSize | null
}) {
  const previewFiles = useEditorStore((state) => state.files)
  const { iframeRef, handleIframePointerDown, handleIframeClick } = useIframeScrollFocus()
  const { containerRef, containerSize } = useContainerSize<HTMLDivElement>()
  const { previewUrl, isLoading, error, logs } = useWebContainer(previewFiles)
  const [isIframeLoaded, setIsIframeLoaded] = useState(false)
  const readyRef = useRef(false)
  const bootIdRef = useRef<string | null>(null)

  const scale =
    previewContentSize?.width && previewContentSize?.height && containerSize.width && containerSize.height
      ? Math.min(containerSize.width / previewContentSize.width, containerSize.height / previewContentSize.height)
      : 1

  const layoutPayload =
    previewContentSize?.width && previewContentSize?.height && containerSize.width && containerSize.height
      ? { scale, width: previewContentSize.width, height: previewContentSize.height }
      : null

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
        if (!layoutPayload) return
        iframeRef.current?.contentWindow?.postMessage?.(
          { type: 'preview:layout', payload: { ...layoutPayload, bootId: bootIdRef.current } },
          '*',
        )
        return
      }
      if ((data as any).type === 'preview:layout:applied') {
        const { bootId } = (data as any).payload ?? {}
        if (bootIdRef.current && bootId !== bootIdRef.current) return
        setIsIframeLoaded(true)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [iframeRef, layoutPayload, previewUrl])

  useEffect(() => {
    if (!previewUrl) return
    if (!readyRef.current) return
    if (!layoutPayload) return
    iframeRef.current?.contentWindow?.postMessage?.(
      { type: 'preview:layout', payload: { ...layoutPayload, bootId: bootIdRef.current } },
      '*',
    )
  }, [layoutPayload, previewUrl])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400 p-4 text-center">
        <div className="text-2xl mb-2">⚠️</div>
        <div className="font-bold mb-2">预览环境启动失败</div>
        <div className="text-xs font-mono bg-black/30 p-2 rounded mb-4 max-w-full overflow-auto">{error}</div>
        <div className="text-xs text-gray-500">请检查浏览器控制台或网络设置</div>
      </div>
    )
  }

  const targetExportSize =
    previewContentSize?.width && previewContentSize?.height
      ? { width: Math.round(previewContentSize.width), height: Math.round(previewContentSize.height) }
      : containerSize.width && containerSize.height
        ? { width: Math.round(containerSize.width), height: Math.round(containerSize.height) }
        : null

  return (
    <div className="flex flex-col h-full ">
      <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden ">
        <PreviewExportButton
          targetSize={targetExportSize}
          disabled={isLoading || !previewUrl || !isIframeLoaded}
          iframeRef={iframeRef}
        />
        <iframe
          ref={iframeRef}
          src={previewUrl ?? undefined}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'rgb(12, 14, 23)',
          }}
          title="Preview"
          sandbox=" allow-same-origin allow-scripts"
          allow="cross-origin-isolated"
          onPointerDown={handleIframePointerDown}
          onClick={handleIframeClick}
          tabIndex={0}
        />
        {(isLoading || !previewUrl || !isIframeLoaded) && (
          <div className="absolute inset-0">
            <Loading className="bg-[rgb(12,14,23)] text-gray-400" text="启动预览环境..." detail={logs[logs.length - 1]} />
          </div>
        )}
      </div>
    </div>
  )
}
