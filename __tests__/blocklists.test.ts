import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

let POST: typeof import('@/app/api/blocklists/route').POST;

beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.URLHAUS_AUTH_KEY;
    delete process.env.PHISHTANK_APP_KEY;
    delete process.env.ABUSEIPDB_API_KEY;
});

function request(url: string, ip = `bl-${Math.random()}`, body: Record<string, unknown> = {}) {
    return new NextRequest('http://localhost/api/blocklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
        body: JSON.stringify({ url, ...body }),
    });
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('POST /api/blocklists', () => {
    it('rejects a missing url with 400', async () => {
        ({ POST } = await import('@/app/api/blocklists/route'));
        const res = await POST(request(''));
        expect(res.status).toBe(400);
    });

    it('skips urlhaus/abuseipdb when no key/ip is configured, but still checks phishtank (no key required)', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ results: { in_database: false, valid: false } }));
        ({ POST } = await import('@/app/api/blocklists/route'));

        const res = await POST(request('https://example.com'));
        const data = await res.json();

        expect(data.success).toBe(true);
        expect(data.urlhaus).toEqual({ status: 'skipped', listed: false });
        expect(data.abuseipdb).toEqual({ status: 'skipped', listed: false });
        expect(data.phishtank).toEqual({ status: 'ok', listed: false });
    });

    it('reports a urlhaus hit as listed:true with a threat detail', async () => {
        process.env.URLHAUS_AUTH_KEY = 'key';
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        fetchMock.mockImplementation((input: string) => {
            if (String(input).includes('urlhaus')) {
                return Promise.resolve(jsonResponse({ query_status: 'ok', threat: 'malware_download' }));
            }
            return Promise.resolve(jsonResponse({ results: { in_database: false, valid: false } }));
        });
        ({ POST } = await import('@/app/api/blocklists/route'));

        const res = await POST(request('https://malicious.example'));
        const data = await res.json();

        expect(data.urlhaus).toEqual({ status: 'ok', listed: true, detail: 'malware_download' });
    });

    it('reports an abuseipdb hit as listed:true once score crosses 50', async () => {
        process.env.ABUSEIPDB_API_KEY = 'key';
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        fetchMock.mockImplementation((input: string) => {
            if (String(input).includes('abuseipdb')) {
                return Promise.resolve(jsonResponse({ data: { abuseConfidenceScore: 80 } }));
            }
            return Promise.resolve(jsonResponse({ results: { in_database: false, valid: false } }));
        });
        ({ POST } = await import('@/app/api/blocklists/route'));

        const res = await POST(request('https://example.com', undefined, { ip: '1.2.3.4' }));
        const data = await res.json();

        expect(data.abuseipdb).toEqual({ status: 'ok', listed: true, score: 80 });
    });

    it('does not fail the whole request when one sub-source errors', async () => {
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        fetchMock.mockImplementation((input: string) => {
            if (String(input).includes('phishtank')) {
                return Promise.reject(new Error('network down'));
            }
            return Promise.resolve(jsonResponse({}));
        });
        ({ POST } = await import('@/app/api/blocklists/route'));

        const res = await POST(request('https://example.com'));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.phishtank.status).toBe('error');
    });

    it('is rate-limited', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ results: { in_database: false, valid: false } }));
        ({ POST } = await import('@/app/api/blocklists/route'));

        const ip = `bl-rate-${Math.random()}`;
        const statuses: number[] = [];
        for (let i = 0; i < 11; i++) {
            const res = await POST(request(`https://example.com/${i}`, ip));
            statuses.push(res.status);
        }
        expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
    });
});
