import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import localforage from 'localforage'

type PreviewContentSize = { width: number; height: number }

interface UiState {
  theme: 'light' | 'dark'
  terminalHeight: number
  fileTreeWidth: number
  previewWidth: number
  fileTreeResizing: boolean
  fileTreeResizeHover: boolean
  previewContentSize: PreviewContentSize | null

  setTheme: (theme: 'light' | 'dark') => void
  setTerminalHeight: (height: number) => void
  setFileTreeWidth: (width: number) => void
  setPreviewWidth: (width: number) => void
  setFileTreeResizing: (isResizing: boolean) => void
  setFileTreeResizeHover: (isHover: boolean) => void
  setPreviewContentSize: (size: PreviewContentSize | null) => void
}

type SetState<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean
) => void

// 创建一个 localforage 实例专门用于 UI store
const uiStorage = localforage.createInstance({
  name: 'codeflow-ui-store',
})

export const useUiStore = create<UiState>()(
  persist(
    (set: SetState<UiState>) => ({
      theme: 'dark',
      terminalHeight: 200,
      fileTreeWidth: 250,
      previewWidth: 520,
      fileTreeResizing: false,
      fileTreeResizeHover: false,
      previewContentSize: null,

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

      setPreviewContentSize: (size: PreviewContentSize | null) => {
        set({ previewContentSize: size })
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => uiStorage),
      // 只持久化部分字段，避免无关状态干扰
      partialize: (state) => ({
        theme: state.theme,
        terminalHeight: state.terminalHeight,
        fileTreeWidth: state.fileTreeWidth,
        previewWidth: state.previewWidth,
        previewContentSize: state.previewContentSize,
      }),
    }
  )
)
