import localforage from 'localforage'

export type LocalForage = ReturnType<typeof localforage.createInstance>

export type SnapshotContent = string | Uint8Array

export interface YjsStorageData {
  snapshot: Record<string, string>
  updates: Uint8Array
}
