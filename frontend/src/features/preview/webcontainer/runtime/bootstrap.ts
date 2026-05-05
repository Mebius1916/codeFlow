import { createServerScript } from '../server/createServer'
import { spawnServer } from '../server/server'
import { ensureWebContainer, getLastPreviewUrl, publishLog, subscribeServerReady } from './runtime'

let serverStartPromise: Promise<void> | null = null

function waitForServerReady() {
  const existingUrl = getLastPreviewUrl()
  if (existingUrl) return Promise.resolve(existingUrl)
  return new Promise<string>((resolve) => {
    const unsubscribe = subscribeServerReady((url) => {
      unsubscribe()
      resolve(url)
    })
  })
}

export async function ensurePreviewServer() {
  if (serverStartPromise) return serverStartPromise

  serverStartPromise = (async () => {
    const startAt = performance.now()
    const instance = await ensureWebContainer()
    const afterBoot = performance.now()
    const serverScript = createServerScript()
    const beforeWriteServer = performance.now()
    await instance.fs.writeFile('server.js', serverScript)
    const afterWriteServer = performance.now()

    publishLog('Starting server process...')
    const beforeSpawn = performance.now()
    await spawnServer(instance, {
      onOutput: (data) => publishLog(`[Server] ${data}`),
    })
    await waitForServerReady()
    const afterSpawn = performance.now()
    const timingLog =
      `[Preview][Timing] boot=${(afterBoot - startAt).toFixed(1)}ms ` +
      `writeServer=${(afterWriteServer - beforeWriteServer).toFixed(1)}ms ` +
      `spawn=${(afterSpawn - beforeSpawn).toFixed(1)}ms`

    console.log(timingLog)
    publishLog(timingLog)
  })().catch((e) => {
    serverStartPromise = null
    throw e
  })

  return serverStartPromise
}
