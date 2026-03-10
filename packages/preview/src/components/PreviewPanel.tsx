import { Loading } from '@collaborative-editor/shared'
import { useCallback, useEffect, useMemo } from 'react'
import { useIframeScrollFocus } from '../hooks/useIframeScrollFocus'
import { usePreviewSnapshot } from '../hooks/usePreviewSnapshot'
import { useWebContainer } from '../hooks/useWebContainer'
import { useContainerSize } from '../hooks/useContainerSize'

type PreviewContentSize = { width: number; height: number }

export function PreviewPanel({
  roomId,
  previewContentSize,
}: {
  roomId: string
  previewContentSize?: PreviewContentSize | null
}) {
  const { previewFiles, isSnapshotLoading } = usePreviewSnapshot(roomId)
  const { iframeRef, handleIframePointerDown, handleIframeClick } = useIframeScrollFocus()
  const { containerRef, containerSize } = useContainerSize<HTMLDivElement>()
  const { previewUrl, isLoading, error, logs } = useWebContainer(previewFiles)

  const scale = useMemo(() => {
    if (!previewContentSize?.width || !previewContentSize?.height) return 1
    const { width, height } = previewContentSize
    if (!containerSize.width || !containerSize.height) return 1
    return Math.min(containerSize.width / width, containerSize.height / height)
  }, [previewContentSize, containerSize])

  const postLayout = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    requestAnimationFrame(() => {
      try {
        iframe.contentWindow?.postMessage?.(
          {
            type: 'preview:layout',
            payload: {
              scale,
              width: previewContentSize?.width,
              height: previewContentSize?.height,
            },
          },
          '*',
        )
      } catch {}
    })
  }, [iframeRef, previewContentSize?.height, previewContentSize?.width, scale])

  useEffect(() => {
    postLayout()
  }, [postLayout, previewUrl])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#252526] text-red-400 p-4 text-center">
        <div className="text-2xl mb-2">⚠️</div>
        <div className="font-bold mb-2">预览环境启动失败</div>
        <div className="text-xs font-mono bg-black/30 p-2 rounded mb-4 max-w-full overflow-auto">{error}</div>
        <div className="text-xs text-gray-500">请检查浏览器控制台或网络设置</div>
      </div>
    )
  }

  if (isLoading || isSnapshotLoading || !previewUrl) {
    return <Loading text="启动预览环境..." detail={logs[logs.length - 1]} />
  }

  return (
    <div className="flex flex-col h-full rgb(12, 14, 23)">
      <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden">
        <iframe
          ref={iframeRef}
          src={previewUrl}
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
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          onPointerDown={handleIframePointerDown}
          onClick={handleIframeClick}
          onLoad={postLayout}
          tabIndex={0}
        />
      </div>
    </div>
  )
}
