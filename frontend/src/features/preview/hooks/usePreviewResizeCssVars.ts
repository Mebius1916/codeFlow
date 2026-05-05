import { useEffect } from 'react'
import { useResizable } from '@/features/workspace/hooks/useResizable'
import {
  PREVIEW_DEFAULT_WIDTH,
  PREVIEW_MAX_WIDTH,
  PREVIEW_MIN_WIDTH,
  applyPreviewResizeVisualState,
  commitPreviewWidth,
  endPreviewResizeDrag,
  enterPreviewResizeHover,
  getPreviewResizeInitialSize,
  initPreviewResizeCssVars,
  leavePreviewResizeHover,
  setPreviewWidthVar,
  startPreviewResizeDrag,
} from '../utils/resizeCssVars'

export function usePreviewResizeCssVars() {
  useEffect(() => {
    initPreviewResizeCssVars()
    applyPreviewResizeVisualState()
  }, [])

  const { handleMouseDown } = useResizable({
    initialSize: PREVIEW_DEFAULT_WIDTH,
    getInitialSize: getPreviewResizeInitialSize,
    onSizeChange: setPreviewWidthVar,
    direction: 'left',
    minSize: PREVIEW_MIN_WIDTH,
    maxSize: PREVIEW_MAX_WIDTH,
    onSizeCommit: commitPreviewWidth,
    onDragStart: startPreviewResizeDrag,
    onDragEnd: endPreviewResizeDrag,
  })

  const handleStyle = { backgroundColor: 'var(--preview-panel-handle-bg, transparent)' } as const

  return {
    onMouseDown: handleMouseDown,
    onMouseEnter: enterPreviewResizeHover,
    onMouseLeave: leavePreviewResizeHover,
    handleStyle,
  }
}
