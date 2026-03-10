export function getStoreEvictionPolicy(storeName: string) {
  if (storeName === 'yjs-forage') {
    return { maxRooms: 10, ttlMs: 7 * 24 * 60 * 60 * 1000 }
  }
  if (storeName === 'cache-image') {
    return { maxRooms: 10, ttlMs: 24 * 60 * 60 * 1000 }
  }
  if (storeName === 'cache-preview') {
    return { maxRooms: 10, ttlMs: 30 * 24 * 60 * 60 * 1000 }
  }
  return { maxRooms: 10, ttlMs: 7 * 24 * 60 * 60 * 1000 }
}

