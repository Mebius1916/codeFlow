import { getWebContainer } from '../runtime/runtime'
import { ensureDirectories, writeFilesConcurrently } from './fs'

/**
 * 将编辑器内存态文件同步到 WebContainer 虚拟文件系统。
 * 这里不做内容改写，只负责落盘与性能日志。
 */
export async function syncFilesToWebContainer(nextFiles: Record<string, string | Uint8Array>) {
  const webcontainerInstance = getWebContainer()
  if (!webcontainerInstance) return

  const entries = Object.entries(nextFiles)
  if (entries.length === 0) return

  const startAt = performance.now()
  await ensureDirectories(webcontainerInstance, entries.map(([path]) => path))
  const afterDirs = performance.now()
  await writeFilesConcurrently(webcontainerInstance, entries, 8)
  const afterWrite = performance.now()

  console.log(
    `[Preview] sync files=${entries.length} ` +
      `mkdir=${(afterDirs - startAt).toFixed(1)}ms ` +
      `write=${(afterWrite - afterDirs).toFixed(1)}ms`,
  )
}

