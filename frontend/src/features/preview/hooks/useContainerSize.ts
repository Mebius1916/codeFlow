import { useEffect, useState } from 'react'

type Size = { width: number; height: number }

export function useContainerSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null)
  const containerRef = (node: T | null) => {
    setElement(node)
  }
  const [containerSize, setContainerSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    if (!element) return
    if (typeof ResizeObserver === 'undefined') return

    const applySize = () => {
      const rect = element.getBoundingClientRect()
      setContainerSize({ width: rect.width, height: rect.height })
    }

    applySize()

    const observer = new ResizeObserver(() => {
      applySize()
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [element])

  return { containerRef, containerSize }
}
