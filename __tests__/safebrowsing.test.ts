import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

let POST: typeof import('@/app/api/safebrowsing/route').POST;

beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
});

function request(url: string, ip = `sb-${Math.random()}`) {
    return new NextRequest('http://localhost/api/safebrowsing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
        body: JSON.stringify({ url }),
    });
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('POST /api/safebrowsing', () => {
    it('reports skipped when no API key is configured', async () => {
        delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
        ({ POST } = await import('@/app/api/safebrowsing/route'));

        const res = await POST(request('https://example.com'));
        const data = await res.json();

        expect(data).toEqual({ success: true, status: 'skipped', matches: [] });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('rejects a missing url with 400', async () => {
        ({ POST } = await import('@/app/api/safebrowsing/route'));
        const res = await POST(request(''));
        expect(res.status).toBe(400);
    });

    it('reports matches on a hit', async () => {
        process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-key';
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
            jsonResponse({ matches: [{ threatType: 'SOCIAL_ENGINEERING' }] })
        );
        ({ POST } = await import('@/app/api/safebrowsing/route'));

        const res = await POST(request('https://phish.example'));
        const data = await res.json();

        expect(data).toEqual({ success: true, status: 'ok', matches: ['SOCIAL_ENGINEERING'] });
    });

    it('reports ok with no matches on a clean lookup', async () => {
        process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-key';
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}));
        ({ POST } = await import('@/app/api/safebrowsing/route'));

        const res = await POST(request('https://clean.example'));
        const data = await res.json();

        expect(data).toEqual({ success: true, status: 'ok', matches: [] });
    });

    it('reports error status (not a 500) when the upstream call fails', async () => {
        process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-key';
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 500 }));
        ({ POST } = await import('@/app/api/safebrowsing/route'));

        const res = await POST(request('https://example.com'));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toEqual({ success: true, status: 'error', matches: [] });
    });

    it('caches a successful lookup for the same url', async () => {
        process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-key';
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        fetchMock.mockResolvedValue(jsonResponse({}));
        ({ POST } = await import('@/app/api/safebrowsing/route'));

        await POST(request('https://cached-example.com'));
        const callsAfterFirst = fetchMock.mock.calls.length;
        await POST(request('https://cached-example.com'));

        expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
    });

    it('is rate-limited', async () => {
        process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-key';
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}));
        ({ POST } = await import('@/app/api/safebrowsing/route'));

        const ip = `sb-rate-${Math.random()}`;
        const statuses: number[] = [];
        for (let i = 0; i < 11; i++) {
            const res = await POST(request(`https://example.com/${i}`, ip));
            statuses.push(res.status);
        }
        expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
    });
});
