import * as Y from 'yjs'
import localforage from 'localforage'
import { ObservableV2 } from 'lib0/observable'
import { maintainRooms } from './eviction/maintain'
import { clearSnapshotFromStore, getSnapshotFromStore, setSnapshotToStore } from './storage/snapshot'
import { getUpdatesFromStore, setUpdatesToStore } from './storage/updates'
import type { SnapshotContent, LocalForage } from './types'
import { applySnapshotToDoc, extractSnapshotFromDoc } from './yjs/files'

export async function getSnapshot(
  room: string,
  storeName = 'yjs-forage',
): Promise<Record<string, SnapshotContent> | null> {
  const store = localforage.createInstance({ name: storeName })
  await maintainRooms(store, room, storeName)
  return getSnapshotFromStore(store, room)
}

export async function setSnapshot(
  room: string,
  snapshot: Record<string, SnapshotContent>,
  storeName = 'yjs-forage',
): Promise<void> {
  const store = localforage.createInstance({ name: storeName })
  await setSnapshotToStore(store, room, snapshot)
  await maintainRooms(store, room, storeName)
}

export async function clearSnapshot(
  room: string,
  storeName = 'yjs-forage',
): Promise<void> {
  const store = localforage.createInstance({ name: storeName })
  await clearSnapshotFromStore(store, room)
}

// 协调计算
export class YjsLocalForageProvider extends ObservableV2<any> {
  private _room: string
  private _doc: Y.Doc
  private _store: LocalForage
  private _storeName: string
  public whenSynced: Promise<void>
  private _updateHandler: (update: Uint8Array, origin: any) => void
  private _debounceTimer: any = null
  private _debounceWait: number

  constructor(room: string, doc: Y.Doc, { storeName = 'yjs-forage', debounceWait = 2000 } = {}) {
    super()
    this._room = room
    this._doc = doc
    this._debounceWait = debounceWait
    this._storeName = storeName
    this._store = localforage.createInstance({
      name: storeName
    })

    this._updateHandler = (_update: Uint8Array, origin: any) => {
      if (origin !== 'local-forage') {
        this.saveDebounced()
      }
    }

    this._doc.on('update', this._updateHandler)
    
    this.whenSynced = this.init()
  }

  private async init() {
    try {
      await maintainRooms(this._store, this._room, this._storeName)
      // 1. 尝试读取 Updates (协同历史)
      const resolvedUpdates = await getUpdatesFromStore(this._store, this._room)
      
      if (resolvedUpdates) {
        Y.applyUpdate(this._doc, resolvedUpdates, 'local-forage')
      } else {
        // 2. 如果没有 Updates，尝试读取 Snapshot (单机历史)
        const snapshot = await getSnapshotFromStore(this._store, this._room)
        
        if (snapshot && Object.keys(snapshot).length > 0) {
          applySnapshotToDoc(this._doc, snapshot)
          this.save()
        }
      }
    } catch (err) {
      console.error('[YjsLocalForage] Failed to load data:', err)
    } finally {
      this.emit('synced', [true])
    }
  }

  private saveDebounced() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }
    this._debounceTimer = setTimeout(() => {
      this.save()
    }, this._debounceWait)
  }

  private async save() {
    try {
      const snapshot = extractSnapshotFromDoc(this._doc)

      const updates = Y.encodeStateAsUpdate(this._doc)

      await setSnapshotToStore(this._store, this._room, snapshot)
      await setUpdatesToStore(this._store, this._room, updates)
      await maintainRooms(this._store, this._room, this._storeName)
    } catch (err) {
      console.error('[YjsLocalForage] Failed to save data:', err)
    }
  }

  destroy() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }
    this._doc.off('update', this._updateHandler)
    this.save()
    super.destroy()
  }
}
