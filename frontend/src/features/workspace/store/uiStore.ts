import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import localforage from 'localforage'

interface PreviewContentSize {
  width: number
  height: number
}

interface UiState {
  theme: 'light' | 'dark'
  terminalHeight: number
  fileTreeWidth: number
  previewWidth: number
  fileTreeResizing: boolean
  fileTreeResizeHover: boolean
  previewContentSize: PreviewContentSize | null
  modelApiEndpoint: string
  modelApiKey: string
  aiEnhance: boolean
  figmaToken: string
  algorithmOptions: Record<string, unknown>

  setTheme: (theme: 'light' | 'dark') => void
  setTerminalHeight: (height: number) => void
  setFileTreeWidth: (width: number) => void
  setPreviewWidth: (width: number) => void
  setFileTreeResizing: (isResizing: boolean) => void
  setFileTreeResizeHover: (isHover: boolean) => void
  setPreviewContentSize: (size: PreviewContentSize | null) => void
  setModelApiEndpoint: (endpoint: string) => void
  setModelApiKey: (key: string) => void
  setAiEnhance: (enabled: boolean) => void
  setFigmaToken: (token: string) => void
  setAlgorithmOptions: (next: Record<string, unknown>) => void
}

type SetState<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean
) => void

// 创建一个 localforage 实例专门用于 UI store
const uiStorage = localforage.createInstance({
  name: 'codeflow-uiStore',
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
      modelApiEndpoint: '',
      modelApiKey: '',
      aiEnhance: true,
      figmaToken: '',
      algorithmOptions: {},

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

      setModelApiEndpoint: (endpoint: string) => {
        set({ modelApiEndpoint: endpoint })
      },

      setModelApiKey: (key: string) => {
        set({ modelApiKey: key })
      },

      setAiEnhance: (enabled: boolean) => {
        set({ aiEnhance: enabled })
      },

      setFigmaToken: (token: string) => {
        set({ figmaToken: token })
      },

      setAlgorithmOptions: (next: Record<string, unknown>) => {
        set({ algorithmOptions: next })
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
        modelApiEndpoint: state.modelApiEndpoint,
        modelApiKey: state.modelApiKey,
        aiEnhance: state.aiEnhance,
        figmaToken: state.figmaToken,
        algorithmOptions: state.algorithmOptions,
      }),
    }
  )
)
