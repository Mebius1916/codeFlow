import type { LocalForage } from '../types'
import { evictRoomsInStore, touchRoomInStore } from '../storage/rooms'
import { getStoreEvictionPolicy } from './policy'

export async function maintainRooms(store: LocalForage, room: string, storeName: string) {
  await touchRoomInStore(store, room)
  await evictRoomsInStore(store, getStoreEvictionPolicy(storeName))
}

