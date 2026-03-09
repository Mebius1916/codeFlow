/// <reference lib="webworker" />
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { YjsLocalForageProvider } from '@collaborative-editor/yjs-local-forage'
import * as awarenessProtocol from 'y-protocols/awareness'

interface WorkerConfig {
  roomId: string
  wsUrl?: string
  userId: string
  userName?: string
  userColor?: string
  initialFiles?: Record<string, string>
}

// 单例模式，确保在所有线程中使用相同的实例，避免重复创建和销毁
let yDoc: Y.Doc | null = null
let provider: WebsocketProvider | null = null
let persistenceProvider: YjsLocalForageProvider | null = null

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data

  if (type === 'init') {
    const config = payload as WorkerConfig
    if (yDoc) return // already initialized

    // 创建 yjs 文档实例
    yDoc = new Y.Doc()
    
    // 初始化 持久化
    persistenceProvider = new YjsLocalForageProvider(config.roomId, yDoc)
    
    // 启动 websocket 连接
    const url = config.wsUrl || `ws://localhost:1234`
    provider = new WebsocketProvider(url, config.roomId, yDoc, {
      connect: true,
    })

    // 初始化
    await persistenceProvider.whenSynced
    
    // 如果是从零开始（无缓存），且有初始文件，则填充
    const initialFiles = (config as { initialFiles?: Record<string, string> }).initialFiles
    if (yDoc.share.size === 0 && initialFiles) {
      yDoc.transact(() => {
        for (const [key, content] of Object.entries(initialFiles)) {
          if (typeof content === 'string') {
            yDoc!.getText(key).insert(0, content)
          }
        }
      })
    }
    
    // yjs 文档初始化
    const update = Y.encodeStateAsUpdate(yDoc)
    self.postMessage({ type: 'update', payload: update })

    // 监听文档更新，将非主线程更新的更新转发到主线程
    yDoc.on('update', (update: Uint8Array, origin: any) => {
      // 只转发非主线程更新的更新到主线程
      if (origin !== 'main-thread') {
        self.postMessage({ type: 'update', payload: update })
      }
    })

    // 监听 光标 更新
    provider.awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
      // Avoid forwarding updates that came from main thread
      if (origin === 'main-thread') return

      const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
        provider!.awareness,
        added.concat(updated).concat(removed)
      )
      self.postMessage({ type: 'awareness-update', payload: awarenessUpdate })
    })
    
    // Forward connection status
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
