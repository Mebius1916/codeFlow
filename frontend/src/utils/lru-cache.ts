import localforage from 'localforage'

type CacheEntry<V> = { value: V; expiresAt: number };
type CacheDumpEntry<V> = { key: string; value: V; expiresAt: number };

export type ResourceContent = string | Uint8Array;

export class LruTtlCache<V> {
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly map = new Map<string, CacheEntry<V>>();
  private readonly storage: LocalForage;
  private isInitialized = false;

  constructor(options: { maxEntries: number; ttlMs: number; storeName: string }) {
    this.maxEntries = options.maxEntries;
    this.ttlMs = options.ttlMs;
    this.storage = localforage.createInstance({
      name: 'request-cache',
      storeName: options.storeName
    });
    this.init();
  }

  private async init() {
    try {
      await this.storage.iterate<CacheEntry<V>, void>((value, key) => {
        if (value.expiresAt > Date.now()) {
          this.map.set(key, value);
        } else {
          this.storage.removeItem(key);
        }
      });
      this.isInitialized = true;
    } catch (err) {
      console.error('Failed to load cache from storage:', err);
    }
  }

  async get(key: string): Promise<V | undefined> {
    if (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 50)); 
    }
    
    const entry = this.map.get(key);
    if (!entry) return undefined;
    
    if (entry.expiresAt <= Date.now()) {
      this.map.delete(key);
      this.storage.removeItem(key).catch(console.error);
      return undefined;
    }
    
    // Refresh LRU order in memory
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V) {
    const entry = { value, expiresAt: Date.now() + this.ttlMs };
    
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, entry);
    this.storage.setItem(key, entry).catch(console.error);

    while (this.map.size > this.maxEntries) {
      const oldestKey = this.map.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.map.delete(oldestKey);
      this.storage.removeItem(oldestKey).catch(console.error);
    }
  }

  entries(): CacheDumpEntry<V>[] {
    const now = Date.now();
    const result: CacheDumpEntry<V>[] = [];
    for (const [key, entry] of this.map.entries()) {
      if (entry.expiresAt <= now) continue;
      result.push({ key, value: entry.value, expiresAt: entry.expiresAt });
    }
    return result;
  }
}
