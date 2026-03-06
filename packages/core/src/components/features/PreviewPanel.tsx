import { useRef } from 'react'
import { useEditorStore } from '../../lib/store'
import { useWebContainer } from '../hooks'
import { PreviewToolbar } from './PreviewToolbar'

export function PreviewPanel() {
  const { files } = useEditorStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  const { previewUrl, isLoading, error, logs } = useWebContainer(files)

  // 刷新 iframe
  const handleRefresh = () => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-red-400 p-4 text-center">
        <div className="text-2xl mb-2">⚠️</div>
        <div className="font-bold mb-2">预览环境启动失败</div>
        <div className="text-xs font-mono bg-black/30 p-2 rounded mb-4 max-w-full overflow-auto">
          {error}
        </div>
        <div className="text-xs text-gray-500">
          请检查浏览器控制台或网络设置
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-400">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">启动预览环境...</span>
          <div className="text-[10px] font-mono text-gray-600 max-w-[200px] truncate">
            {logs[logs.length - 1]}
          </div>
        </div>
      </div>
    )
  }

  if (!previewUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-500 text-xs">
        等待服务器启动...
      </div>
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
      />
    </div>
  )
}
