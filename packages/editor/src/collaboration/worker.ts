import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { YjsLocalForageProvider } from '@collaborative-editor/yjs-local-forage'
import * as awarenessProtocol from 'y-protocols/awareness'

interface WorkerConfig {
  roomId: string
  wsUrl?: string
}

let yDoc: Y.Doc | null = null
let provider: WebsocketProvider | null = null
let persistenceProvider: YjsLocalForageProvider | null = null

const ctx = self as any

ctx.addEventListener('message', async (e: MessageEvent) => {
  const { type, payload } = e.data

  if (type === 'init') {
    if (yDoc) return
    const config = payload as WorkerConfig
    yDoc = new Y.Doc()

    const url = config.wsUrl || 'ws://localhost:1234'
    provider = new WebsocketProvider(url, config.roomId, yDoc, { connect: true })

    persistenceProvider = new YjsLocalForageProvider(config.roomId, yDoc)
    
    await persistenceProvider.init();

    await new Promise<void>((resolve) => {
      const handler = (isSynced: boolean) => {
        if (!isSynced) return
        provider?.off('sync', handler)
        resolve()
      }
      provider?.on('sync', handler)
    })

    const update = Y.encodeStateAsUpdate(yDoc)
    ctx.postMessage({ type: 'update', payload: update })

    yDoc.on('update', (nextUpdate: Uint8Array, origin: any) => {
      if (origin === 'main') return
      ctx.postMessage({ type: 'update', payload: nextUpdate })
    })

    provider.awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
      if (origin === 'main') return
      const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
        provider!.awareness,
        added.concat(updated).concat(removed)
      )
      ctx.postMessage({ type: 'awareness-update', payload: awarenessUpdate })
    })

    provider.on('status', ({ status }: { status: string }) => {
      ctx.postMessage({ type: 'status', payload: status })
    })

    ctx.postMessage({ type: 'ready' })
    return
  }

  if (type === 'update') {
    if (yDoc) {
      Y.applyUpdate(yDoc, payload as Uint8Array, 'main')
    }
    return
  }

  if (type === 'awareness-update') {
    if (provider) {
      awarenessProtocol.applyAwarenessUpdate(
        provider.awareness,
        payload as Uint8Array,
        'main'
      )
    }
    return
  }

  if (type === 'destroy') {
    provider?.destroy()
    persistenceProvider?.destroy()
    yDoc?.destroy()
    provider = null
    persistenceProvider = null
    yDoc = null
  }
})
