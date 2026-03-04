import { useState, useRef, useEffect, useCallback } from 'react'
import { useUiStore } from '../../../lib/store'
import { Terminal } from '.'
import { useFeatures } from '../../../lib/context/FeatureContext'

export function TerminalPanel() {
  const { terminalHeight, setTerminalHeight } = useUiStore()
  const { terminal: isEnabled } = useFeatures()
  
  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef<number>(0)
  const startHeightRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

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
      
      // 使用 requestAnimationFrame 优化性能
      if (rafRef.current) return

      rafRef.current = requestAnimationFrame(() => {
        const deltaY = e.clientY - startYRef.current
        // 向上拖拽是负数，高度应该增加，所以是 startHeight - deltaY
        const newHeight = startHeightRef.current - deltaY
        setTerminalHeight(newHeight)
        rafRef.current = null
      })
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        
        // 清理可能未执行的 raf
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
  }, [isDragging, setTerminalHeight])

  // 如果功能被禁用，则不渲染
  if (isEnabled === false) {
    return null
  }

  return (
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
      
      {/* Terminal Panel */}
      <div 
        className="border-t border-[#2a2f4c] bg-[#1e1e1e] overflow-hidden"
        style={{ height: terminalHeight }}
      >
        <Terminal />
      </div>
    </>
  )
}
