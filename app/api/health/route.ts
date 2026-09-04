import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { cleanKey, enforceRateLimit, fetchWithTimeout } from '@/lib/server/apiHelpers';

// /status is an intentionally public live-status page (see README) - by
// default this route's per-service detail (including which optional keys
// aren't configured) is meant to be visible. An operator who'd rather not
// disclose that can set HEALTH_TOKEN; unset (the default), behavior is
// unchanged from before this gate existed. /status itself can't hold that
// server secret, so it forwards a ?token= query param as the same header
// this route checks (see app/status/page.tsx) - anonymous visitors without
// it still get the redacted, aggregate view.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface ServiceStatus {
    status: 'online' | 'offline' | 'error' | 'no_key';
    latency: number;
    message: string;
}

interface Service {
    name: string;
    keyEnvVar: string;
    check: (apiKey: string) => Promise<{ ok: boolean; message: string }>;
}

const SERVICES: Service[] = [
    {
        name: 'virustotal',
        keyEnvVar: 'VIRUSTOTAL_API_KEY',
        check: async (apiKey) => {
            const res = await fetchWithTimeout('https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8', {
                headers: { 'x-apikey': apiKey },
            });
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        },
    },
    {
        name: 'urlscan',
        keyEnvVar: 'URLSCAN_API_KEY',
        check: async (apiKey) => {
            const res = await fetchWithTimeout('https://urlscan.io/user/quotas/', {
                headers: { 'API-Key': apiKey },
            });
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        },
    },
    {
        name: 'safebrowsing',
        keyEnvVar: 'GOOGLE_SAFE_BROWSING_API_KEY',
        check: async (apiKey) => {
            const res = await fetchWithTimeout(
                `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client: { clientId: 'linkguard', clientVersion: '1.0.0' },
                        threatInfo: {
                            threatTypes: ['MALWARE'],
                            platformTypes: ['ANY_PLATFORM'],
                            threatEntryTypes: ['URL'],
                            threatEntries: [{ url: 'https://example.com' }],
                        },
                    }),
                }
            );
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        },
    },
    {
        name: 'urlhaus',
        keyEnvVar: 'URLHAUS_AUTH_KEY',
        check: async (apiKey) => {
            const form = new URLSearchParams();
            form.append('url', 'https://example.com');
            const res = await fetchWithTimeout('https://urlhaus-api.abuse.ch/v1/url/', {
                method: 'POST',
                headers: { 'Auth-Key': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: form,
            });
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        },
    },
    {
        name: 'abuseipdb',
        keyEnvVar: 'ABUSEIPDB_API_KEY',
        check: async (apiKey) => {
            const res = await fetchWithTimeout('https://api.abuseipdb.com/api/v2/check?ipAddress=8.8.8.8', {
                headers: { Key: apiKey, Accept: 'application/json' },
            });
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        },
    },
];

async function checkService(service: Service): Promise<ServiceStatus> {
    const apiKey = cleanKey(process.env[service.keyEnvVar]);
    if (!apiKey) {
        return { status: 'no_key', latency: 0, message: 'مفتاح API غير مضبوط' };
    }

    const start = Date.now();
    try {
        const { ok, message } = await service.check(apiKey);
        return { status: ok ? 'online' : 'error', latency: Date.now() - start, message };
    } catch (e) {
        return { status: 'offline', latency: 0, message: e instanceof Error ? e.message : 'خطأ غير معروف' };
    }
}

/** With HEALTH_TOKEN configured, an anonymous (or wrong-token) request only
 * learns whether each source is reachable - not which optional keys are
 * unconfigured, nor per-service error text/latency. */
function redact(status: ServiceStatus): ServiceStatus {
    return {
        status: status.status === 'online' ? 'online' : 'offline',
        latency: 0,
        message: '',
    };
}

function isAuthorized(request: NextRequest): boolean {
    const configuredToken = cleanKey(process.env.HEALTH_TOKEN);
    if (!configuredToken) return true; // gate not enabled - default, fully public

    const presentedToken = cleanKey(request.headers.get('x-health-token') ?? undefined);
    const a = Buffer.from(presentedToken);
    const b = Buffer.from(configuredToken);
    // timingSafeEqual throws on unequal-length buffers rather than returning
    // false, and a length mismatch is itself not a secret worth protecting -
    // the != check short-circuits before ever touching timing-sensitive
    // comparison logic.
    return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
    const rateLimited = enforceRateLimit('health', request, { maxRequests: 20, windowMs: 5 * 60 * 1000 });
    if (rateLimited) return rateLimited;

    const authorized = isAuthorized(request);
    const statuses = await Promise.all(SERVICES.map(checkService));

    const result = Object.fromEntries(
        SERVICES.map((service, i) => [service.name, authorized ? statuses[i] : redact(statuses[i]!)])
    );

    return NextResponse.json(result);
}
