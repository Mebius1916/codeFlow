import { create } from 'zustand'

interface UiState {
  theme: 'light' | 'dark'
  terminalHeight: number
  fileTreeWidth: number
  previewWidth: number
  fileTreeResizing: boolean
  fileTreeResizeHover: boolean

  setTheme: (theme: 'light' | 'dark') => void
  setTerminalHeight: (height: number) => void
  setFileTreeWidth: (width: number) => void
  setPreviewWidth: (width: number) => void
  setFileTreeResizing: (isResizing: boolean) => void
  setFileTreeResizeHover: (isHover: boolean) => void
}

type SetState<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean
) => void

export const useUiStore = create<UiState>((set: SetState<UiState>) => ({
  theme: 'dark',
  terminalHeight: 200,
  fileTreeWidth: 250,
  previewWidth: 520,
  fileTreeResizing: false,
  fileTreeResizeHover: false,

  setTheme: (theme: 'light' | 'dark') => {
    set({ theme })
  },

  setTerminalHeight: (height: number) => {
    set({ terminalHeight: Math.max(150, Math.min(500, height)) })
  },

  setFileTreeWidth: (width: number) => {
    set({ fileTreeWidth: Math.max(150, Math.min(400, width)) })
  },

  setPreviewWidth: (width: number) => {
    set({ previewWidth: Math.max(200, Math.min(800, width)) })
  },

  setFileTreeResizing: (isResizing: boolean) => {
    set({ fileTreeResizing: isResizing })
  },

  setFileTreeResizeHover: (isHover: boolean) => {
    set({ fileTreeResizeHover: isHover })
  },
}))
