import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// domaininfo's SSL check opens a raw tls.connect() socket, which isn't
// mocked here - these cases use http:// targets specifically, so
// `validated.protocol === 'https:'` is false and the SSL branch is
// skipped ('status: skipped') without ever touching the network.

let POST: typeof import('@/app/api/domaininfo/route').POST;

beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
    ({ POST } = await import('@/app/api/domaininfo/route'));
});

afterEach(() => {
    vi.unstubAllGlobals();
});

function request(url: string, ip = `di-${Math.random()}`) {
    return new NextRequest('http://localhost/api/domaininfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
        body: JSON.stringify({ url }),
    });
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('POST /api/domaininfo', () => {
    it('rejects a missing url with 400', async () => {
        const res = await POST(request(''));
        expect(res.status).toBe(400);
    });

    it('blocks a private IP literal target', async () => {
        const res = await POST(request('http://127.0.0.1/'));
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data).toMatchObject({ success: false, blocked: true });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('reports domain age from a registration event', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({
            events: [{ eventAction: 'registration', eventDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() }],
            entities: [{ roles: ['registrar'], vcardArray: ['vcard', [['fn', {}, 'text', 'Example Registrar']]] }],
        }));

        const res = await POST(request('http://example.com/'));
        const data = await res.json();

        expect(data.success).toBe(true);
        expect(data.domainAge.status).toBe('ok');
        expect(data.domainAge.info.ageDays).toBeGreaterThanOrEqual(99);
        expect(data.domainAge.info.registrar).toBe('Example Registrar');
        // http:// target - SSL check is skipped, not attempted.
        expect(data.ssl).toEqual({ status: 'skipped' });
    });

    it('reports skipped domain age on a 404 (unregistered / no RDAP record)', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 404 }));

        const res = await POST(request('http://example.com/'));
        const data = await res.json();

        expect(data.domainAge).toEqual({ status: 'skipped' });
    });

    it('reports error status (not a 500) when the RDAP lookup fails', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 500 }));

        const res = await POST(request('http://example.com/'));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.domainAge).toEqual({ status: 'error' });
    });

    it('caches a clean result for the same hostname', async () => {
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        fetchMock.mockResolvedValue(jsonResponse({ events: [] }));

        await POST(request('http://cached-domaininfo.example/'));
        const callsAfterFirst = fetchMock.mock.calls.length;
        await POST(request('http://cached-domaininfo.example/path2'));

        expect(fetchMock.mock.calls.length).toBe(callsAfterFirst); // same hostname - cache hit
    });

    it('is rate-limited', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ events: [] }));

        const ip = `di-rate-${Math.random()}`;
        const statuses: number[] = [];
        for (let i = 0; i < 11; i++) {
            const res = await POST(request(`http://example${i}.com/`, ip));
            statuses.push(res.status);
        }
        expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
    });
});
