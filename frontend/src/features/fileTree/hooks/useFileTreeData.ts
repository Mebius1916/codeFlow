import { useState } from 'react'
import type { FileTreeNodeData } from '../interfaces/contracts'
import { buildFileTree } from '../utils/fileTree'

export function useFileTreeData(fileKeys: string[]) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  const rawTree = buildFileTree(fileKeys)
  const mergeState = (nodes: FileTreeNodeData[]): FileTreeNodeData[] => {
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
  const fileTree = mergeState(rawTree)

  const handleFolderToggle = (path: string) => {
    setExpandedFolders((prev: Record<string, boolean>) => ({
      ...prev,
      [path]: !(prev[path] ?? true),
    }))
  }

  return { fileTree, handleFolderToggle }
}
