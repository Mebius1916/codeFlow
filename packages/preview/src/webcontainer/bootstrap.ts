import { ensureDirectories, writeFilesConcurrently } from './fs'
import { spawnServer } from './server'
import { ensureWebContainer, publishLog } from './runtime'
import { createServerScript } from './create-server'
type FileContent = string | Uint8Array

let serverStartPromise: Promise<void> | null = null

export async function ensurePreviewServer(getFiles: () => Record<string, FileContent>) {
  if (serverStartPromise) return serverStartPromise

  serverStartPromise = (async () => {
    console.log('[PreviewBootstrap] start')
    const instance = await ensureWebContainer()
    const files = getFiles()
    const entries = Object.entries(files)

    const entryPoint = resolveEntryPointFromFiles(files)
    console.log('[PreviewBootstrap] entry', entryPoint, 'fileCount', entries.length)

    const serverScript = buildServerScript(files)
    console.log('[PreviewBootstrap] write server.js')
    await instance.fs.writeFile('server.js', serverScript)
    console.log('[PreviewBootstrap] ensureDirectories')
    await ensureDirectories(instance, entries.map(([path]) => path))
    console.log('[PreviewBootstrap] writeFilesConcurrently')
    await writeFilesConcurrently(instance, entries, 8)

    publishLog('Starting server process...')
    console.log('[PreviewBootstrap] spawn server')
    await spawnServer(instance, {
      onOutput: (data) => publishLog(`[Server] ${data}`),
    })
    console.log('[PreviewBootstrap] done')
  })().catch((e) => {
    serverStartPromise = null
    throw e
  })

  return serverStartPromise
}

export async function ensureServerScriptUpdated(getFiles: () => Record<string, FileContent>) {
  const instance = await ensureWebContainer()
  console.log('[PreviewBootstrap] update server.js')
  const serverScript = buildServerScript(getFiles())
  await instance.fs.writeFile('server.js', serverScript)
}

function buildServerScript(files: Record<string, FileContent>) {
  return createServerScript(resolveEntryPointFromFiles(files))
}

function resolveEntryPointFromFiles(files: Record<string, FileContent>) {
  return files['src/index.html'] != null ? './src/index.html' : null
}
