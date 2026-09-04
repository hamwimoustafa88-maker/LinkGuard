import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

let POST: typeof import('@/app/api/urlscan/route').POST;

beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.URLSCAN_API_KEY;
});

function request(url: string, ip = `us-${Math.random()}`) {
    return new NextRequest('http://localhost/api/urlscan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
        body: JSON.stringify({ url }),
    });
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('POST /api/urlscan', () => {
    it('reports skipped when no API key is configured', async () => {
        delete process.env.URLSCAN_API_KEY;
        ({ POST } = await import('@/app/api/urlscan/route'));

        const res = await POST(request('https://example.com'));
        const data = await res.json();

        expect(data).toEqual({ success: true, status: 'skipped', screenshotUrl: null });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('rejects a missing url with 400', async () => {
        ({ POST } = await import('@/app/api/urlscan/route'));
        const res = await POST(request(''));
        expect(res.status).toBe(400);
    });

    it('returns the screenshot and page info once the scan completes', async () => {
        process.env.URLSCAN_API_KEY = 'test-key';
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        fetchMock
            .mockResolvedValueOnce(jsonResponse({ api: 'https://urlscan.io/api/v1/result/scan-1/' }))
            .mockResolvedValueOnce(jsonResponse({
                task: { screenshotURL: 'https://urlscan.io/screenshots/scan-1.png' },
                page: { country: 'US', ip: '1.2.3.4', server: 'nginx' },
            }));
        ({ POST } = await import('@/app/api/urlscan/route'));

        const res = await POST(request('https://example.com'));
        const data = await res.json();

        expect(data).toEqual({
            success: true,
            status: 'ok',
            screenshotUrl: 'https://urlscan.io/screenshots/scan-1.png',
            country: 'US',
            ip: '1.2.3.4',
            server: 'nginx',
        });
    });

    it('reports timeout when the result never becomes available', async () => {
        vi.useFakeTimers();
        process.env.URLSCAN_API_KEY = 'test-key';
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        fetchMock.mockResolvedValueOnce(jsonResponse({ api: 'https://urlscan.io/api/v1/result/scan-1/' }));
        fetchMock.mockImplementation(() => Promise.resolve(new Response(null, { status: 404 })));
        ({ POST } = await import('@/app/api/urlscan/route'));

        const resultPromise = POST(request('https://example.com'));
        // 5 attempts * 3s poll interval = 15s max before giving up.
        await vi.advanceTimersByTimeAsync(16000);
        const data = await (await resultPromise).json();

        expect(data).toEqual({ success: true, status: 'error', reason: 'timeout', screenshotUrl: null });
    });

    it('reports rate_limited on a 429 from the submit step', async () => {
        process.env.URLSCAN_API_KEY = 'test-key';
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(new Response(null, { status: 429 }));
        ({ POST } = await import('@/app/api/urlscan/route'));

        const res = await POST(request('https://example.com'));
        const data = await res.json();

        expect(data).toEqual({ success: true, status: 'error', reason: 'rate_limited', screenshotUrl: null });
    });

    it('caches a successful scan for the same url', async () => {
        process.env.URLSCAN_API_KEY = 'test-key';
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        fetchMock
            .mockResolvedValueOnce(jsonResponse({ api: 'https://urlscan.io/api/v1/result/scan-2/' }))
            .mockResolvedValueOnce(jsonResponse({ task: {}, page: {} }));
        ({ POST } = await import('@/app/api/urlscan/route'));

        await POST(request('https://cached-urlscan.com'));
        const callsAfterFirst = fetchMock.mock.calls.length;
        await POST(request('https://cached-urlscan.com'));

        expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
    });

    it('is rate-limited', async () => {
        process.env.URLSCAN_API_KEY = 'test-key';
        ({ POST } = await import('@/app/api/urlscan/route'));

        const ip = `us-rate-${Math.random()}`;
        const statuses: number[] = [];
        for (let i = 0; i < 11; i++) {
            const res = await POST(request(`https://example.com/${i}`, ip));
            statuses.push(res.status);
        }
        expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
    });
});
