import { useEffect } from 'react'
import { useResizable } from '@/features/workspace/hooks/useResizable'
import { useUiStore } from '@/features/workspace/store/ui-store'
import { useShallow } from 'zustand/react/shallow'

declare global {
  interface Window {
    __PREVIEW_IS_HOVERING__?: boolean
    __PREVIEW_IS_RESIZING__?: boolean
  }
}

function updateCssVars(width: number, isResizing: boolean, isHovering: boolean) {
  const root = document.documentElement
  root.style.setProperty('--preview-panel-width', `${width}px`)

  if (isResizing) {
    root.style.setProperty('--preview-panel-border-color', 'rgba(59, 130, 246, 0.5)')
    root.style.setProperty('--preview-panel-handle-bg', 'rgba(59, 130, 246, 0.5)')
    root.style.setProperty('--preview-panel-active-bg', 'rgba(59, 130, 246, 0.1)')
    return
  }

  if (isHovering) {
    root.style.setProperty('--preview-panel-border-color', 'rgba(59, 130, 246, 0.3)')
    root.style.setProperty('--preview-panel-handle-bg', 'rgba(59, 130, 246, 0.3)')
    root.style.setProperty('--preview-panel-active-bg', 'transparent')
    return
  }

  root.style.setProperty('--preview-panel-border-color', '#2a2f4c')
  root.style.setProperty('--preview-panel-handle-bg', 'transparent')
  root.style.setProperty('--preview-panel-active-bg', 'transparent')
}

export function usePreviewResizeCssVars() {
  const { previewWidth, setPreviewWidth } = useUiStore(
    useShallow((state) => ({
      previewWidth: state.previewWidth,
      setPreviewWidth: state.setPreviewWidth,
    }))
  )

  const { handleMouseDown, isDragging } = useResizable({
    initialSize: previewWidth,
    onSizeChange: (newSize) => {
      setPreviewWidth(newSize)
      updateCssVars(newSize, window.__PREVIEW_IS_RESIZING__ || false, window.__PREVIEW_IS_HOVERING__ || false)
    },
    direction: 'left',
    minSize: 200,
    maxSize: 800,
  })

  useEffect(() => {
    window.__PREVIEW_IS_RESIZING__ = isDragging
    updateCssVars(previewWidth, isDragging, window.__PREVIEW_IS_HOVERING__ || false)
  }, [isDragging, previewWidth])

  // 初始化时立即设置一次变量，防止闪烁
  useEffect(() => {
    updateCssVars(previewWidth, false, false)
  }, [])

  const onMouseEnter = () => {
    window.__PREVIEW_IS_HOVERING__ = true
    updateCssVars(previewWidth, window.__PREVIEW_IS_RESIZING__ || false, true)
  }

  const onMouseLeave = () => {
    window.__PREVIEW_IS_HOVERING__ = false
    updateCssVars(previewWidth, window.__PREVIEW_IS_RESIZING__ || false, false)
  }

  const handleStyle = {
    backgroundColor: 'var(--preview-panel-handle-bg)',
  }

  return { onMouseDown: handleMouseDown, onMouseEnter, onMouseLeave, handleStyle }
}
