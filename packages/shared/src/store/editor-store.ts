import { create } from 'zustand'
import type { StateCreator } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import localforage from 'localforage'

interface EditorState {
  roomId: string
  activeFile: string | null
  openFiles: string[]
  files: Record<string, string | Uint8Array>

  setRoomId: (roomId: string) => void
  openFile: (path: string) => void
  closeFile: (path: string) => void
  updateFileContent: (path: string, content: string | Uint8Array) => void
  addFile: (path: string, content: string | Uint8Array) => void
  deleteFile: (path: string) => void
  renameFile: (oldPath: string, newPath: string) => void
  initializeFiles: (files: Record<string, string | Uint8Array>) => void
}

const createEditorState: StateCreator<EditorState> = (set, get) => ({
      roomId: '',
      activeFile: null, // 激活文件的路径
      openFiles: [], // 打开的文件路径列表
      files: {}, // 所有文件的内容

      setRoomId: (roomId: string) => {
        set({ roomId })
      },

      initializeFiles: (files: Record<string, string | Uint8Array>) => {
        set({ files })
      },

      openFile: (path: string) => {
        const { openFiles } = get()
        const nextOpenFiles = openFiles.includes(path) ? openFiles : [...openFiles, path]
        set({ openFiles: nextOpenFiles, activeFile: path })
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

        set({ openFiles: newOpenFiles, activeFile: newActiveFile })
      },

      // 更新文件内容
      updateFileContent: (path: string, content: string | Uint8Array) => {
        const { files } = get()
        const newFiles = { ...files, [path]: content }
        set({ files: newFiles })
      },

      addFile: (path: string, content: string | Uint8Array = '') => {
        const { files } = get()
        const newFiles = { ...files, [path]: content }
        set({ files: newFiles })
      },

      deleteFile: (path: string) => {
        const { openFiles, activeFile, files } = get()
        const newOpenFiles = openFiles.filter((filePath) => filePath !== path)
        const { [path]: deleted, ...newFiles } = files
        
        let newActiveFile = activeFile
        const wasActive = activeFile === path

        if (wasActive) {
          newActiveFile = newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null
        }

        set({
          openFiles: newOpenFiles,
          activeFile: newActiveFile,
          files: newFiles
        })
      },

      renameFile: (oldPath: string, newPath: string) => {
        const { openFiles, activeFile, files } = get()
        if (!files[oldPath]) return

        const newOpenFiles = openFiles.map((filePath) => (filePath === oldPath ? newPath : filePath))
        const newActiveFile = activeFile === oldPath ? newPath : activeFile
        
        const content = files[oldPath]
        const { [oldPath]: deleted, ...restFiles } = files
        const newFiles = { ...restFiles, [newPath]: content }

        set({
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
