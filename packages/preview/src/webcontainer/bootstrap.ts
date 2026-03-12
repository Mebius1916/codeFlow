import { ensureDirectories, writeFilesConcurrently } from './fs'
import { spawnServer } from './server'
import { ensureWebContainer, publishLog } from './runtime'
import { createServerScript } from './create-server'
type FileContent = string | Uint8Array

let serverStartPromise: Promise<void> | null = null

export async function ensurePreviewServer(files: Record<string, FileContent>) {
  if (serverStartPromise) return serverStartPromise

  serverStartPromise = (async () => {
    const instance = await ensureWebContainer()
    const entries = Object.entries(files)
    const serverScript = buildServerScript(files)
    await instance.fs.writeFile('server.js', serverScript)
    await ensureDirectories(instance, entries.map(([path]) => path))
    await writeFilesConcurrently(instance, entries, 8)

    publishLog('Starting server process...')
    await spawnServer(instance, {
      onOutput: (data) => publishLog(`[Server] ${data}`),
    })
  })().catch((e) => {
    serverStartPromise = null
    throw e
  })

  return serverStartPromise
}

export async function ensureServerScriptUpdated(files: Record<string, FileContent>) {
  const instance = await ensureWebContainer()
  const serverScript = buildServerScript(files)
  await instance.fs.writeFile('server.js', serverScript)
}

function buildServerScript(files: Record<string, FileContent>) {
  const newFile = files['src/index.html'] != null ? './src/index.html' : null
  return createServerScript(newFile);
}
