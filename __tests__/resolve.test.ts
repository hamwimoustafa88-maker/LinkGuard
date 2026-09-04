import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Every case below either targets a literal public IP (bypassing DNS
// entirely, since assertPublicHttpUrl short-circuits on net.isIP()) or a
// literal private IP - so the dns module is never actually invoked here.
// A per-test client IP (via x-real-ip) keeps the shared rate-limit bucket
// in lib/server/rateLimit.ts from one test starving the next.

let POST: typeof import('@/app/api/resolve/route').POST;

beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
    ({ POST } = await import('@/app/api/resolve/route'));
});

afterEach(() => {
    vi.unstubAllGlobals();
});

function request(body: unknown, clientIp: string) {
    return new NextRequest('http://localhost/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': clientIp },
        body: JSON.stringify(body),
    });
}

function okResponse(status: number, location?: string) {
    const headers = new Headers();
    if (location) headers.set('location', location);
    return new Response(null, { status, headers });
}

describe('POST /api/resolve', () => {
    it('resolves a direct 200 with a single-hop chain', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okResponse(200));

        const res = await POST(request({ url: 'https://1.2.3.4/' }, 'client-1'));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toMatchObject({ success: true, finalUrl: 'https://1.2.3.4/', truncated: false });
        expect(data.chain).toHaveLength(1);
    });

    it('defaults a schemeless URL to https instead of treating it as invalid', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okResponse(200));

        const res = await POST(request({ url: '1.2.3.4' }, 'client-schemeless'));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toMatchObject({ success: true, finalUrl: 'https://1.2.3.4/' });
    });

    it('follows a single redirect to its target', async () => {
        (fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce(okResponse(302, 'https://5.6.7.8/final'))
            .mockResolvedValueOnce(okResponse(200));

        const res = await POST(request({ url: 'https://1.2.3.4/' }, 'client-2'));
        const data = await res.json();

        expect(data.success).toBe(true);
        expect(data.finalUrl).toBe('https://5.6.7.8/final');
        expect(data.chain).toHaveLength(2);
        expect(data.truncated).toBe(false);
    });

    it('falls back to GET when a hop 405s on HEAD', async () => {
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        fetchMock.mockResolvedValueOnce(okResponse(405)).mockResolvedValueOnce(okResponse(200));

        const res = await POST(request({ url: 'https://1.2.3.4/' }, 'client-3'));
        const data = await res.json();

        expect(data.success).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'HEAD' });
        expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'GET' });
    });

    it('D3: validates the final URL when the 8-hop budget is exhausted mid-redirect', async () => {
        // Every hop redirects to the next public IP in sequence, never
        // terminating - forces the MAX_HOPS budget to run out.
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        for (let i = 0; i < 8; i++) {
            fetchMock.mockResolvedValueOnce(okResponse(302, `https://1.2.3.${i + 2}/`));
        }

        const res = await POST(request({ url: 'https://1.2.3.1/' }, 'client-4'));
        const data = await res.json();

        expect(data.success).toBe(true);
        expect(data.truncated).toBe(true);
        expect(data.chain).toHaveLength(8);
        // The 9th (never-fetched) target was still SSRF-validated before
        // being returned as finalUrl.
        expect(data.finalUrl).toBe('https://1.2.3.9/');
    });

    it('D3: rejects if the hop-budget-exhaustion target is a private address', async () => {
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        for (let i = 0; i < 7; i++) {
            fetchMock.mockResolvedValueOnce(okResponse(302, `https://1.2.3.${i + 2}/`));
        }
        // The 8th hop redirects into a private range - this must be caught
        // even though it's only discovered after the loop, not fetched.
        fetchMock.mockResolvedValueOnce(okResponse(302, 'http://127.0.0.1/admin'));

        const res = await POST(request({ url: 'https://1.2.3.1/' }, 'client-5'));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data).toMatchObject({ success: false, blocked: true });
    });

    it('blocks a private IP literal target outright', async () => {
        const res = await POST(request({ url: 'http://127.0.0.1:8080/' }, 'client-6'));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data).toMatchObject({ success: false, blocked: true });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('rejects a missing url with 400', async () => {
        const res = await POST(request({}, 'client-7'));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.success).toBe(false);
    });

    it('D5: reports failure rather than passing the raw URL through as success', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));

        const res = await POST(request({ url: 'https://1.2.3.4/' }, 'client-8'));
        const data = await res.json();

        expect(res.status).toBe(502);
        expect(data.success).toBe(false);
        expect(data.code).toBe('resolve_failed');
    });

    it('enforces the per-client rate limit independently of other clients', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(okResponse(200));

        const statuses: number[] = [];
        for (let i = 0; i < 11; i++) {
            const res = await POST(request({ url: 'https://1.2.3.4/' }, 'client-rate-limited'));
            statuses.push(res.status);
        }

        expect(statuses.slice(0, 10)).toEqual(Array(10).fill(200));
        expect(statuses[10]).toBe(429);

        // A different client is unaffected by the above.
        const otherRes = await POST(request({ url: 'https://1.2.3.4/' }, 'client-unaffected'));
        expect(otherRes.status).toBe(200);
    });
});
