import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

let GET: typeof import('@/app/api/health/route').GET;

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    delete process.env.HEALTH_TOKEN;
    delete process.env.VIRUSTOTAL_API_KEY;
});

function request(headers: Record<string, string> = {}) {
    return new NextRequest('http://localhost/api/health', { headers: { 'x-real-ip': `health-${Math.random()}`, ...headers } });
}

describe('GET /api/health', () => {
    it('reveals full per-service detail when HEALTH_TOKEN is unset (default: fully public)', async () => {
        process.env.VIRUSTOTAL_API_KEY = 'key';
        ({ GET } = await import('@/app/api/health/route'));

        const res = await GET(request());
        const data = await res.json();

        expect(data.virustotal.status).toBe('online');
        expect(data.virustotal.latency).toBeGreaterThanOrEqual(0);
        expect(data.abuseipdb.status).toBe('no_key');
        expect(data.abuseipdb.message).toBe('مفتاح API غير مضبوط');
    });

    it('redacts detail for an anonymous request once HEALTH_TOKEN is set', async () => {
        process.env.HEALTH_TOKEN = 'secret-token';
        process.env.VIRUSTOTAL_API_KEY = 'key';
        ({ GET } = await import('@/app/api/health/route'));

        const res = await GET(request());
        const data = await res.json();

        expect(data.virustotal.status).toBe('online');
        expect(data.virustotal.message).toBe('');
        expect(data.virustotal.latency).toBe(0);
        // The no_key distinction (which reveals unconfigured keys) collapses to 'offline'.
        expect(data.abuseipdb.status).toBe('offline');
        expect(data.abuseipdb.message).toBe('');
    });

    it('reveals full detail when the correct x-health-token header is sent', async () => {
        process.env.HEALTH_TOKEN = 'secret-token';
        process.env.VIRUSTOTAL_API_KEY = 'key';
        ({ GET } = await import('@/app/api/health/route'));

        const res = await GET(request({ 'x-health-token': 'secret-token' }));
        const data = await res.json();

        expect(data.virustotal.status).toBe('online');
        expect(data.virustotal.latency).toBeGreaterThanOrEqual(0);
    });

    it('still redacts with a wrong token', async () => {
        process.env.HEALTH_TOKEN = 'secret-token';
        ({ GET } = await import('@/app/api/health/route'));

        const res = await GET(request({ 'x-health-token': 'wrong' }));
        const data = await res.json();

        expect(data.virustotal.message).toBe('');
    });

    it('is rate-limited', async () => {
        ({ GET } = await import('@/app/api/health/route'));
        const ip = `health-rate-${Math.random()}`;
        const statuses: number[] = [];
        for (let i = 0; i < 21; i++) {
            const res = await GET(request({ 'x-real-ip': ip }));
            statuses.push(res.status);
        }
        expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
    });
});
