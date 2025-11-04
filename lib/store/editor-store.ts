// 编辑器状态存储
import { create } from 'zustand'

interface EditorState {
  // 状态
  activeFile: string | null
  files: Record<string, string>
  
  // 动作
  openFile: (path: string) => void
  updateFileContent: (path: string, content: string) => void
  addFile: (path: string, content: string) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // 初始状态
  activeFile: null,
  files: {},

  // 打开文件（单文件模式：直接设置为激活文件）
  openFile: (path: string) => {
    set({ activeFile: path })
  },

  // 更新文件内容
  updateFileContent: (path: string, content: string) => {
    const { files } = get()
    set({
      files: { ...files, [path]: content },
    })
  },

  // 添加文件
  addFile: (path: string, content: string = '') => {
    const { files } = get()
    set({ files: { ...files, [path]: content } })
  },
}))

