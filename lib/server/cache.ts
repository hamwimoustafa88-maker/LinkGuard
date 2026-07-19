// Tiny in-memory TTL cache to avoid burning free-tier API quota on repeat scans
// of the same URL. Scoped per serverless instance only — cold starts on Vercel
// reset it. That's an accepted limitation, not a bug: it still absorbs the
// common "user re-scans the same link" case within a warm instance.

interface CacheEntry<T> {
    value: T;
    expires: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const MAX_ENTRIES = 500;
const DEFAULT_TTL_MS = 15 * 60 * 1000;

export function cacheGet<T>(key: string): T | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
        store.delete(key);
        return undefined;
    }
    return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
    if (store.size >= MAX_ENTRIES && !store.has(key)) {
        const oldestKey = store.keys().next().value;
        if (oldestKey !== undefined) store.delete(oldestKey);
    }
    store.set(key, { value, expires: Date.now() + ttlMs });
}

export function cacheKey(prefix: string, url: string): string {
    return `${prefix}:${url.toLowerCase()}`;
}
