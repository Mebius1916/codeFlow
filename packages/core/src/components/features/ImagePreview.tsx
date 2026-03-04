import { useEditorStore } from '../../lib/store'

export function ImagePreview() {
  const { activeFile, files } = useEditorStore()
  
  if (!activeFile) return null
  
  const content = files[activeFile]
  const isSvg = activeFile.endsWith('.svg')
  
  // 对于 SVG，直接渲染代码内容作为 data URI
  // 对于二进制图片，通常需要后端支持或假设内容已经是 base64/URL，这里作为演示我们假设内容是 URL 或者 base64
  // 在 WebContainer 环境下，图片内容可能是二进制流，这里我们先简单处理 SVG 预览
  
  let src = ''
  if (isSvg) {
    src = `data:image/svg+xml;base64,${btoa(content)}`
  } else {
    // 对于非 SVG 图片，我们假设 content 是 base64 或 URL
    // 如果是纯文本环境，可能无法直接预览二进制图片，需要根据实际数据结构调整
    src = content
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#15172A] p-8 overflow-hidden">
      <div className="relative max-w-full max-h-full flex items-center justify-center bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==')] bg-repeat border border-[#2a2f4c] rounded-lg p-4 shadow-lg">
        {isSvg ? (
          <div 
            dangerouslySetInnerHTML={{ __html: content }} 
            className="max-w-full max-h-[80vh] overflow-hidden"
          />
        ) : (
          <img 
            src={src} 
            alt={activeFile} 
            className="max-w-full max-h-[80vh] object-contain"
          />
        )}
      </div>
      <div className="mt-4 text-gray-400 text-sm font-mono">
        {activeFile.split('/').pop()}
      </div>
    </div>
  )
}
