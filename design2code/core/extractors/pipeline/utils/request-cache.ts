import { readFile, writeFile } from "fs/promises";

type CacheEntry<V> = { value: V; expiresAt: number };
type CacheDumpEntry<V> = { key: string; value: V; expiresAt: number };

export class LruTtlCache<V> {
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly map = new Map<string, CacheEntry<V>>();

  constructor(options: { maxEntries: number; ttlMs: number }) {
    this.maxEntries = options.maxEntries;
    this.ttlMs = options.ttlMs;
  }

  get(key: string): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    while (this.map.size > this.maxEntries) {
      const oldestKey = this.map.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.map.delete(oldestKey);
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

  setEntry(key: string, value: V, expiresAt: number) {
    if (expiresAt <= Date.now()) return;
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt });
    while (this.map.size > this.maxEntries) {
      const oldestKey = this.map.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.map.delete(oldestKey);
    }
  }
}

const jsonCache = new LruTtlCache<unknown>({ maxEntries: 300, ttlMs: 24 * 60 * 60 * 1000 });
const textCache = new LruTtlCache<string>({ maxEntries: 300, ttlMs:  24 * 60 * 60 * 1000 });

export async function dumpRequestCacheToFile(filePath: string) {
  const payload = {
    json: jsonCache.entries(),
    text: textCache.entries(),
    generatedAt: new Date().toISOString(),
  };
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function restoreRequestCacheFromFile(filePath: string) {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { json?: CacheDumpEntry<unknown>[]; text?: CacheDumpEntry<string>[] };
    parsed.json?.forEach((entry) => {
      jsonCache.setEntry(entry.key, entry.value, entry.expiresAt);
    });
    parsed.text?.forEach((entry) => {
      textCache.setEntry(entry.key, entry.value, entry.expiresAt);
    });
  } catch {
    return;
  }
}

export async function requestJsonWithFigmaToken<T>(url: string, token: string): Promise<T> {
  const cached = jsonCache.get(url);
  if (cached !== undefined) return cached as T;
  const resp = await fetch(url, { headers: { "X-Figma-Token": token } });
  if (!resp.ok) {
    const headers: Record<string, string> = {};
    resp.headers.forEach((value, key) => {
      headers[key] = value;
    });
    throw new Error(`Failed to fetch: ${resp.status} ${resp.statusText} | headers=${JSON.stringify(headers)}`);
  }
  const data = (await resp.json()) as T;
  jsonCache.set(url, data as unknown);
  return data;
}

export async function requestTextWithCache(url: string): Promise<string> {
  const cached = textCache.get(url);
  if (cached !== undefined) return cached;
  const resp = await fetch(url);
  if (!resp.ok) {
    const headers: Record<string, string> = {};
    resp.headers.forEach((value, key) => {
      headers[key] = value;
    });
    throw new Error(`Failed to fetch: ${resp.status} ${resp.statusText} | headers=${JSON.stringify(headers)}`);
  }
  const text = await resp.text();
  if (text) textCache.set(url, text);
  return text;
}
