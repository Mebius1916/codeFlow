import { useState, useRef, useEffect, useCallback } from 'react'
import { useUiStore, useEditorStore } from '../../lib/store'
import { useFeatures } from '../../lib/context/FeatureContext'

export function FileTreePanel() {
  const { fileTreeWidth, setFileTreeWidth } = useUiStore()
  const { files, activeFile, openFile, addFile } = useEditorStore()
  const { fileTree: isEnabled } = useFeatures()
  
  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  // 拖拽处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    startXRef.current = e.clientX
    startWidthRef.current = fileTreeWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [fileTreeWidth])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      if (rafRef.current) return

      rafRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - startXRef.current
        const newWidth = startWidthRef.current + deltaX
        setFileTreeWidth(newWidth)
        rafRef.current = null
      })
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, setFileTreeWidth])

  // 新建文件处理
  const handleAddFile = () => {
    const fileName = prompt('请输入文件名:', 'new-file.js')
    if (fileName) {
      addFile(fileName, '')
      openFile(fileName)
    }
  }

  // 如果功能被禁用，则不渲染
  if (isEnabled === false) {
    return null
  }

  return (
    <div className="flex h-full relative group">
      {/* File Tree Panel */}
      <div 
        className="h-full bg-[#18181b] border-r border-white/10 flex flex-col"
        style={{ width: fileTreeWidth }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">资源管理器</h3>
          <button 
            onClick={handleAddFile}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="新建文件"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          {Object.keys(files).map((fileName) => (
            <div
              key={fileName}
              onClick={() => openFile(fileName)}
              className={`
                flex items-center gap-2 px-4 py-1.5 cursor-pointer text-sm transition-colors
                ${activeFile === fileName 
                  ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5 border-l-2 border-transparent'
                }
              `}
            >
              <span className="opacity-70">
                {fileName.endsWith('.js') || fileName.endsWith('.ts') ? '📄' : 
                 fileName.endsWith('.css') ? '🎨' : 
                 fileName.endsWith('.html') ? '🌐' : '📝'}
              </span>
              <span className="truncate">{fileName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resizer Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          w-1 h-full cursor-col-resize z-20 hover:bg-blue-500/50 transition-colors
          ${isDragging ? 'bg-blue-500' : 'bg-transparent'}
          absolute right-0 top-0 bottom-0
        `}
      />
    </div>
  )
}
