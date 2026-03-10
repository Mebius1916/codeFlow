import type { LocalForage } from '../types'
import { roomsIndexKey, roomUpdatesKey, roomFilesIndexKey, roomFileKey } from './keys'

type RoomIndexEntry = { room: string; lastAccessAt: number }

const DEFAULT_MAX_ROOMS = 20
const DEFAULT_ROOM_TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function clearRoomData(store: LocalForage, room: string) {
  const index = await store.getItem<string[]>(roomFilesIndexKey(room))
  if (index && index.length > 0) {
    await Promise.all(index.map((path) => store.removeItem(roomFileKey(room, path))))
  }
  await store.removeItem(roomFilesIndexKey(room))
  await store.removeItem(roomUpdatesKey(room))
}

export async function touchRoomInStore(store: LocalForage, room: string) {
  const now = Date.now()
  const index = (await store.getItem<RoomIndexEntry[]>(roomsIndexKey)) ?? []
  const next = [{ room, lastAccessAt: now }, ...index.filter((e) => e.room !== room)]
  await store.setItem(roomsIndexKey, next)
}

export async function evictRoomsInStore(
  store: LocalForage,
  options?: { maxRooms?: number; ttlMs?: number },
) {
  const maxRooms = options?.maxRooms ?? DEFAULT_MAX_ROOMS
  const ttlMs = options?.ttlMs ?? DEFAULT_ROOM_TTL_MS
  const now = Date.now()

  const index = (await store.getItem<RoomIndexEntry[]>(roomsIndexKey)) ?? []
  const alive = index.filter((e) => now - e.lastAccessAt <= ttlMs)
  alive.sort((a, b) => b.lastAccessAt - a.lastAccessAt)

  const keep = alive.slice(0, maxRooms)
  const keepRooms = new Set(keep.map((e) => e.room))
  const toRemove = alive.filter((e) => !keepRooms.has(e.room))

  await Promise.all(toRemove.map((e) => clearRoomData(store, e.room)))
  await store.setItem(roomsIndexKey, keep)
}
