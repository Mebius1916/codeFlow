import localforage from 'localforage'

export type LocalForage = ReturnType<typeof localforage.createInstance>

export type SnapshotContent = string | Uint8Array
