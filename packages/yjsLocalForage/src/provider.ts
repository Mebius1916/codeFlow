import * as Y from 'yjs'
import localforage from 'localforage'
import { ObservableV2 } from 'lib0/observable'

interface YjsStorageData {
  snapshot: Record<string, string>
  updates: Uint8Array
}

// 直接读取快照
export async function getSnapshot(room: string, storeName = 'yjs-forage'): Promise<Record<string, string> | null> {
  const store = localforage.createInstance({ name: storeName })
  const data = await store.getItem<YjsStorageData>(room)
  return data ? data.snapshot : null
}

// 协调计算
export class YjsLocalForageProvider extends ObservableV2<any> {
  private _room: string
  private _doc: Y.Doc
  private _store: LocalForage
  public whenSynced: Promise<void>
  private _updateHandler: (update: Uint8Array, origin: any) => void
  private _debounceTimer: any = null
  private _debounceWait: number

  constructor(room: string, doc: Y.Doc, { storeName = 'yjs-forage', debounceWait = 2000 } = {}) {
    super()
    this._room = room
    this._doc = doc
    this._debounceWait = debounceWait
    this._store = localforage.createInstance({
      name: storeName
    })

    this._updateHandler = (update: Uint8Array, origin: any) => {
      if (origin !== 'local-forage') {
        this.saveDebounced()
      }
    }

    this._doc.on('update', this._updateHandler)
    
    this.whenSynced = this.init()
  }

  private async init() {
    try {
      const data = await this._store.getItem<YjsStorageData>(this._room)
      if (data) {
        // 1. Emit snapshot immediately for fast UI init
        if (data.snapshot) {
          this.emit('snapshot', [data.snapshot])
        }

        // 2. Apply Yjs updates to restore full state
        if (data.updates) {
          Y.applyUpdate(this._doc, data.updates, 'local-forage')
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
      // 1. Generate Snapshot (Record<string, string>)
      const snapshot: Record<string, string> = {}

      this._doc.share.forEach((type, key) => {
        if (type instanceof Y.Text) {
          snapshot[key] = type.toString()
        }
      })

      // 2. Generate Yjs Updates {Blob Uint8Array}
      const updates = Y.encodeStateAsUpdate(this._doc)

      // 3. Save to storage
      const data: YjsStorageData = {
        snapshot,
        updates
      }
      
      await this._store.setItem(this._room, data)
    } catch (err) {
      console.error('[YjsLocalForage] Failed to save data:', err)
    }
  }

  destroy() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }
    this._doc.off('update', this._updateHandler)
    return this.whenSynced
  }

  // Clear data for this room
  async clear() {
    await this._store.removeItem(this._room)
  }
}
