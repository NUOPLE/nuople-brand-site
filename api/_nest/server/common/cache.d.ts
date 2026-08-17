export declare function getCache<T>(key: string): T | null;
export declare function setCache(key: string, value: unknown, ttlSeconds: number): void;
export declare function delCache(key: string): void;
export declare function delCachePattern(prefix: string): void;
