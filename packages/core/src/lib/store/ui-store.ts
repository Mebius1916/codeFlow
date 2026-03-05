// UI 状态存储
import { create } from 'zustand'

interface UiState {
  // 状态
  theme: 'light' | 'dark'
  terminalHeight: number
  fileTreeWidth: number
  previewWidth: number
  
  // 动作
  setTheme: (theme: 'light' | 'dark') => void
  setTerminalHeight: (height: number) => void
  setFileTreeWidth: (width: number) => void
  setPreviewWidth: (width: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  // 初始状态
  theme: 'dark',
  terminalHeight: 200,
  fileTreeWidth: 240,
  previewWidth: 400,

  // 设置主题
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme })
  },

  // 设置终端高度
  setTerminalHeight: (height: number) => {
    set({ terminalHeight: Math.max(150, Math.min(500, height)) })
  },

  // 设置文件树宽度
  setFileTreeWidth: (width: number) => {
    set({ fileTreeWidth: Math.max(150, Math.min(400, width)) })
  },

  // 设置预览面板宽度
  setPreviewWidth: (width: number) => {
    set({ previewWidth: Math.max(200, Math.min(800, width)) })
  },
}))

