import { useEditorStore } from '@/features/workspace/store/editorStore'
import { Loading } from '@/ui/Loading'
import { useIframeScrollFocus } from '../hooks/useIframeScrollFocus'
import { usePreviewAutoCapture } from '../hooks/usePreviewAutoCapture'
import { usePreviewIframeLayout } from '../hooks/usePreviewIframeLayout'
import { useWebContainer } from '../hooks/useWebContainer'
import { useContainerSize } from '../hooks/useContainerSize'
import { computeCaptureTargetSize, computeLayoutPayload } from '../utils/common'

type PreviewContentSize = { width: number; height: number }

export function PreviewPanel({
  previewContentSize,
  onCapturePngBase64,
}: {
  previewContentSize?: PreviewContentSize | null
  onCapturePngBase64?: (base64: string) => void
}) {
  const previewFiles = useEditorStore((state) => state.files)
  const { iframeRef, handleIframePointerDown, handleIframeClick } = useIframeScrollFocus()
  const { containerRef, containerSize } = useContainerSize<HTMLDivElement>()
  const { previewUrl, isLoading, error, logs } = useWebContainer(previewFiles)

  const layoutPayload = computeLayoutPayload(previewContentSize, containerSize)
  const targetExportSize = computeCaptureTargetSize(previewContentSize, containerSize)

  const { isIframeLoaded } = usePreviewIframeLayout({
    iframeRef,
    previewUrl,
    layoutPayload,
  })

  type PreviewStatus = 'booting' | 'waiting_url' | 'waiting_layout' | 'ready'

  const status: PreviewStatus = (() => {
    if (isLoading) return 'booting'
    if (!previewUrl) return 'waiting_url'
    if (layoutPayload && !isIframeLoaded) return 'waiting_layout'
    return 'ready'
  })()

  const isReady = status === 'ready'
  const lastLog = logs[logs.length - 1]
  const loadingText =
    status === 'waiting_url' ? '等待预览地址...' : '启动预览环境...'

  usePreviewAutoCapture({
    targetSize: targetExportSize,
    disabled: Boolean(error) || !isReady,
    iframeRef,
    onCapturedBase64: onCapturePngBase64,
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
        {!isReady && (
          <div className="absolute inset-0">
            <Loading className="bg-[rgb(12,14,23)] text-gray-400" text={loadingText} detail={lastLog} />
          </div>
        )}
      </div>
    </div>
  )
}
