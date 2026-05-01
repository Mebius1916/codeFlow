import type { WebContainer } from '@webcontainer/api'

type FileContent = string | Uint8Array

// 确保文件系统中存在所有目录，递归创建缺失的目录
export async function ensureDirectories(instance: WebContainer, filePaths: string[]) {
  const directories = new Set<string>()
  for (const path of filePaths) {
    const parts = path.split('/')
    if (parts.length <= 1) continue
    let currentPath = ''
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i]
      directories.add(currentPath)
    }
  }

  const sortedDirs = Array.from(directories).sort((a, b) => a.length - b.length)
  for (const dir of sortedDirs) {
    await instance.fs.mkdir(dir, { recursive: true })
  }
}

// 并发写入文件系统，限制并发数为limit
export async function writeFilesConcurrently(
  instance: WebContainer,
  entries: Array<[string, FileContent]>,
  limit: number,
) {
  let index = 0
  const worker = async () => {
    while (index < entries.length) {
      const [path, content] = entries[index]
      index += 1
      await instance.fs.writeFile(path, content)
    }
  }
  const workers = Array.from({ length: Math.min(limit, entries.length) }, worker)
  await Promise.all(workers)
}

export async function writeChangedFiles(
  instance: WebContainer,
  currentFiles: Record<string, FileContent>,
  previousFiles: Record<string, FileContent>,
) {
  const changedEntries: Array<[string, FileContent]> = []
  for (const [path, content] of Object.entries(currentFiles)) {
    if (previousFiles[path] !== content) {
      changedEntries.push([path, content])
    }
  }

  if (changedEntries.length === 0) return

  await ensureDirectories(instance, changedEntries.map(([path]) => path))

  for (const [path, content] of changedEntries) {
    await instance.fs.writeFile(path, content)
    previousFiles[path] = content
  }
}
