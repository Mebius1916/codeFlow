import { useState, useRef, useEffect, useCallback } from 'react'

export function useResizablePanel({ 
  initialWidth, 
  minWidth = 150, 
  maxWidth = 400, 
  onWidthChange 
}: { 
  initialWidth: number
  minWidth?: number
  maxWidth?: number
  onWidthChange: (width: number) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    startXRef.current = e.clientX
    startWidthRef.current = initialWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [initialWidth])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      if (rafRef.current) return

      rafRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - startXRef.current
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX))
        onWidthChange(newWidth)
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
  }, [isDragging, minWidth, maxWidth, onWidthChange])

  return { isDragging, handleMouseDown }
}
