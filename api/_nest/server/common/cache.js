"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = getCache;
exports.setCache = setCache;
exports.delCache = delCache;
exports.delCachePattern = delCachePattern;
const rawLog = globalThis.console.log.bind(globalThis.console);
const cacheMap = new Map();
function cleanup() {
    const now = Date.now();
    for (const [key, entry] of cacheMap) {
        if (entry.expireAt <= now) {
            cacheMap.delete(key);
        }
    }
}
function getCache(key) {
    const entry = cacheMap.get(key);
    if (!entry) {
        rawLog(`[CACHE] miss: ${key}`);
        return null;
    }
    if (entry.expireAt <= Date.now()) {
        cacheMap.delete(key);
        rawLog(`[CACHE] expired: ${key}`);
        return null;
    }
    rawLog(`[CACHE] hit: ${key}`);
    return entry.value;
}
function setCache(key, value, ttlSeconds) {
    cacheMap.set(key, {
        value,
        expireAt: Date.now() + ttlSeconds * 1000,
    });
    rawLog(`[CACHE] set: ${key} (ttl=${ttlSeconds}s, size=${cacheMap.size})`);
}
function delCache(key) {
    const existed = cacheMap.delete(key);
    rawLog(`[CACHE] del: ${key} (existed=${existed})`);
}
function delCachePattern(prefix) {
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
