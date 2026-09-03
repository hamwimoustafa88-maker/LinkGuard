import { describe, it, expect, beforeEach, vi } from 'vitest';

// lib/server/cache.ts keeps its store at module scope, so re-import fresh
// per test for isolation.
async function freshCacheModule() {
    vi.resetModules();
    return import('@/lib/server/cache');
}

describe('lib/server/cache', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    it('cacheKey lowercases the url so lookups are case-insensitive', async () => {
        const { cacheKey } = await freshCacheModule();
        expect(cacheKey('vt', 'HTTPS://Example.com')).toBe('vt:https://example.com');
    });

    it('returns undefined for a miss', async () => {
        const { cacheGet } = await freshCacheModule();
        expect(cacheGet('nope')).toBeUndefined();
    });

    it('round-trips a value within its TTL', async () => {
        const { cacheGet, cacheSet } = await freshCacheModule();
        cacheSet('k', { hello: 'world' });
        expect(cacheGet('k')).toEqual({ hello: 'world' });
    });

    it('expires after the given TTL', async () => {
        vi.useFakeTimers();
        const { cacheGet, cacheSet } = await freshCacheModule();
        cacheSet('k', 'value', 1000);

        vi.advanceTimersByTime(999);
        expect(cacheGet('k')).toBe('value');

        vi.advanceTimersByTime(2);
        expect(cacheGet('k')).toBeUndefined();
    });

    it('falls back to the 15-minute default TTL when none is given', async () => {
        vi.useFakeTimers();
        const { cacheGet, cacheSet } = await freshCacheModule();
        cacheSet('k', 'value');

        vi.advanceTimersByTime(15 * 60 * 1000 - 1);
        expect(cacheGet('k')).toBe('value');

        vi.advanceTimersByTime(2);
        expect(cacheGet('k')).toBeUndefined();
    });

    it('evicts the oldest entry once at MAX_ENTRIES (500) capacity', async () => {
        const { cacheGet, cacheSet } = await freshCacheModule();
        for (let i = 0; i < 500; i++) cacheSet(`k${i}`, i);
        expect(cacheGet('k0')).toBe(0);

        // One more insert should evict the oldest (k0) to stay at the cap.
        cacheSet('k500', 500);
        expect(cacheGet('k0')).toBeUndefined();
        expect(cacheGet('k500')).toBe(500);
    });

    it('overwriting an existing key does not evict anything', async () => {
        const { cacheGet, cacheSet } = await freshCacheModule();
        for (let i = 0; i < 500; i++) cacheSet(`k${i}`, i);

        cacheSet('k0', 'updated');
        expect(cacheGet('k0')).toBe('updated');
        expect(cacheGet('k1')).toBe(1);
    });
});
