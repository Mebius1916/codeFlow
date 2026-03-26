import localforage from 'localforage'
import { cacheRoom } from './hash'
import { ensureUint8Array } from '@collaborative-editor/shared'

export type ResourceContent = string | Uint8Array
export type CachedResourceSnapshot = { content: ResourceContent; contentType: string }

const store = localforage.createInstance({ name: 'cache-image' })

export async function getCachedResourceByAssetPath(assetPath: string): Promise<CachedResourceSnapshot | undefined> {
  const room = await cacheRoom('img:path', assetPath)
  const snapshot = await store.getItem<{ content: ResourceContent; contentType: string }>(room)
  const content = ensureUint8Array(snapshot?.content)
  const contentType = snapshot?.contentType
  if (!(typeof content === 'string' || content instanceof Uint8Array)) return undefined
  if (typeof contentType !== 'string') return undefined
  return { content, contentType }
}

export async function setCachedResourceByAssetPath(assetPath: string, snapshot: CachedResourceSnapshot) {
  const room = await cacheRoom('img:path', assetPath)
  await store.setItem(room, snapshot)
}
