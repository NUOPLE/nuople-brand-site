import { logger } from '@/utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL = 5 * 60 * 1000;

export function getPageCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    logger.info(`[PageCache] miss: ${key}`);
    return null;
  }
  if (Date.now() - entry.timestamp > DEFAULT_TTL) {
    cache.delete(key);
    logger.info(`[PageCache] expired: ${key}`);
    return null;
  }
  logger.info(`[PageCache] hit: ${key}`);
  return entry.data;
}

export function setPageCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
  logger.info(`[PageCache] set: ${key} (size=${cache.size})`);
}

export function clearPageCache(key: string): void {
  const existed = cache.delete(key);
  logger.info(`[PageCache] clear: ${key} (existed=${existed})`);
}

export function clearAllPageCache(): void {
  cache.clear();
  logger.info('[PageCache] clearAll');
}
