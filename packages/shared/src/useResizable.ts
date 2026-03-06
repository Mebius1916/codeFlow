import { useState, useRef, useEffect, useCallback } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

interface UseResizableProps {
  initialSize: number
  getInitialSize?: () => number
  minSize?: number
  maxSize?: number
  onSizeChange: (size: number) => void
  onSizeCommit?: (size: number) => void
  direction?: 'left' | 'right' | 'top' | 'bottom'
  onDragStart?: () => void
  onDragEnd?: () => void
}

export function useResizable({
  initialSize,
  getInitialSize,
  minSize = 0,
  maxSize = Infinity,
  onSizeChange,
  onSizeCommit,
  direction = 'right',
  onDragStart,
  onDragEnd,
}: UseResizableProps) {
  const [isDragging, setIsDragging] = useState(false)
  const startPosRef = useRef<number>(0)
  const startSizeRef = useRef<number>(0)
  const lastSizeRef = useRef<number>(initialSize)
  const rafRef = useRef<number | null>(null)

  const isHorizontal = direction === 'left' || direction === 'right'

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setIsDragging(true)
      onDragStart?.()
      startPosRef.current = isHorizontal ? e.clientX : e.clientY
      const resolvedInitialSize = getInitialSize?.() ?? initialSize
      startSizeRef.current = resolvedInitialSize
      lastSizeRef.current = resolvedInitialSize

      document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
    },
    [getInitialSize, initialSize, isHorizontal, onDragStart],
  )

  useEffect(() => {
    if (!isDragging) return

    const allIframes = document.querySelectorAll('iframe')
    allIframes.forEach((iframe) => {
      iframe.style.pointerEvents = 'none'
    })

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) return

      rafRef.current = requestAnimationFrame(() => {
        const currentPos = isHorizontal ? e.clientX : e.clientY
        const delta = currentPos - startPosRef.current

        let effectiveDelta = delta
        if (direction === 'left' || direction === 'top') {
          effectiveDelta = -delta
        }

        const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current + effectiveDelta))
        onSizeChange(newSize)
        lastSizeRef.current = newSize

        rafRef.current = null
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      onSizeCommit?.(lastSizeRef.current)
      onDragEnd?.()
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      allIframes.forEach((iframe) => {
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

      allIframes.forEach((iframe) => {
        iframe.style.pointerEvents = ''
      })
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isDragging, minSize, maxSize, onSizeChange, onSizeCommit, direction, isHorizontal, onDragEnd])

  return { isDragging, handleMouseDown }
}
