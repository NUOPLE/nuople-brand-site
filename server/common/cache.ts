const rawLog = globalThis.console.log.bind(globalThis.console);

rawLog('[CACHE] module initialized (in-memory LRU-style map)');

interface CacheEntry {
  value: unknown;
  expireAt: number;
}

const cacheMap = new Map<string, CacheEntry>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of cacheMap) {
    if (entry.expireAt <= now) {
      cacheMap.delete(key);
    }
  }
}

export function getCache<T>(key: string): T | null {
  rawLog(`[CACHE] checking key=${key}`);
  const entry = cacheMap.get(key);
  if (!entry) {
    rawLog(`[CACHE] MISS key=${key}`);
    return null;
  }
  if (entry.expireAt <= Date.now()) {
    cacheMap.delete(key);
    rawLog(`[CACHE] EXPIRED key=${key}`);
    return null;
  }
  rawLog(`[CACHE] HIT key=${key}`);
  return entry.value as T;
}

export function setCache(key: string, value: unknown, ttlSeconds: number): void {
  cacheMap.set(key, {
    value,
    expireAt: Date.now() + ttlSeconds * 1000,
  });
  rawLog(`[CACHE] set: ${key} (ttl=${ttlSeconds}s, size=${cacheMap.size})`);
}

export function delCache(key: string): void {
  const existed = cacheMap.delete(key);
  rawLog(`[CACHE] del: ${key} (existed=${existed})`);
}

export function delCachePattern(prefix: string): void {
  cleanup();
  let count = 0;
  for (const key of cacheMap.keys()) {
    if (key.startsWith(prefix)) {
      cacheMap.delete(key);
      count += 1;
    }
  }
  rawLog(`[CACHE] delPattern: ${prefix}* (removed=${count}, remaining=${cacheMap.size})`);
}
