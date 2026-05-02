import { useState } from 'react'
import { buildFileTree, type TreeNode } from '../utils/fileTree'

const getDefaultOpen = (path: string) => !(path === 'assets' || path.startsWith('assets/'))

export function useFileTreeData(fileKeys: string[]) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  const rawTree = buildFileTree(fileKeys)
  const mergeState = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.map((node) => {
      if (node.type === 'folder') {
        const defaultOpen = getDefaultOpen(node.path)
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
  const fileTree = mergeState(rawTree)

  const handleFolderToggle = (path: string) => {
    const defaultOpen = getDefaultOpen(path)
    setExpandedFolders((prev: Record<string, boolean>) => ({
      ...prev,
      [path]: !(prev[path] ?? defaultOpen),
    }))
  }

  return { fileTree, handleFolderToggle }
}
