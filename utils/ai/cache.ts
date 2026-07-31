import type { AppLocale } from '@/i18n/mapDeviceLocale';

const MAX_CACHE_SIZE = 50;

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

export function buildAiCacheKey(
  locale: AppLocale,
  segment: string,
  ...parts: (string | number)[]
): string {
  return `loc:${locale}:${segment}:${parts.join(':')}`;
}

export function clearAiCache(): void {
  cache.clear();
}

const cleanExpiredCache = (): void => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp >= value.ttl) {
      cache.delete(key);
    }
  }
};

const evictOldestCache = (): void => {
  if (cache.size <= MAX_CACHE_SIZE) return;

  const entries = Array.from(cache.entries()).sort(
    (a, b) => a[1].timestamp - b[1].timestamp,
  );

  const toDelete = entries.slice(0, cache.size - MAX_CACHE_SIZE);
  for (const [key] of toDelete) {
    cache.delete(key);
  }
};

export const getCached = <T = unknown>(key: string): T | null => {
  cleanExpiredCache();

  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
};

export const setCache = <T = unknown>(
  key: string,
  data: T,
  ttl: number = 24 * 60 * 60 * 1000,
): void => {
  cleanExpiredCache();
  evictOldestCache();
  cache.set(key, { data, timestamp: Date.now(), ttl });
};

/** @internal unit tests only */
export function __seedAiCacheForTest<T>(key: string, data: T): void {
  setCache(key, data, 60_000);
}

/** @internal unit tests only */
export function __peekAiCacheForTest<T>(key: string): T | null {
  return getCached<T>(key);
}
