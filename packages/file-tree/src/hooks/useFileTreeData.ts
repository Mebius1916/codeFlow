import { useState, useMemo, useCallback } from 'react'
import { buildFileTree, type TreeNode } from '../utils/file-tree'

export function useFileTreeData(fileKeys: string[]) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  const fileTree = useMemo(() => {
    const rawTree = buildFileTree(fileKeys)

    const mergeState = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((node) => {
        if (node.type === 'folder') {
          const isAssetsOrChild = node.path === 'assets' || node.path.startsWith('assets/')
          const defaultOpen = !isAssetsOrChild
          const isOpen = expandedFolders[node.path] ?? node.isOpen ?? defaultOpen
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
  }, [fileKeys, expandedFolders])

  const handleFolderToggle = useCallback((path: string) => {
    setExpandedFolders((prev: Record<string, boolean>) => ({
      ...prev,
      [path]: !(prev[path] ?? true),
    }))
  }, [])

  return { fileTree, handleFolderToggle }
}
