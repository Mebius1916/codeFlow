import { ensureDirectories, writeFilesConcurrently } from './fs'
import { spawnServer } from './server'
import { ensureWebContainer, publishLog } from './runtime'
import { createServerScript } from './create-server'
type FileContent = string | Uint8Array

let serverStartPromise: Promise<void> | null = null

export async function ensurePreviewServer(files: Record<string, FileContent>) {
  if (serverStartPromise) return serverStartPromise

  serverStartPromise = (async () => {
    const startAt = performance.now()
    const instance = await ensureWebContainer()
    const afterBoot = performance.now()
    const entries = Object.entries(files)
    const serverScript = buildServerScript(files)
    const beforeWriteServer = performance.now()
    await instance.fs.writeFile('server.js', serverScript)
    const afterWriteServer = performance.now()
    const beforeDirs = performance.now()
    await ensureDirectories(instance, entries.map(([path]) => path))
    const afterDirs = performance.now()
    const beforeFiles = performance.now()
    await writeFilesConcurrently(instance, entries, 8)
    const afterFiles = performance.now()

    publishLog('Starting server process...')
    const beforeSpawn = performance.now()
    await spawnServer(instance, {
      onOutput: (data) => publishLog(`[Server] ${data}`),
    })
    const afterSpawn = performance.now()
    const timingLog =
      `[Preview][Timing] boot=${(afterBoot - startAt).toFixed(1)}ms ` +
      `writeServer=${(afterWriteServer - beforeWriteServer).toFixed(1)}ms ` +
      `mkdir=${(afterDirs - beforeDirs).toFixed(1)}ms ` +
      `writeFiles=${(afterFiles - beforeFiles).toFixed(1)}ms ` +
      `spawn=${(afterSpawn - beforeSpawn).toFixed(1)}ms`

    console.log(timingLog)
    publishLog(timingLog)
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
