import type { SnapshotContent, YjsStorageData } from './types'
import localforage from 'localforage'

type LocalForage = ReturnType<typeof localforage.createInstance>

export const fileIndexKey = (room: string) => `${room}::files`
export const fileKey = (room: string, path: string) => `${room}::file::${encodeURIComponent(path)}`
export const updatesKey = (room: string) => `${room}::updates`

// 获取普通缓存
export const getSnapshotFromStore = async (store: LocalForage, room: string) => {
  // 拿到文件列表
  const index = await store.getItem<string[]>(fileIndexKey(room))
  if (index && index.length > 0) {
    const entries = await Promise.all(
      index.map(async (path) => {
        const content = await store.getItem<SnapshotContent>(fileKey(room, path))
        return [path, content ?? ''] as const
      }),
    )
    return Object.fromEntries(entries)
  }
  const legacy = await store.getItem<YjsStorageData>(room)
  return legacy ? legacy.snapshot : null
}

// 更新普通缓存
export const setSnapshotToStore = async (
  store: LocalForage,
  room: string,
  snapshot: Record<string, SnapshotContent>,
) => {
  const existingIndex = (await store.getItem<string[]>(fileIndexKey(room))) ?? []
  const nextIndex = Object.keys(snapshot)
  // 筛选出不存在的旧文件路径 并删除
  const removed = existingIndex.filter((path) => !Object.prototype.hasOwnProperty.call(snapshot, path))
  await Promise.all(removed.map((path) => store.removeItem(fileKey(room, path))))

  await Promise.all(
    nextIndex.map((path) => store.setItem(fileKey(room, path), snapshot[path])),
  )
  await store.setItem(fileIndexKey(room), nextIndex)
}

// 获取协同缓存
export const getUpdatesFromStore = async (store: LocalForage, room: string): Promise<Uint8Array | null> => {
  const updates = await store.getItem<Uint8Array>(updatesKey(room))
  const legacy = await store.getItem<YjsStorageData>(room)
  return updates ?? legacy?.updates ?? null
}

// 更新协同缓存
export const setUpdatesToStore = async (store: LocalForage, room: string, updates: Uint8Array) => {
  await store.setItem(updatesKey(room), updates)
}

// 清除房间数据（包括普通缓存和协同缓存）
export const clearRoomData = async (store: LocalForage, room: string) => {
  const index = await store.getItem<string[]>(fileIndexKey(room))
  if (index && index.length > 0) {
    await Promise.all(index.map((path) => store.removeItem(fileKey(room, path))))
  }
  await store.removeItem(fileIndexKey(room))
  await store.removeItem(updatesKey(room))
  await store.removeItem(room)
}
