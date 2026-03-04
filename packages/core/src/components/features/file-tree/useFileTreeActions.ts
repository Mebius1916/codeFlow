import { useState, useCallback } from 'react'
import { useEditorStore } from '../../../lib/store'

export function useFileTreeActions() {
  const { files, addFile, openFile, deleteFile, renameFile } = useEditorStore()

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    path: string | null
    type: 'file' | 'folder'
  } | null>(null)

  // 新建文件/文件夹状态
  const [creatingState, setCreatingState] = useState<{
    parentPath: string | null
    type: 'file' | 'folder'
  } | null>(null)

  // 重命名状态
  const [renamingState, setRenamingState] = useState<{
    path: string
    type: 'file' | 'folder'
  } | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent, path: string | null, type: 'file' | 'folder' = 'folder') => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path,
      type
    })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  // 开始新建
  const handleStartCreate = (parentPath: string | null, type: 'file' | 'folder') => {
    // 如果是在文件上右键，使用其父目录作为父路径
    let targetParentPath = parentPath
    
    // 如果是文件，找到父目录
    if (contextMenu?.type === 'file' && parentPath) {
      const parts = parentPath.split('/')
      targetParentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : null
    }

    setCreatingState({
      parentPath: targetParentPath,
      type
    })
  }

  // 确认新建
  const handleConfirmCreate = (name: string) => {
    if (!creatingState) return
    
    const parentPath = creatingState.parentPath
    const filePath = parentPath ? `${parentPath}/${name}` : name
    
    if (creatingState.type === 'folder') {
      // 创建文件夹：添加 .keep 文件
      addFile(`${filePath}/.keep`, '')
    } else {
      // 创建文件
      addFile(filePath, '')
      openFile(filePath)
    }
    setCreatingState(null)
  }

  // 取消新建
  const handleCancelCreate = () => {
    setCreatingState(null)
  }

  // 开始重命名
  const handleStartRename = () => {
    if (contextMenu?.path) {
      setRenamingState({
        path: contextMenu.path,
        type: contextMenu.type
      })
    }
  }

  // 确认重命名
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
      // 文件夹重命名：批量处理所有子文件
      Object.keys(files).forEach(file => {
        if (file.startsWith(oldPath + '/')) {
          const fileNewPath = file.replace(oldPath, newPath)
          renameFile(file, fileNewPath)
        }
      })
    }
    setRenamingState(null)
  }

  // 删除
  const handleDelete = () => {
    if (!contextMenu?.path) return
    
    const path = contextMenu.path

    if (contextMenu.type === 'file') {
      deleteFile(path)
      return
    }

    // 文件夹删除：批量删除所有子文件
    Object.keys(files).forEach(file => {
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
    setRenamingState
  }
}
