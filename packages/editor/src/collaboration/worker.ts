/// <reference lib="webworker" />
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { applySnapshotToDoc, YjsLocalForageProvider } from '@collaborative-editor/yjs-local-forage'
import * as awarenessProtocol from 'y-protocols/awareness'

interface WorkerConfig {
  roomId: string
  wsUrl?: string
  userId: string
  userName?: string
  userColor?: string
  initialFiles?: Record<string, string | Uint8Array>
}

let yDoc: Y.Doc | null = null
let provider: WebsocketProvider | null = null
let persistenceProvider: YjsLocalForageProvider | null = null

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data

  if (type === 'init') {
    const config = payload as WorkerConfig
    if (yDoc) return

    yDoc = new Y.Doc()
    persistenceProvider = new YjsLocalForageProvider(config.roomId, yDoc)
    
    const url = config.wsUrl || `ws://localhost:1234`
    provider = new WebsocketProvider(url, config.roomId, yDoc, {
      connect: true,
    })

    await persistenceProvider.whenSynced
    
    const initialFiles = (config as { initialFiles?: Record<string, string | Uint8Array> }).initialFiles
    if (yDoc.share.size === 0 && initialFiles) {
      applySnapshotToDoc(yDoc, initialFiles)
    }
    
    const update = Y.encodeStateAsUpdate(yDoc)
    self.postMessage({ type: 'update', payload: update })

    yDoc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== 'main-thread') {
        self.postMessage({ type: 'update', payload: update })
      }
    })

    provider.awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
      if (origin === 'main-thread') return

      const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
        provider!.awareness,
        added.concat(updated).concat(removed)
      )
      self.postMessage({ type: 'awareness-update', payload: awarenessUpdate })
    })
    
    provider.on('status', ({ status }: { status: string }) => {
      self.postMessage({ type: 'status', payload: status })
    })

    self.postMessage({ type: 'ready' })
  }

  if (type === 'update') {
    if (yDoc) {
      Y.applyUpdate(yDoc, payload as Uint8Array, 'main-thread')
    }
  }

  if (type === 'awareness-update') {
    if (provider) {
      awarenessProtocol.applyAwarenessUpdate(
        provider.awareness,
        payload as Uint8Array,
        'main-thread'
      )
    }
  }

  if (type === 'destroy') {
    provider?.destroy()
    persistenceProvider?.destroy()
    yDoc?.destroy()
    yDoc = null
    provider = null
    persistenceProvider = null
  }
}
