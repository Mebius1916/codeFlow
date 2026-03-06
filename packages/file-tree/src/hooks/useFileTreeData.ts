import { useState, useMemo, useCallback } from 'react'
import { buildFileTree, type TreeNode } from '../utils/file-tree'

export function useFileTreeData(files: Record<string, string>) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  const fileTree = useMemo(() => {
    const rawTree = buildFileTree(Object.keys(files))

    const mergeState = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((node) => {
        if (node.type === 'folder') {
          const isOpen = expandedFolders[node.path] ?? node.isOpen ?? true
          return {
            ...node,
            isOpen,
            children: node.children ? mergeState(node.children) : [],
          }
        }
        return node
      })
    }

    return mergeState(rawTree)
  }, [files, expandedFolders])

  const handleFolderToggle = useCallback((path: string) => {
    setExpandedFolders((prev: Record<string, boolean>) => ({
      ...prev,
      [path]: !(prev[path] ?? true),
    }))
  }, [])

  return { fileTree, handleFolderToggle }
}
