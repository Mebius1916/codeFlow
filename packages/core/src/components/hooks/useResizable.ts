import { useState, useRef, useEffect, useCallback } from 'react'

interface UseResizableProps {
  initialSize: number
  minSize?: number
  maxSize?: number
  onSizeChange: (size: number) => void
  direction?: 'left' | 'right' | 'top' | 'bottom'
}

export function useResizable({
  initialSize,
  minSize = 0,
  maxSize = Infinity,
  onSizeChange,
  direction = 'right'
}: UseResizableProps) {
  const [isDragging, setIsDragging] = useState(false)
  const startPosRef = useRef<number>(0)
  const startSizeRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  const isHorizontal = direction === 'left' || direction === 'right'

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 阻止默认行为和冒泡，避免选中其他文本
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(true)
    startPosRef.current = isHorizontal ? e.clientX : e.clientY
    startSizeRef.current = initialSize
    
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }, [initialSize, isHorizontal])

  useEffect(() => {
    if (!isDragging) return

    const allIframes = document.querySelectorAll('iframe')
    allIframes.forEach(iframe => {
      iframe.style.pointerEvents = 'none'
    })

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) return

      rafRef.current = requestAnimationFrame(() => {
        const currentPos = isHorizontal ? e.clientX : e.clientY
        const delta = currentPos - startPosRef.current
        
        // 如果是左侧或顶部拖拽，向左/上移动会导致尺寸增加，所以 delta 取反
        let effectiveDelta = delta
        if (direction === 'left' || direction === 'top') {
          effectiveDelta = -delta
        }
        
        const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current + effectiveDelta))
        onSizeChange(newSize)
        
        rafRef.current = null
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      
      // 恢复 iframe 的 pointer-events
      allIframes.forEach(iframe => {
        iframe.style.pointerEvents = ''
      })

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      
      allIframes.forEach(iframe => {
        iframe.style.pointerEvents = ''
      })
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isDragging, minSize, maxSize, onSizeChange, direction, isHorizontal])

  return { isDragging, handleMouseDown }
}
