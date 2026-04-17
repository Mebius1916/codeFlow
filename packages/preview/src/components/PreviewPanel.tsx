import { Loading, useEditorStore } from '@collaborative-editor/shared'
import { useIframeScrollFocus } from '../hooks/useIframeScrollFocus'
import { usePreviewAutoCapture } from '../hooks/usePreviewAutoCapture'
import { usePreviewIframeLayout } from '../hooks/usePreviewIframeLayout'
import { useWebContainer } from '../hooks/useWebContainer'
import { useContainerSize } from '../hooks/useContainerSize'
import { computeCaptureTargetSize, computeLayoutPayload } from '../utils/common'

type PreviewContentSize = { width: number; height: number }

export function PreviewPanel({
  roomId: _roomId,
  previewContentSize,
  onCapturePngBase64,
}: {
  roomId: string
  previewContentSize?: PreviewContentSize | null
  onCapturePngBase64?: (base64: string) => void
}) {
  const previewFiles = useEditorStore((state) => state.files)
  const { iframeRef, handleIframePointerDown, handleIframeClick } = useIframeScrollFocus()
  const { containerRef, containerSize } = useContainerSize<HTMLDivElement>()
  const { previewUrl, isLoading, error, logs } = useWebContainer(previewFiles)

  const layoutPayload = computeLayoutPayload(previewContentSize, containerSize)

  const { isIframeLoaded } = usePreviewIframeLayout({
    iframeRef,
    previewUrl,
    layoutPayload,
  })

  if (error) {
    return (
      <Loading
        text="预览环境启动失败"
        detail={error}
        variant="error"
        className="bg-[rgb(12,14,23)] text-red-400"
      />
    )
  }

  const targetExportSize = 
    computeCaptureTargetSize(previewContentSize, containerSize)

  usePreviewAutoCapture({
    targetSize: targetExportSize,
    disabled: isLoading || !previewUrl || !isIframeLoaded,
    iframeRef,
    onCapturedBase64: onCapturePngBase64,
  })

  return (
    <div className="flex flex-col h-full ">
      <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden ">
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
