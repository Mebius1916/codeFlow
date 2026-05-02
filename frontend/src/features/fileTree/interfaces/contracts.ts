export interface FileTreeNodeData {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileTreeNodeData[]
  isOpen?: boolean
}
