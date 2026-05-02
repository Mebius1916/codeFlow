import { useState } from 'react'
import { addFile, openFile, renameFile } from '@/features/workspace/services/workspaceService'
import { useEditorStore } from '@/features/workspace/store/editorStore'

export function useFileTreeActions() {
  const [creatingState, setCreatingState] = useState<{
    parentPath: string | null
    type: 'file' | 'folder'
  } | null>(null)

  const [renamingState, setRenamingState] = useState<{
    path: string
    type: 'file' | 'folder'
  } | null>(null)

  const handleStartCreate = (parentPath: string | null, type: 'file' | 'folder') => {
    setCreatingState({
      parentPath,
      type,
    })
  }

  const handleConfirmCreate = (name: string) => {
    if (!creatingState) return

    const parentPath = creatingState.parentPath
    const filePath = parentPath ? `${parentPath}/${name}` : name

    if (creatingState.type === 'folder') {
      addFile(`${filePath}/.keep`, '')
    } else {
      addFile(filePath, '')
      openFile(filePath)
    }
    setCreatingState(null)
  }

  const handleCancelCreate = () => {
    setCreatingState(null)
  }

  const handleConfirmRename = (newName: string) => {
    if (!renamingState) return

    const oldPath = renamingState.path
    const pathParts = oldPath.split('/')
    const parentPath = pathParts.slice(0, -1).join('/')
    const newPath = parentPath ? `${parentPath}/${newName}` : newName

    if (oldPath === newPath) {
      setRenamingState(null)
      return
    }

    if (renamingState.type === 'file') {
      renameFile(oldPath, newPath)
    } else {
      const fileKeys = useEditorStore.getState().fileKeys
      fileKeys.forEach((file) => {
        if (file.startsWith(oldPath + '/')) {
          const fileNewPath = file.replace(oldPath, newPath)
          renameFile(file, fileNewPath)
        }
      })
    }
    setRenamingState(null)
  }

  return {
    creatingState,
    renamingState,
    handleStartCreate,
    handleConfirmCreate,
    handleCancelCreate,
    handleConfirmRename,
    setRenamingState,
  }
}
