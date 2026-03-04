export interface TreeNode {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  children?: TreeNode[]
  isOpen?: boolean // 文件夹是否展开
}

/**
 * 将扁平的文件路径列表转换为树形结构
 * 例如：['src/main.js', 'src/components/App.tsx'] -> TreeNode
 */
export function buildFileTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = []
  
  // 1. 先按路径排序，保证文件夹在前（可选，但更美观）
  const sortedPaths = [...paths].sort()

  for (const path of sortedPaths) {
    const parts = path.split('/')
    let currentLevel = root
    let currentPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      currentPath = currentPath ? `${currentPath}/${part}` : part
      
      // 查找当前层级是否已存在该节点
      let node = currentLevel.find(n => n.name === part)

      if (!node) {
        node = {
          id: currentPath,
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          isOpen: true // 默认展开所有文件夹
        }
        currentLevel.push(node)
      }

      if (!isFile && node.children) {
        currentLevel = node.children
      }
    }
  }

  // 递归排序：文件夹在前，文件在后
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'folder' ? -1 : 1
    })
    nodes.forEach(node => {
      if (node.children) sortNodes(node.children)
    })
  }
  
  sortNodes(root)
  return root
}
