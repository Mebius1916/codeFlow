const MAX_STORED_ROOMS = 20
const LRU_STORE_NAME = 'yjs-room-access-history'
const DB_NAME = 'yjs-lru-manager'
const DB_VERSION = 1

async function updateRoomAccessAndCleanup(roomId: string) {
  if (typeof window === 'undefined' || !window.indexedDB) return

  try {
    const db = await openLRUDb()

    await putAccessRecord(db, roomId, Date.now())

    const records = await getAllAccessRecords(db)

    if (records.length > MAX_STORED_ROOMS) {
      records.sort((a, b) => a.lastAccessed - b.lastAccessed)

      const recordsToDelete = records.slice(0, records.length - MAX_STORED_ROOMS)

      for (const record of recordsToDelete) {
        await deleteAccessRecord(db, record.roomId)
        await deleteDatabase(record.roomId)
        console.log(`[LRU] Cleaned up old room data: ${record.roomId}`)
      }
    }
  } catch (err) {
    console.error('[LRU] Failed to update room access history:', err)
  }
}

function openLRUDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(LRU_STORE_NAME)) {
        db.createObjectStore(LRU_STORE_NAME, { keyPath: 'roomId' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function putAccessRecord(db: IDBDatabase, roomId: string, lastAccessed: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LRU_STORE_NAME, 'readwrite')
    const store = tx.objectStore(LRU_STORE_NAME)
    const request = store.put({ roomId, lastAccessed })

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function getAllAccessRecords(db: IDBDatabase): Promise<Array<{ roomId: string; lastAccessed: number }>> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LRU_STORE_NAME, 'readonly')
    const store = tx.objectStore(LRU_STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function deleteAccessRecord(db: IDBDatabase, roomId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LRU_STORE_NAME, 'readwrite')
    const store = tx.objectStore(LRU_STORE_NAME)
    const request = store.delete(roomId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function deleteDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => console.warn(`[LRU] Delete blocked for ${dbName}`)
  })
}

export { updateRoomAccessAndCleanup }

