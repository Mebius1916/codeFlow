type ResizeState = { hoverCount: number; dragging: boolean }

const STORAGE_KEY = 'codeflow:previewWidth'

export const PREVIEW_MIN_WIDTH = 200
export const PREVIEW_MAX_WIDTH = 800
export const PREVIEW_DEFAULT_WIDTH = 520

function clampWidth(width: number) {
  return Math.max(PREVIEW_MIN_WIDTH, Math.min(PREVIEW_MAX_WIDTH, width))
}

export function initPreviewResizeCssVars() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const persistedWidth = raw ? Number(raw) : Number.NaN
  const width = clampWidth(Number.isFinite(persistedWidth) ? persistedWidth : PREVIEW_DEFAULT_WIDTH)
  const root = document.documentElement
  root.style.setProperty('--preview-panel-width', `${width}px`)
  root.style.setProperty('--preview-panel-border-color', '#2a2f4c')
  root.style.setProperty('--preview-panel-handle-bg', 'transparent')
  root.style.setProperty('--preview-panel-active-bg', 'transparent')
}

function getResizeState(): ResizeState {
  const w = window as unknown as { __codeFlowPreviewResizeState?: ResizeState }
  if (!w.__codeFlowPreviewResizeState) {
    w.__codeFlowPreviewResizeState = { hoverCount: 0, dragging: false }
  }
  return w.__codeFlowPreviewResizeState
}

export function getPreviewResizeInitialSize() {
  const root = document.documentElement
  const computedWidth =
    parseFloat(getComputedStyle(root).getPropertyValue('--preview-panel-width')) || PREVIEW_DEFAULT_WIDTH
  return clampWidth(computedWidth)
}

export function applyPreviewResizeVisualState() {
  const root = document.documentElement
  const { hoverCount, dragging } = getResizeState()

  if (dragging) {
    root.style.setProperty('--preview-panel-border-color', 'rgba(59, 130, 246, 0.5)')
    root.style.setProperty('--preview-panel-handle-bg', 'rgba(59, 130, 246, 0.5)')
    root.style.setProperty('--preview-panel-active-bg', 'rgba(59, 130, 246, 0.1)')
    return
  }

  if (hoverCount > 0) {
    root.style.setProperty('--preview-panel-border-color', 'rgba(59, 130, 246, 0.3)')
    root.style.setProperty('--preview-panel-handle-bg', 'rgba(59, 130, 246, 0.3)')
    root.style.setProperty('--preview-panel-active-bg', 'transparent')
    return
  }

  root.style.setProperty('--preview-panel-border-color', '#2a2f4c')
  root.style.setProperty('--preview-panel-handle-bg', 'transparent')
  root.style.setProperty('--preview-panel-active-bg', 'transparent')
}

export function setPreviewWidthVar(width: number) {
  document.documentElement.style.setProperty('--preview-panel-width', `${width}px`)
}

export function commitPreviewWidth(width: number) {
  window.localStorage.setItem(STORAGE_KEY, String(clampWidth(width)))
}

export function enterPreviewResizeHover() {
  const state = getResizeState()
  state.hoverCount += 1
  applyPreviewResizeVisualState()
}

export function leavePreviewResizeHover() {
  const state = getResizeState()
  state.hoverCount = Math.max(0, state.hoverCount - 1)
  applyPreviewResizeVisualState()
}

export function startPreviewResizeDrag() {
  const state = getResizeState()
  state.dragging = true
  applyPreviewResizeVisualState()
}

export function endPreviewResizeDrag() {
  const state = getResizeState()
  state.dragging = false
  applyPreviewResizeVisualState()
}
