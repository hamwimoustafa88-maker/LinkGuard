import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { cleanKey, fetchWithTimeout, requireUrlBody, ApiError, withCache, pollUntil, ssrfBlockedResponse, enforceRateLimit } from '@/lib/server/apiHelpers';

describe('cleanKey', () => {
    it('strips whitespace and newlines', () => {
        expect(cleanKey('  abc\n123 \t')).toBe('abc123');
    });

    it('treats undefined as an empty key', () => {
        expect(cleanKey(undefined)).toBe('');
    });
});

describe('fetchWithTimeout', () => {
    beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok'))));
    afterEach(() => vi.unstubAllGlobals());

    it('passes a fresh AbortSignal alongside the given init', async () => {
        await fetchWithTimeout('https://example.com', { method: 'POST' }, 5000);
        const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call?.[0]).toBe('https://example.com');
        expect(call?.[1]).toMatchObject({ method: 'POST' });
        expect(call?.[1].signal).toBeInstanceOf(AbortSignal);
    });

    it('two calls get independent signals (a retry gets a fresh budget - D4)', async () => {
        await fetchWithTimeout('https://example.com', {}, 100);
        await fetchWithTimeout('https://example.com', {}, 100);
        const firstSignal = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1].signal;
        const secondSignal = (fetch as ReturnType<typeof vi.fn>).mock.calls[1]![1].signal;
        expect(firstSignal).not.toBe(secondSignal);
    });
});

describe('requireUrlBody', () => {
    const post = (body: unknown) => new NextRequest('http://localhost/api/x', { method: 'POST', body: JSON.stringify(body) });

    it('returns the parsed body when url is present', async () => {
        const result = await requireUrlBody(post({ url: 'https://example.com', ip: '1.1.1.1' }));
        expect(result).toEqual({ url: 'https://example.com', ip: '1.1.1.1' });
    });

    it('throws ApiError(400) when url is missing', async () => {
        await expect(requireUrlBody(post({}))).rejects.toThrow(ApiError);
    });

    it('throws ApiError(400) when url is an empty string', async () => {
        await expect(requireUrlBody(post({ url: '' }))).rejects.toThrow(ApiError);
    });

    it('the thrown ApiError carries a 400 status and a success:false body', async () => {
        try {
            await requireUrlBody(post({}));
            expect.unreachable();
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            expect((err as ApiError).status).toBe(400);
            expect((err as ApiError).body).toMatchObject({ success: false });
        }
    });
});

describe('withCache', () => {
    it('computes once and serves the cached value on the second call', async () => {
        const compute = vi.fn().mockResolvedValue({ status: 'ok', value: 1 });
        const key = `withcache-${Math.random()}`;

        const first = await withCache('test', key, compute);
        const second = await withCache('test', key, compute);

        expect(first).toEqual({ status: 'ok', value: 1 });
        expect(second).toEqual({ status: 'ok', value: 1 });
        expect(compute).toHaveBeenCalledTimes(1);
    });

    it('does not cache a non-ok result by default, so the next call recomputes', async () => {
        const compute = vi.fn().mockResolvedValue({ status: 'error' });
        const key = `withcache-${Math.random()}`;

        await withCache('test', key, compute);
        await withCache('test', key, compute);

        expect(compute).toHaveBeenCalledTimes(2);
    });

    it('honors a custom shouldCache predicate', async () => {
        const compute = vi.fn().mockResolvedValue({ status: 'skipped' });
        const key = `withcache-${Math.random()}`;

        await withCache('test', key, compute, { shouldCache: () => true });
        await withCache('test', key, compute, { shouldCache: () => true });

        expect(compute).toHaveBeenCalledTimes(1);
    });

    it('accepts a ttlMs resolver function computed from the result (D11)', async () => {
        vi.useFakeTimers();
        const compute = vi.fn<() => Promise<{ status: string }>>().mockResolvedValue({ status: 'partial' });
        const key = `withcache-${Math.random()}`;

        await withCache('test', key, compute, {
            shouldCache: () => true,
            ttlMs: (result) => (result.status === 'partial' ? 1000 : 60000),
        });

        vi.advanceTimersByTime(1001);
        await withCache('test', key, compute, { shouldCache: () => true });

        expect(compute).toHaveBeenCalledTimes(2); // expired after the short partial-result TTL
        vi.useRealTimers();
    });
});

describe('pollUntil', () => {
    it('stops as soon as fn returns non-null', async () => {
        const fn = vi.fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce('done');

        const result = await pollUntil(fn, { attempts: 5, intervalMs: 1 });
        expect(result).toBe('done');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('returns null once the attempt budget is exhausted', async () => {
        const fn = vi.fn().mockResolvedValue(null);
        const result = await pollUntil(fn, { attempts: 3, intervalMs: 1 });
        expect(result).toBeNull();
        expect(fn).toHaveBeenCalledTimes(3);
    });
});

describe('ssrfBlockedResponse', () => {
    it('is a 400 with success:false and blocked:true', async () => {
        const res = ssrfBlockedResponse();
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toMatchObject({ success: false, blocked: true });
    });
});

describe('enforceRateLimit', () => {
    const req = (ip: string) => new NextRequest('http://localhost/api/x', { headers: { 'x-real-ip': ip } });

    it('returns null (allowed) then a 429 NextResponse once the bucket is exhausted', () => {
        const routeName = `route-${Math.random()}`;
        const ip = 'a.b.c.d';
        for (let i = 0; i < 10; i++) {
            expect(enforceRateLimit(routeName, req(ip))).toBeNull();
        }
        const blocked = enforceRateLimit(routeName, req(ip));
        expect(blocked).not.toBeNull();
        expect(blocked?.status).toBe(429);
    });

    it('buckets independently per route name for the same client', () => {
        const ip = `same-client-${Math.random()}`;
        for (let i = 0; i < 10; i++) enforceRateLimit('routeA', req(ip));
        expect(enforceRateLimit('routeA', req(ip))).not.toBeNull(); // routeA exhausted
        expect(enforceRateLimit('routeB', req(ip))).toBeNull(); // routeB untouched
    });
});
