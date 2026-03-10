import type { LocalForage, SnapshotContent } from '../types'
import { roomFileKey, roomFilesIndexKey } from './keys'

// 获取快照
export async function getSnapshotFromStore(store: LocalForage, room: string) {
  const index = await store.getItem<string[]>(roomFilesIndexKey(room))
  if (index && index.length > 0) {
    const entries = await Promise.all(
      index.map(async (path) => {
        const content = await store.getItem<SnapshotContent>(roomFileKey(room, path))
        return [path, content ?? ''] as const
      }),
    )
    return Object.fromEntries(entries)
  }
  return null
}

// 设置快照
export async function setSnapshotToStore(
  store: LocalForage,
  room: string,
  snapshot: Record<string, SnapshotContent>,
) {
  const existingIndex = (await store.getItem<string[]>(roomFilesIndexKey(room))) ?? []
  const nextIndex = Object.keys(snapshot)
  const removed = existingIndex.filter((path) => !Object.prototype.hasOwnProperty.call(snapshot, path))
  await Promise.all(removed.map((path) => store.removeItem(roomFileKey(room, path))))

  await Promise.all(nextIndex.map((path) => store.setItem(roomFileKey(room, path), snapshot[path])))
  await store.setItem(roomFilesIndexKey(room), nextIndex)
}
