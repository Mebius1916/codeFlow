'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Editor } from './Editor'
import { Terminal } from './Terminal'
import { Toolbar } from './Toolbar'
import { useEditorStore, useUiStore } from '../../lib/store'
import type { CodeEditorProps } from './types'

export function CodeEditor({
  roomId,
  user,
  initialFiles = {},
  height = '100vh',
  wsUrl,
  onSave,
  onError,
}: CodeEditorProps) {
  const { addFile, openFile } = useEditorStore()
  const { isTerminalVisible, terminalHeight, setTerminalHeight } = useUiStore()
  
  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef<number>(0)
  const startHeightRef = useRef<number>(0)

  // 参数校验
  if (!user.id) {
    throw new Error('[CodeEditor] user.id 是必需参数，请由宿主应用传入稳定的用户ID')
  }

  // 初始化文件
  useEffect(() => {
    Object.entries(initialFiles).forEach(([path, content]) => {
      addFile(path, content)
    })
    
    // 自动打开第一个文件
    const firstFile = Object.keys(initialFiles)[0]
    if (firstFile) {
      openFile(firstFile)
    }
  }, []) // 只在挂载时执行一次

  // 拖拽处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    startYRef.current = e.clientY
    startHeightRef.current = terminalHeight
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }, [terminalHeight])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const deltaY = e.clientY - startYRef.current
      // 向上拖拽是负数，高度应该增加，所以是 startHeight - deltaY
      const newHeight = startHeightRef.current - deltaY
      setTerminalHeight(newHeight)
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
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
  }, [isDragging, setTerminalHeight])

  return (
    <div 
      className="flex flex-col bg-[#1e1e1e] overflow-hidden"
      style={{ height }}
    >
      <Toolbar />
      
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <div className="flex-1 overflow-hidden relative">
          <Editor 
            roomId={roomId} 
            user={user} 
            wsUrl={wsUrl}
          />
        </div>
        
        {isTerminalVisible && (
          <>
            {/* Resizer Handle */}
            <div
              onMouseDown={handleMouseDown}
              className={`
                h-1.5 w-full cursor-row-resize z-20 hover:bg-blue-500/50 transition-colors
                ${isDragging ? 'bg-blue-500' : 'bg-transparent'}
                absolute left-0
              `}
              style={{ bottom: terminalHeight - 3 }}
            />
            
            <div style={{ height: terminalHeight, flexShrink: 0 }} className="relative z-10 border-t border-white/10">
              <Terminal />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export type { CodeEditorProps }

