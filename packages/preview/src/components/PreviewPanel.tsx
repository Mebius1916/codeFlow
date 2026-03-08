import { Loading } from '@collaborative-editor/shared'
import { useWebContainer } from '../hooks/useWebContainer'
import { useIframeScrollFocus } from '../hooks/useIframeScrollFocus'
import { PreviewToolbar } from './PreviewToolbar'
import { usePreviewSnapshot } from '../hooks/usePreviewSnapshot'

export function PreviewPanel({ roomId }: { roomId: string }) {
  const { previewFiles, isSnapshotLoading, refreshSnapshot } = usePreviewSnapshot(roomId)
  const {
    iframeRef,
    handleIframePointerDown,
    handleIframeClick,
  } = useIframeScrollFocus()

  const { previewUrl, isLoading, error, logs } = useWebContainer(previewFiles)

  const handleRefresh = async () => {
    await refreshSnapshot()
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#252526] text-red-400 p-4 text-center">
        <div className="text-2xl mb-2">⚠️</div>
        <div className="font-bold mb-2">预览环境启动失败</div>
        <div className="text-xs font-mono bg-black/30 p-2 rounded mb-4 max-w-full overflow-auto">
          {error}
        </div>
        <div className="text-xs text-gray-500">请检查浏览器控制台或网络设置</div>
      </div>
    )
  }

  if (isLoading || isSnapshotLoading) {
    return (
      <Loading
        text="启动预览环境..."
        detail={logs[logs.length - 1]}
      />
    )
  }

  if (!previewUrl) {
    return (
      <Loading 
        text="启动预览环境..."
        detail={logs[logs.length - 1]}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <PreviewToolbar previewUrl={previewUrl} onRefresh={handleRefresh} />
      <iframe
        ref={iframeRef}
        src={previewUrl}
        className="flex-1 w-full border-none bg-white"
        title="Preview"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        onPointerDown={handleIframePointerDown}
        onClick={handleIframeClick}
        tabIndex={0}
      />
    </div>
  )
}
