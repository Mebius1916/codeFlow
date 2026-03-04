// 编辑器状态存储
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface EditorState {
  // 状态
  activeFile: string | null
  openFiles: string[] // 当前打开的文件列表
  files: Record<string, string>
  
  // 动作
  openFile: (path: string) => void
  closeFile: (path: string) => void
  updateFileContent: (path: string, content: string) => void
  addFile: (path: string, content: string) => void
  deleteFile: (path: string) => void
  renameFile: (oldPath: string, newPath: string) => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      // 初始状态
      activeFile: null,
      openFiles: [],
      files: {},

      // 打开文件
      openFile: (path: string) => {
        const { openFiles } = get()
        // 如果文件不在打开列表中，添加进去
        if (!openFiles.includes(path)) {
          set({ openFiles: [...openFiles, path], activeFile: path })
        } else {
          set({ activeFile: path })
        }
      },

      // 关闭文件
      closeFile: (path: string) => {
        const { openFiles, activeFile } = get()
        const newOpenFiles = openFiles.filter(f => f !== path)
        
        // 如果关闭的是当前激活文件，尝试激活上一个或下一个
        let newActiveFile = activeFile
        if (activeFile === path) {
          const index = openFiles.indexOf(path)
          // 优先激活前一个，如果没有则激活后一个（现在的 index），如果列表空了则为 null
          if (newOpenFiles.length > 0) {
            newActiveFile = newOpenFiles[index - 1] || newOpenFiles[index] || newOpenFiles[0]
          } else {
            newActiveFile = null
          }
        }
        
        set({ openFiles: newOpenFiles, activeFile: newActiveFile })
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

      // 删除文件
      deleteFile: (path: string) => {
        const { files, openFiles, activeFile } = get()
        const newFiles = { ...files }
        delete newFiles[path]
        
        const newOpenFiles = openFiles.filter(f => f !== path)
        let newActiveFile = activeFile
        
        // 如果删除的是当前激活文件，且还有其他文件打开，则切换
        if (activeFile === path) {
          newActiveFile = newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null
        }

        set({ 
          files: newFiles, 
          openFiles: newOpenFiles, 
          activeFile: newActiveFile 
        })
      },

      // 重命名文件
      renameFile: (oldPath: string, newPath: string) => {
        const { files, openFiles, activeFile } = get()
        const content = files[oldPath]
        
        if (content === undefined) return // 文件不存在

        const newFiles = { ...files }
        delete newFiles[oldPath]
        newFiles[newPath] = content

        const newOpenFiles = openFiles.map(f => f === oldPath ? newPath : f)
        const newActiveFile = activeFile === oldPath ? newPath : activeFile

        set({
          files: newFiles,
          openFiles: newOpenFiles,
          activeFile: newActiveFile
        })
      },
    }),
    {
      name: 'code-editor-storage', // localStorage key
      storage: createJSONStorage(() => localStorage), // 默认使用 localStorage
      partialize: (state) => ({ 
        activeFile: state.activeFile,
        openFiles: state.openFiles,
      }), // 持久化 activeFile 和 openFiles
    }
  )
)

