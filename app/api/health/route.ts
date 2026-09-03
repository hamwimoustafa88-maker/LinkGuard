import { NextRequest, NextResponse } from 'next/server';
import { cleanKey, enforceRateLimit, fetchWithTimeout } from '@/lib/server/apiHelpers';

// /status is an intentionally public live-status page (see README) - by
// default this route's per-service detail (including which optional keys
// aren't configured) is meant to be visible. An operator who'd rather not
// disclose that can set HEALTH_TOKEN; unset (the default), behavior is
// unchanged from before this gate existed. Either way, the route is now
// rate-limited, which is the part that was actually unprotected.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface ServiceStatus {
    status: 'online' | 'offline' | 'error' | 'no_key';
    latency: number;
    message: string;
}

async function checkKeyedService(
    keyEnvVar: string,
    check: () => Promise<{ ok: boolean; message: string }>
): Promise<ServiceStatus> {
    if (!process.env[keyEnvVar]) {
        return { status: 'no_key', latency: 0, message: 'مفتاح API غير مضبوط' };
    }

    const start = Date.now();
    try {
        const { ok, message } = await check();
        const latency = Date.now() - start;
        return { status: ok ? 'online' : 'error', latency, message };
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

export async function GET(request: NextRequest) {
    const rateLimited = enforceRateLimit('health', request, { maxRequests: 20, windowMs: 5 * 60 * 1000 });
    if (rateLimited) return rateLimited;

    const configuredToken = cleanKey(process.env.HEALTH_TOKEN);
    const authorized = !configuredToken || cleanKey(request.headers.get('x-health-token') ?? undefined) === configuredToken;

    const [virustotal, urlscan, safebrowsing, urlhaus, abuseipdb] = await Promise.all([
        checkKeyedService('VIRUSTOTAL_API_KEY', async () => {
            const res = await fetchWithTimeout('https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8', {
                headers: { 'x-apikey': cleanKey(process.env.VIRUSTOTAL_API_KEY) },
            });
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        }),
        checkKeyedService('URLSCAN_API_KEY', async () => {
            const res = await fetchWithTimeout('https://urlscan.io/user/quotas/', {
                headers: { 'API-Key': cleanKey(process.env.URLSCAN_API_KEY) },
            });
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        }),
        checkKeyedService('GOOGLE_SAFE_BROWSING_API_KEY', async () => {
            const res = await fetchWithTimeout(
                `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(cleanKey(process.env.GOOGLE_SAFE_BROWSING_API_KEY))}`,
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
        }),
        checkKeyedService('URLHAUS_AUTH_KEY', async () => {
            const form = new URLSearchParams();
            form.append('url', 'https://example.com');
            const res = await fetchWithTimeout('https://urlhaus-api.abuse.ch/v1/url/', {
                method: 'POST',
                headers: { 'Auth-Key': cleanKey(process.env.URLHAUS_AUTH_KEY), 'Content-Type': 'application/x-www-form-urlencoded' },
                body: form,
            });
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        }),
        checkKeyedService('ABUSEIPDB_API_KEY', async () => {
            const res = await fetchWithTimeout('https://api.abuseipdb.com/api/v2/check?ipAddress=8.8.8.8', {
                headers: { Key: cleanKey(process.env.ABUSEIPDB_API_KEY), Accept: 'application/json' },
            });
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        }),
    ]);

    const result = { virustotal, urlscan, safebrowsing, urlhaus, abuseipdb };
    if (authorized) {
        return NextResponse.json(result);
    }

    return NextResponse.json({
        virustotal: redact(virustotal),
        urlscan: redact(urlscan),
        safebrowsing: redact(safebrowsing),
        urlhaus: redact(urlhaus),
        abuseipdb: redact(abuseipdb),
    });
}
