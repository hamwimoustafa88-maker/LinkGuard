import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

let POST: typeof import('@/app/api/virustotal/route').POST;

beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
    process.env.VIRUSTOTAL_API_KEY = 'test-key';
    ({ POST } = await import('@/app/api/virustotal/route'));
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.VIRUSTOTAL_API_KEY;
});

function request(url: string) {
    return new NextRequest('http://localhost/api/virustotal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('POST /api/virustotal', () => {
    it('reports skipped when no API key is configured', async () => {
        delete process.env.VIRUSTOTAL_API_KEY;
        vi.resetModules();
        ({ POST } = await import('@/app/api/virustotal/route'));

        const res = await POST(request('https://example.com'));
        const data = await res.json();
        expect(data).toEqual({ success: true, status: 'skipped' });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('rejects a missing url with 400', async () => {
        const res = await POST(request(''));
        expect(res.status).toBe(400);
    });

    it('D6: returns vtEngines and vtUrlMeta as distinct fields from a completed analysis', async () => {
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        fetchMock
            // Step 1: submit
            .mockResolvedValueOnce(jsonResponse({ data: { id: 'analysis-1' } }))
            // Step 2: poll - completed on the first attempt
            .mockResolvedValueOnce(jsonResponse({
                data: {
                    attributes: {
                        status: 'completed',
                        stats: { malicious: 1, suspicious: 0, harmless: 60, undetected: 5 },
                        results: {
                            EngineA: { category: 'malicious', result: 'phishing', method: 'blacklist', engine_name: 'EngineA' },
                            EngineB: { category: 'harmless', result: 'clean', method: 'blacklist', engine_name: 'EngineB' },
                        },
                    },
                },
                meta: { url_info: { id: 'url-meta-id' } },
            }))
            // Step 3: url metadata lookup
            .mockResolvedValueOnce(jsonResponse({
                data: {
                    attributes: {
                        last_analysis_results: {},
                        title: 'Example Domain',
                        tags: ['test'],
                        categories: {},
                        reputation: 5,
                        times_submitted: 100,
                        first_submission_date: 1000,
                        last_submission_date: 2000,
                        total_votes: { harmless: 3, malicious: 1 },
                    },
                },
            }));

        const res = await POST(request('https://example.com'));
        const data = await res.json();

        expect(data.success).toBe(true);
        expect(data.status).toBe('ok');
        expect(data.stats).toEqual({ malicious: 1, suspicious: 0, harmless: 60, undetected: 5 });

        // The pre-fix shape bolted `meta` onto `details.scans` (which the API
        // never populated) - this asserts the two are now separate, correctly
        // shaped top-level fields instead.
        expect(data.vtEngines).toEqual({
            EngineA: { category: 'malicious', result: 'phishing', method: 'blacklist', engine_name: 'EngineA' },
            EngineB: { category: 'harmless', result: 'clean', method: 'blacklist', engine_name: 'EngineB' },
        });
        expect(data.vtUrlMeta).toMatchObject({ title: 'Example Domain', reputation: 5 });
        expect(data.scanId).toBe('url-meta-id');
    });

    it('reports a timeout status (not an error) when analysis never completes', async () => {
        vi.useFakeTimers();
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        fetchMock.mockResolvedValueOnce(jsonResponse({ data: { id: 'analysis-1' } }));
        // Every poll attempt reports "queued", never "completed" - a fresh
        // Response each call, since a Response body can only be read once.
        fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ data: { attributes: { status: 'queued' } } })));

        const resultPromise = POST(request('https://example.com'));
        // 12 attempts * 2s poll interval = 24s max before giving up.
        await vi.advanceTimersByTimeAsync(25000);
        const data = await (await resultPromise).json();

        expect(data).toEqual({ success: true, status: 'error', reason: 'timeout' });
    });

    it('reports rate_limited on a 429 from the submit step', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(new Response(null, { status: 429 }));

        const res = await POST(request('https://example.com'));
        const data = await res.json();

        expect(data).toEqual({ success: true, status: 'error', reason: 'rate_limited' });
    });

    it('caches a successful result for the same url', async () => {
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        fetchMock
            .mockResolvedValueOnce(jsonResponse({ data: { id: 'analysis-1' } }))
            .mockResolvedValueOnce(jsonResponse({
                data: { attributes: { status: 'completed', stats: { malicious: 0, suspicious: 0, harmless: 10, undetected: 0 }, results: {} } },
            }));

        await POST(request('https://cached-example.com'));
        const callsAfterFirst = fetchMock.mock.calls.length;

        await POST(request('https://cached-example.com'));
        expect(fetchMock.mock.calls.length).toBe(callsAfterFirst); // no new fetches - served from cache
    });
});
