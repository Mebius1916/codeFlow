// UI 状态存储
import { create } from 'zustand'

interface UiState {
  // 状态
  isTerminalVisible: boolean
  theme: 'light' | 'dark'
  terminalHeight: number
  
  // 动作
  toggleTerminal: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setTerminalHeight: (height: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  // 初始状态
  isTerminalVisible: true,
  theme: 'dark',
  terminalHeight: 200,

  // 切换终端
  toggleTerminal: () => {
    set((state) => ({ isTerminalVisible: !state.isTerminalVisible }))
  },

  // 设置主题
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme })
  },

  // 设置终端高度
  setTerminalHeight: (height: number) => {
    set({ terminalHeight: Math.max(150, Math.min(500, height)) })
  },
}))

