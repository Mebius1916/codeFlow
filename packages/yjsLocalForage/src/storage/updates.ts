import type { LocalForage } from '../types'
import { roomUpdatesKey } from './keys'

export async function getUpdatesFromStore(store: LocalForage, room: string): Promise<Uint8Array | null> {
  return (await store.getItem<Uint8Array>(roomUpdatesKey(room))) ?? null
}

export async function setUpdatesToStore(store: LocalForage, room: string, updates: Uint8Array) {
  await store.setItem(roomUpdatesKey(room), updates)
}
