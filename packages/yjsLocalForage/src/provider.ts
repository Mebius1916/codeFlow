import * as Y from 'yjs'
import localforage from 'localforage'
import { ObservableV2 } from 'lib0/observable'

interface YjsStorageData {
  snapshot: Record<string, string>
  updates: Uint8Array
}

const fileIndexKey = (room: string) => `${room}::files`
const fileKey = (room: string, path: string) => `${room}::file::${encodeURIComponent(path)}`
const updatesKey = (room: string) => `${room}::updates`

const getSnapshotFromStore = async (store: LocalForage, room: string) => {
  // 拿到文件列表
  const index = await store.getItem<string[]>(fileIndexKey(room))
  if (index && index.length > 0) {
    const entries = await Promise.all(
      index.map(async (path) => {
        const content = await store.getItem<string>(fileKey(room, path))
        return [path, content ?? ''] as const
      }),
    )
    return Object.fromEntries(entries)
  }
  const legacy = await store.getItem<YjsStorageData>(room)
  return legacy ? legacy.snapshot : null
}

const setSnapshotToStore = async (store: LocalForage, room: string, snapshot: Record<string, string>) => {
  const existingIndex = (await store.getItem<string[]>(fileIndexKey(room))) ?? []
  const nextIndex = Object.keys(snapshot)

  const removed = existingIndex.filter((path) => !snapshot[path])
  await Promise.all(removed.map((path) => store.removeItem(fileKey(room, path))))

  await Promise.all(
    nextIndex.map((path) => store.setItem(fileKey(room, path), snapshot[path])),
  )
  await store.setItem(fileIndexKey(room), nextIndex)
}

export async function getSnapshot(room: string, storeName = 'yjs-forage'): Promise<Record<string, string> | null> {
  const store = localforage.createInstance({ name: storeName })
  return getSnapshotFromStore(store, room)
}

export async function setSnapshot(
  room: string,
  snapshot: Record<string, string>,
  storeName = 'yjs-forage',
): Promise<void> {
  const store = localforage.createInstance({ name: storeName })
  const legacy = await store.getItem<YjsStorageData>(room)
  const existingUpdates = legacy?.updates ?? (await store.getItem<Uint8Array>(updatesKey(room))) ?? new Uint8Array()
  await setSnapshotToStore(store, room, snapshot)
  await store.setItem(updatesKey(room), existingUpdates)
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
      const snapshot = await getSnapshotFromStore(this._store, this._room)
      if (snapshot) {
        this.emit('snapshot', [snapshot])
      }

      const updates = (await this._store.getItem<Uint8Array>(updatesKey(this._room)))
      const legacy = await this._store.getItem<YjsStorageData>(this._room)
      const resolvedUpdates = updates ?? legacy?.updates
      if (resolvedUpdates) {
        Y.applyUpdate(this._doc, resolvedUpdates, 'local-forage')
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
      const snapshot: Record<string, string> = {}

      this._doc.share.forEach((type, key) => {
        if (type instanceof Y.Text) {
          snapshot[key] = type.toString()
        }
      })

      const updates = Y.encodeStateAsUpdate(this._doc)

      await setSnapshotToStore(this._store, this._room, snapshot)
      await this._store.setItem(updatesKey(this._room), updates)
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
    const index = await this._store.getItem<string[]>(fileIndexKey(this._room))
    if (index && index.length > 0) {
      await Promise.all(index.map((path) => this._store.removeItem(fileKey(this._room, path))))
    }
    await this._store.removeItem(fileIndexKey(this._room))
    await this._store.removeItem(updatesKey(this._room))
    await this._store.removeItem(this._room)
  }
}
