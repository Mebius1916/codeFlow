// webcontainer 运行时状态存储
import { create } from 'zustand'
import type { WebContainer } from '@webcontainer/api'
import type { TerminalOutput, ProcessInfo } from '../../types/webcontainer'

interface RuntimeState {
  // 状态
  container: WebContainer | null
  isBooting: boolean
  terminalOutput: TerminalOutput[]
  currentProcess: ProcessInfo | null
  
  // 动作
  setContainer: (container: WebContainer) => void
  setBooting: (isBooting: boolean) => void
  addTerminalOutput: (output: Omit<TerminalOutput, 'id' | 'timestamp'>) => void
  clearTerminal: () => void
  setCurrentProcess: (process: ProcessInfo | null) => void
}

const MAX_TERMINAL_LINES = 1000

export const useRuntimeStore = create<RuntimeState>((set) => ({
  // 初始状态
  container: null,
  isBooting: false,
  terminalOutput: [],
  currentProcess: null,

  // 设置容器
  setContainer: (container: WebContainer) => {
    set({ container })
  },

  // 设置启动状态
  setBooting: (isBooting: boolean) => {
    set({ isBooting })
  },

  // 添加终端输出
  addTerminalOutput: (output) => {
    set((state) => {
      const newOutput: TerminalOutput = {
        ...output,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      }
      
      const allOutput = [...state.terminalOutput, newOutput]
      
      // 限制输出行数
      if (allOutput.length > MAX_TERMINAL_LINES) {
        return { terminalOutput: allOutput.slice(-MAX_TERMINAL_LINES) }
      }
      
      return { terminalOutput: allOutput }
    })
  },

  // 清空终端
  clearTerminal: () => {
    set({ terminalOutput: [] })
  },

  // 设置当前进程
  setCurrentProcess: (process: ProcessInfo | null) => {
    set({ currentProcess: process })
  },
}))

