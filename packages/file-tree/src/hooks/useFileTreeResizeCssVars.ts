import { useCallback, useEffect } from 'react'
import { useResizable } from '@collaborative-editor/shared'

type ResizeState = { hoverCount: number; dragging: boolean }

const STORAGE_KEY = 'codeflow:fileTreeWidth'
const MIN_WIDTH = 150
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 250

function clampWidth(width: number) {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
}

function getResizeState(): ResizeState {
  const w = window as unknown as { __codeFlowFileTreeResizeState?: ResizeState }
  if (!w.__codeFlowFileTreeResizeState) {
    w.__codeFlowFileTreeResizeState = { hoverCount: 0, dragging: false }
  }
  return w.__codeFlowFileTreeResizeState
}

export function initFileTreeResizeCssVars() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const persistedWidth = raw ? Number(raw) : Number.NaN
  const width = clampWidth(Number.isFinite(persistedWidth) ? persistedWidth : DEFAULT_WIDTH)
  const root = document.documentElement
  root.style.setProperty('--file-tree-width', `${width}px`)
  root.style.setProperty('--file-tree-border-color', '#2a2f4c')
  root.style.setProperty('--file-tree-handle-bg', 'transparent')
}

function applyVisualState() {
  const root = document.documentElement
  const { hoverCount, dragging } = getResizeState()
  if (dragging) {
    root.style.setProperty('--file-tree-border-color', '#3b82f6')
    root.style.setProperty('--file-tree-handle-bg', '#3b82f6')
    return
  }
  if (hoverCount > 0) {
    root.style.setProperty('--file-tree-border-color', 'rgba(59, 130, 246, 0.5)')
    root.style.setProperty('--file-tree-handle-bg', 'rgba(59, 130, 246, 0.5)')
    return
  }
  root.style.setProperty('--file-tree-border-color', '#2a2f4c')
  root.style.setProperty('--file-tree-handle-bg', 'transparent')
}

function setWidthVar(width: number) {
  document.documentElement.style.setProperty('--file-tree-width', `${width}px`)
}

export function useFileTreeResizeCssVars() {
  useEffect(() => {
    initFileTreeResizeCssVars()
    applyVisualState()
  }, [])

  const getInitialSize = useCallback(() => {
    const root = document.documentElement
    const computedWidth = parseFloat(getComputedStyle(root).getPropertyValue('--file-tree-width')) || DEFAULT_WIDTH
    return clampWidth(computedWidth)
  }, [])

  const { handleMouseDown } = useResizable({
    initialSize: DEFAULT_WIDTH,
    getInitialSize,
    minSize: MIN_WIDTH,
    maxSize: MAX_WIDTH,
    onSizeChange: (width: number) => setWidthVar(width),
    onSizeCommit: (width: number) => {
      window.localStorage.setItem(STORAGE_KEY, String(width))
    },
    direction: 'right',
    onDragStart: () => {
      const state = getResizeState()
      state.dragging = true
      applyVisualState()
    },
    onDragEnd: () => {
      const state = getResizeState()
      state.dragging = false
      applyVisualState()
    },
  })

  const onMouseEnter = useCallback(() => {
    const state = getResizeState()
    state.hoverCount += 1
    applyVisualState()
  }, [])

  const onMouseLeave = useCallback(() => {
    const state = getResizeState()
    state.hoverCount = Math.max(0, state.hoverCount - 1)
    applyVisualState()
  }, [])

  const handleStyle = { backgroundColor: 'var(--file-tree-handle-bg, transparent)' } as const

  return { onMouseDown: handleMouseDown, onMouseEnter, onMouseLeave, handleStyle }
}
