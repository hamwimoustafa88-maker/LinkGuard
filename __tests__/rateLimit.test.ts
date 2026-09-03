import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, getClientId } from '@/lib/server/rateLimit';

describe('checkRateLimit', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
    });

    it('allows up to maxRequests within a window, then blocks', () => {
        const id = `bucket-${Math.random()}`;
        for (let i = 0; i < 5; i++) {
            expect(checkRateLimit(id, { maxRequests: 5, windowMs: 1000 }).allowed).toBe(true);
        }
        const blocked = checkRateLimit(id, { maxRequests: 5, windowMs: 1000 });
        expect(blocked.allowed).toBe(false);
        expect(blocked.retryAfterMs).toBeGreaterThan(0);
    });

    it('does not allow a fresh 2x burst right at the window boundary (sliding, not fixed)', () => {
        const id = `bucket-${Math.random()}`;
        const opts = { maxRequests: 10, windowMs: 1000 };

        // Use up the full budget right at the start of window 1.
        for (let i = 0; i < 10; i++) checkRateLimit(id, opts);

        // Jump to just past the window boundary - a fixed window resets the
        // count to 0 here and allows a fresh burst of 10 (20 total within
        // ~1ms). The sliding approximation still heavily weights the prior
        // window's count, so only a couple more requests should slip through
        // right at the edge, not a full fresh budget.
        vi.setSystemTime(1001);
        let allowedAtBoundary = 0;
        for (let i = 0; i < 10; i++) {
            if (checkRateLimit(id, opts).allowed) allowedAtBoundary++;
        }
        expect(allowedAtBoundary).toBeLessThan(5);
    });

    it('recovers full budget once a full window has fully elapsed', () => {
        const id = `bucket-${Math.random()}`;
        const opts = { maxRequests: 3, windowMs: 1000 };
        for (let i = 0; i < 3; i++) checkRateLimit(id, opts);
        expect(checkRateLimit(id, opts).allowed).toBe(false);

        vi.setSystemTime(2001); // two full windows later
        expect(checkRateLimit(id, opts).allowed).toBe(true);
    });

    it('keeps independent buckets per id', () => {
        const opts = { maxRequests: 1, windowMs: 1000 };
        expect(checkRateLimit('a', opts).allowed).toBe(true);
        expect(checkRateLimit('a', opts).allowed).toBe(false);
        expect(checkRateLimit('b', opts).allowed).toBe(true);
    });

    it('falls back to the documented defaults (10 per 5 minutes) with no options', () => {
        const id = `bucket-${Math.random()}`;
        for (let i = 0; i < 10; i++) {
            expect(checkRateLimit(id).allowed).toBe(true);
        }
        expect(checkRateLimit(id).allowed).toBe(false);
    });
});

describe('getClientId', () => {
    const withHeaders = (headers: Record<string, string>) => new Request('http://localhost', { headers });

    it('prefers x-real-ip first', () => {
        expect(getClientId(withHeaders({ 'x-real-ip': ' 1.1.1.1 ', 'cf-connecting-ip': '2.2.2.2', 'x-forwarded-for': '3.3.3.3' }))).toBe('1.1.1.1');
    });

    it('falls back to cf-connecting-ip next', () => {
        expect(getClientId(withHeaders({ 'cf-connecting-ip': '2.2.2.2', 'x-forwarded-for': '3.3.3.3' }))).toBe('2.2.2.2');
    });

    it('falls back to the first hop of x-forwarded-for last', () => {
        expect(getClientId(withHeaders({ 'x-forwarded-for': '3.3.3.3, 4.4.4.4' }))).toBe('3.3.3.3');
    });

    it('returns "unknown" with no identifying headers at all', () => {
        expect(getClientId(withHeaders({}))).toBe('unknown');
    });
});
