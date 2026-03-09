import { create } from 'zustand'
import type { StateCreator } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import localforage from 'localforage'

interface EditorState {
  activeFile: string | null
  openFiles: string[]
  fileIndex: string[]
  activeContent: string | Uint8Array | null
  files: Record<string, string | Uint8Array>

  openFile: (path: string) => void
  closeFile: (path: string) => void
  updateFileContent: (path: string, content: string | Uint8Array) => void
  addFile: (path: string, content: string | Uint8Array) => void
  deleteFile: (path: string) => void
  renameFile: (oldPath: string, newPath: string) => void
  initializeFiles: (files: Record<string, string | Uint8Array>) => void
}

const createEditorState: StateCreator<EditorState> = (set, get) => ({
      activeFile: null, // 激活文件的路径
      openFiles: [], // 打开的文件路径列表
      fileIndex: [], // 所有文件路径列表
      activeContent: null, // 激活文件的内容
      files: {}, // 所有文件的内容

      initializeFiles: (files: Record<string, string | Uint8Array>) => {
        const { activeFile } = get()
        const fileIndex = Object.keys(files) // 拿到所有键名
        const activeContent = activeFile ? files[activeFile] ?? null : null // 拿到激活文件的内容
        set({ fileIndex, activeContent, files })
      },

      openFile: (path: string) => {
        const { openFiles, files } = get()
        const nextOpenFiles = openFiles.includes(path) ? openFiles : [...openFiles, path]
        const activeContent = files[path] ?? null
        set({ openFiles: nextOpenFiles, activeFile: path, activeContent })
      },

      closeFile: (path: string) => {
        const { openFiles, activeFile } = get()
        const newOpenFiles = openFiles.filter((filePath) => filePath !== path)

        let newActiveFile = activeFile
        if (activeFile === path) {
          const index = openFiles.indexOf(path)
          if (newOpenFiles.length > 0) {
            newActiveFile = newOpenFiles[index - 1] || newOpenFiles[index] || newOpenFiles[0]
          } else {
            newActiveFile = null
          }
        }

        const nextActiveContent = newActiveFile ? get().files[newActiveFile] ?? null : null
        set({ openFiles: newOpenFiles, activeFile: newActiveFile, activeContent: nextActiveContent })
      },

      // 更新文件内容
      updateFileContent: (path: string, content: string | Uint8Array) => {
        const { activeFile, files } = get()
        const newFiles = { ...files, [path]: content }
        
        if (path === activeFile) {
           set({ activeContent: content, files: newFiles })
        } else {
           set({ files: newFiles })
        }
      },

      addFile: (path: string, content: string | Uint8Array = '') => {
        const { activeFile, fileIndex, files } = get()
        const nextIndex = fileIndex.includes(path) ? fileIndex : [...fileIndex, path]
        const newFiles = { ...files, [path]: content }
        
        if (activeFile === path) {
          set({ activeContent: content, fileIndex: nextIndex, files: newFiles })
          return
        }
        set({ fileIndex: nextIndex, files: newFiles })
      },

      deleteFile: (path: string) => {
        const { fileIndex, openFiles, activeFile, files } = get()
        const nextIndex = fileIndex.filter((filePath) => filePath !== path)
        const newOpenFiles = openFiles.filter((filePath) => filePath !== path)
        const { [path]: deleted, ...newFiles } = files
        
        let newActiveFile = activeFile
        const wasActive = activeFile === path

        if (wasActive) {
          newActiveFile = newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null
        }

        const nextActiveContent = newActiveFile ? newFiles[newActiveFile] ?? null : null

        set({
          fileIndex: nextIndex,
          openFiles: newOpenFiles,
          activeFile: newActiveFile,
          activeContent: nextActiveContent,
          files: newFiles
        })
      },

      renameFile: (oldPath: string, newPath: string) => {
        const { fileIndex, openFiles, activeFile, files } = get()
        if (!fileIndex.includes(oldPath)) return
        
        const nextIndex = fileIndex.map((filePath) => (filePath === oldPath ? newPath : filePath))
        const newOpenFiles = openFiles.map((filePath) => (filePath === oldPath ? newPath : filePath))
        const newActiveFile = activeFile === oldPath ? newPath : activeFile
        
        const content = files[oldPath]
        const { [oldPath]: deleted, ...restFiles } = files
        const newFiles = { ...restFiles, [newPath]: content }

        set({
          fileIndex: nextIndex,
          openFiles: newOpenFiles,
          activeFile: newActiveFile,
          files: newFiles,
          // activeContent stays same as content didn't change, just name
        })
      },
    })

const storage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    const value = await localforage.getItem<string>(name)
    return value ?? null
  },
  setItem: async (name: string, value: string) => {
    await localforage.setItem(name, value)
  },
  removeItem: async (name: string) => {
    await localforage.removeItem(name)
  },
}))

export const useEditorStore = create<EditorState>()(
  persist(createEditorState, {
    name: 'code-editor-storage',
    storage,
    partialize: (state) => ({
        activeFile: state.activeFile,
        openFiles: state.openFiles,
        // files: state.files, // Removed: handled by Yjs to avoid double storage & performance issues
      }),
  }),
)
