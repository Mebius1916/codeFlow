import localforage from 'localforage'
import { cacheRoom } from './hash'
import { ensureUint8Array } from '@collaborative-editor/shared'

export type ResourceContent = string | Uint8Array

const store = localforage.createInstance({ name: 'cache-image' })

export async function getCachedContentByUrl(url: string) {
  const room = await cacheRoom('img', url)
  const snapshot = await store.getItem<{ content: ResourceContent }>(room)
  const content = snapshot?.content
  
  // 使用 ensureUint8Array 处理序列化后的对象
  const safeContent = ensureUint8Array(content)
  return safeContent ?? undefined
}

export async function getCachedContentTypeByUrl(url: string) {
  const room = await cacheRoom('img', url)
  const snapshot = await store.getItem<{ contentType: string }>(room)
  const contentType = snapshot?.contentType
  return typeof contentType === 'string' ? contentType : undefined
}

export async function setCachedContentByUrl(url: string, content: ResourceContent, contentType: string) {
  const room = await cacheRoom('img', url)
  await store.setItem(room, { content, contentType })
}

