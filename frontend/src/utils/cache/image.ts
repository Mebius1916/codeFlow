import { getSnapshot, setSnapshot } from '@collaborative-editor/yjs-local-forage'
import { cacheRoom } from './hash'

export type ResourceContent = string | Uint8Array

export async function getCachedContentByUrl(url: string) {
  const snapshot = await getSnapshot(await cacheRoom('img', url), 'cache-image')
  const content = snapshot?.content
  return typeof content === 'string' || content instanceof Uint8Array ? content : undefined
}

export async function getCachedContentTypeByUrl(url: string) {
  const snapshot = await getSnapshot(await cacheRoom('img', url), 'cache-image')
  const contentType = snapshot?.contentType
  return typeof contentType === 'string' ? contentType : undefined
}

export async function setCachedContentByUrl(url: string, content: ResourceContent, contentType: string) {
  await setSnapshot(await cacheRoom('img', url), { content, contentType }, 'cache-image')
}

