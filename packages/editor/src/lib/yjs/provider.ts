import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'
import type { IndexeddbPersistence } from 'y-indexeddb'
import { updateRoomAccessAndCleanup } from './lru'

export interface ProviderConfig {
  roomId: string
  wsUrl?: string
  userId: string
  userName?: string
  userColor?: string
}

function generateRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

export async function createYjsProvider(config: ProviderConfig): Promise<{
  yDoc: Y.Doc
  provider: WebsocketProvider
  indexeddbProvider: IndexeddbPersistence
}> {
  const { roomId, wsUrl, userId, userName = 'Anonymous', userColor } = config

  const { WebsocketProvider } = await import('y-websocket')
  const { IndexeddbPersistence } = await import('y-indexeddb')

  const yDoc = new Y.Doc()
  const indexeddbProvider = new IndexeddbPersistence(roomId, yDoc)

  updateRoomAccessAndCleanup(roomId).catch((err) => {
    console.error('[YJS] Failed to update LRU history:', err)
  })

  const url = wsUrl || `ws://localhost:1234`

  const provider = new WebsocketProvider(url, roomId, yDoc, {
    connect: true,
  })

  await indexeddbProvider.whenSynced

  provider.awareness.setLocalStateField('user', {
    id: userId,
    name: userName,
    color: userColor || generateRandomColor(),
  })

  return { yDoc, provider, indexeddbProvider }
}

export function destroyProvider(provider: WebsocketProvider, indexeddbProvider?: IndexeddbPersistence) {
  provider.awareness.destroy()
  provider.destroy()
  if (indexeddbProvider) {
    indexeddbProvider.destroy()
  }
}

