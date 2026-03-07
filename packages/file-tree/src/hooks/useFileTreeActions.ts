import { useState, useCallback } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useEditorStore, useShallow } from '@collaborative-editor/shared'

export function useFileTreeActions() {
  const { addFile, openFile, deleteFile, renameFile } = useEditorStore(
    useShallow((state) => ({
      addFile: state.addFile,
      openFile: state.openFile,
      deleteFile: state.deleteFile,
      renameFile: state.renameFile,
    }))
  )

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    path: string | null
    type: 'file' | 'folder'
  } | null>(null)

  const [creatingState, setCreatingState] = useState<{
    parentPath: string | null
    type: 'file' | 'folder'
  } | null>(null)

  const [renamingState, setRenamingState] = useState<{
    path: string
    type: 'file' | 'folder'
  } | null>(null)

  const handleContextMenu = useCallback(
    (e: ReactMouseEvent, path: string | null, type: 'file' | 'folder' = 'folder') => {
      e.preventDefault()
      e.stopPropagation()
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        path,
        type,
      })
    },
    [],
  )

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleStartCreate = (parentPath: string | null, type: 'file' | 'folder') => {
    let targetParentPath = parentPath

    if (contextMenu?.type === 'file' && parentPath) {
      const parts = parentPath.split('/')
      targetParentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : null
    }

    setCreatingState({
      parentPath: targetParentPath,
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

  const handleStartRename = () => {
    if (contextMenu?.path) {
      setRenamingState({
        path: contextMenu.path,
        type: contextMenu.type,
      })
    }
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
      const files = useEditorStore.getState().files
      Object.keys(files).forEach((file) => {
        if (file.startsWith(oldPath + '/')) {
          const fileNewPath = file.replace(oldPath, newPath)
          renameFile(file, fileNewPath)
        }
      })
    }
    setRenamingState(null)
  }

  const handleDelete = () => {
    if (!contextMenu?.path) return

    const path = contextMenu.path

    if (contextMenu.type === 'file') {
      deleteFile(path)
      return
    }

    const files = useEditorStore.getState().files
    Object.keys(files).forEach((file) => {
      if (file.startsWith(path + '/')) {
        deleteFile(file)
      }
    })
  }

  return {
    contextMenu,
    creatingState,
    renamingState,
    handleContextMenu,
    closeContextMenu,
    handleStartCreate,
    handleConfirmCreate,
    handleCancelCreate,
    handleStartRename,
    handleConfirmRename,
    handleDelete,
    setRenamingState,
  }
}
