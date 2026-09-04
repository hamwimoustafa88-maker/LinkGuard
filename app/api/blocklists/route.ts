import { NextRequest, NextResponse } from 'next/server';
import { ApiError, cleanKey, enforceRateLimit, fetchWithTimeout, internalErrorResponse, requireUrlBody, withCache } from '@/lib/server/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 20;

interface SubResult {
    status: 'ok' | 'skipped' | 'error';
    listed: boolean;
    detail?: string;
}

async function checkUrlhaus(url: string): Promise<SubResult> {
    const authKey = cleanKey(process.env.URLHAUS_AUTH_KEY);
    if (!authKey) return { status: 'skipped', listed: false };

    try {
        const form = new URLSearchParams();
        form.append('url', url);

        const res = await fetchWithTimeout('https://urlhaus-api.abuse.ch/v1/url/', {
            method: 'POST',
            headers: { 'Auth-Key': authKey, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
        });

        if (!res.ok) return { status: 'error', listed: false };
        const data = await res.json();

        if (data.query_status === 'ok') {
            return { status: 'ok', listed: true, detail: data.threat || 'malware' };
        }
        if (data.query_status === 'no_results') {
            return { status: 'ok', listed: false };
        }
        return { status: 'error', listed: false };
    } catch {
        return { status: 'error', listed: false };
    }
}

async function checkPhishtank(url: string): Promise<SubResult> {
    const appKey = cleanKey(process.env.PHISHTANK_APP_KEY);
    try {
        const form = new URLSearchParams();
        form.append('url', Buffer.from(url).toString('base64'));
        form.append('format', 'json');
        if (appKey) form.append('app_key', appKey);

        const res = await fetchWithTimeout('https://checkurl.phishtank.com/checkurl/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
        });

        if (!res.ok) return { status: 'error', listed: false };
        const data = await res.json();
        const results = data.results;
        if (!results) return { status: 'error', listed: false };

        const listed = Boolean(results.in_database && results.valid);
        return { status: 'ok', listed };
    } catch {
        return { status: 'error', listed: false };
    }
}

async function checkAbuseIpdb(ip: string): Promise<SubResult & { score?: number }> {
    const apiKey = cleanKey(process.env.ABUSEIPDB_API_KEY);
    if (!apiKey) return { status: 'skipped', listed: false };

    try {
        const res = await fetchWithTimeout(
            `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`,
            { headers: { Key: apiKey, Accept: 'application/json' } }
        );

        if (!res.ok) return { status: 'error', listed: false };
        const data = await res.json();
        const score = data.data?.abuseConfidenceScore ?? 0;
        return { status: 'ok', listed: score >= 50, score };
    } catch {
        return { status: 'error', listed: false };
    }
}

const settle = <T,>(r: PromiseSettledResult<T>, fallback: T): T => (r.status === 'fulfilled' ? r.value : fallback);

export async function POST(request: NextRequest) {
    const rateLimited = enforceRateLimit('blocklists', request);
    if (rateLimited) return rateLimited;

    try {
        const { url, ip } = await requireUrlBody<{ url: string; ip?: string }>(request);

        const result = await withCache(
            'blocklists',
            `${url}|${ip || ''}`,
            async () => {
                const [urlhaus, phishtank, abuseipdb] = await Promise.allSettled([
                    checkUrlhaus(url),
                    checkPhishtank(url),
                    ip ? checkAbuseIpdb(ip) : Promise.resolve({ status: 'skipped' as const, listed: false }),
                ]);

                return {
                    success: true as const,
                    urlhaus: settle(urlhaus, { status: 'error' as const, listed: false }),
                    phishtank: settle(phishtank, { status: 'error' as const, listed: false }),
                    abuseipdb: settle(abuseipdb, { status: 'error' as const, listed: false }),
                };
            },
            {
                // Cache a clean run for 15 min; a run with any sub-source error
                // only for 60s, so a transient upstream blip doesn't get pinned
                // in place of a real answer for the full TTL.
                shouldCache: () => true,
                ttlMs: (result) => {
                    const allOk = [result.urlhaus, result.phishtank, result.abuseipdb].every((r) => r.status !== 'error');
                    return allOk ? 15 * 60 * 1000 : 60 * 1000;
                },
            }
        );

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(error.body, { status: error.status });
        }
        return internalErrorResponse('فشل فحص القوائم السوداء');
    }
}
