import { create } from 'zustand'
import type { StateCreator } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface EditorState {
  activeFile: string | null
  openFiles: string[]
  files: Record<string, string>

  openFile: (path: string) => void
  closeFile: (path: string) => void
  updateFileContent: (path: string, content: string) => void
  addFile: (path: string, content: string) => void
  deleteFile: (path: string) => void
  renameFile: (oldPath: string, newPath: string) => void
}

const createEditorState: StateCreator<EditorState> = (set, get) => ({
      activeFile: null,
      openFiles: [],
      files: {},

      openFile: (path: string) => {
        const { openFiles } = get()
        if (!openFiles.includes(path)) {
          set({ openFiles: [...openFiles, path], activeFile: path })
        } else {
          set({ activeFile: path })
        }
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

      updateFileContent: (path: string, content: string) => {
        const { files } = get()
        set({
          files: { ...files, [path]: content },
        })
      },

      addFile: (path: string, content: string = '') => {
        const { files } = get()
        set({ files: { ...files, [path]: content } })
      },

      deleteFile: (path: string) => {
        const { files, openFiles, activeFile } = get()
        const newFiles = { ...files }
        delete newFiles[path]

        const newOpenFiles = openFiles.filter((filePath) => filePath !== path)
        let newActiveFile = activeFile

        if (activeFile === path) {
          newActiveFile = newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null
        }

        set({
          files: newFiles,
          openFiles: newOpenFiles,
          activeFile: newActiveFile,
        })
      },

      renameFile: (oldPath: string, newPath: string) => {
        const { files, openFiles, activeFile } = get()
        const content = files[oldPath]

        if (content === undefined) return

        const newFiles = { ...files }
        delete newFiles[oldPath]
        newFiles[newPath] = content

        const newOpenFiles = openFiles.map((filePath) => (filePath === oldPath ? newPath : filePath))
        const newActiveFile = activeFile === oldPath ? newPath : activeFile

        set({
          files: newFiles,
          openFiles: newOpenFiles,
          activeFile: newActiveFile,
        })
      },
    })

export const useEditorStore = create<EditorState>()(
  persist(createEditorState, {
    name: 'code-editor-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      activeFile: state.activeFile,
      openFiles: state.openFiles,
    }),
  }),
)
