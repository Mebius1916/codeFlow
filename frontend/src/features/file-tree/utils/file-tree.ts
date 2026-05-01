export interface TreeNode {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  children?: TreeNode[]
  isOpen?: boolean
}

export function buildFileTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = []

  const sortedPaths = [...paths].sort()

  for (const path of sortedPaths) {
    const parts = path.split('/')
    let currentLevel = root
    let currentPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      currentPath = currentPath ? `${currentPath}/${part}` : part

      let node = currentLevel.find((item) => item.name === part)

      if (!node) {
        node = {
          id: currentPath,
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        }
        currentLevel.push(node)
      }

      if (!isFile && node.children) {
        currentLevel = node.children
      }
    }
  }

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'folder' ? -1 : 1
    })
    nodes.forEach((node) => {
      if (node.children) sortNodes(node.children)
    })
  }

  sortNodes(root)
  return root
}

