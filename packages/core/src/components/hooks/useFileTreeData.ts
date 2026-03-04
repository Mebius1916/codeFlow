import { useState, useMemo, useCallback } from 'react'
import { buildFileTree, type TreeNode } from '../../lib/utils/file-tree'

export function useFileTreeData(files: Record<string, string>) {
  // 维护文件夹展开状态的本地 Map (path -> boolean)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  // 构建树形结构
  const fileTree = useMemo(() => {
    const rawTree = buildFileTree(Object.keys(files))
    
    // 递归注入展开状态
    const mergeState = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.type === 'folder') {
          const isOpen = expandedFolders[node.path] ?? node.isOpen ?? true
          return {
            ...node,
            isOpen,
            children: node.children ? mergeState(node.children) : []
          }
        }
        return node
      })
    }
    
    return mergeState(rawTree)
  }, [files, expandedFolders])

  // 文件夹切换
  const handleFolderToggle = useCallback((path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !(prev[path] ?? true) // 默认为 true，取反
    }))
  }, [])

  return { fileTree, handleFolderToggle }
}
