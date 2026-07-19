import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet, cacheKey } from '@/lib/server/cache';

export const maxDuration = 20;

interface SubResult {
    status: 'ok' | 'skipped' | 'error';
    listed: boolean;
    detail?: string;
}

// يزيل أي مسافات/أسطر جديدة من المفتاح — قيم الأسطر الجديدة غير مسموحة في HTTP headers
function cleanKey(value: string | undefined): string {
    return (value || '').replace(/\s+/g, '');
}

async function checkUrlhaus(url: string): Promise<SubResult> {
    const authKey = cleanKey(process.env.URLHAUS_AUTH_KEY);
    if (!authKey) return { status: 'skipped', listed: false };

    try {
        const form = new URLSearchParams();
        form.append('url', url);

        const res = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
            method: 'POST',
            headers: { 'Auth-Key': authKey, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
            signal: AbortSignal.timeout(8000),
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

        const res = await fetch('https://checkurl.phishtank.com/checkurl/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
            signal: AbortSignal.timeout(8000),
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
        const res = await fetch(
            `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`,
            {
                headers: { Key: apiKey, Accept: 'application/json' },
                signal: AbortSignal.timeout(8000),
            }
        );

        if (!res.ok) return { status: 'error', listed: false };
        const data = await res.json();
        const score = data.data?.abuseConfidenceScore ?? 0;
        return { status: 'ok', listed: score >= 50, score };
    } catch {
        return { status: 'error', listed: false };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { url, ip } = await request.json();
        if (!url) {
            return NextResponse.json({ success: false, error: 'عنوان URL مطلوب' }, { status: 400 });
        }

        const key = cacheKey('blocklists', `${url}|${ip || ''}`);
        const cached = cacheGet<Record<string, unknown>>(key);
        if (cached) {
            return NextResponse.json(cached);
        }

        const [urlhaus, phishtank, abuseipdb] = await Promise.allSettled([
            checkUrlhaus(url),
            checkPhishtank(url),
            ip ? checkAbuseIpdb(ip) : Promise.resolve({ status: 'skipped' as const, listed: false }),
        ]);

        const settle = <T,>(r: PromiseSettledResult<T>, fallback: T): T => (r.status === 'fulfilled' ? r.value : fallback);

        const result = {
            success: true,
            urlhaus: settle(urlhaus, { status: 'error' as const, listed: false }),
            phishtank: settle(phishtank, { status: 'error' as const, listed: false }),
            abuseipdb: settle(abuseipdb, { status: 'error' as const, listed: false }),
        };

        cacheSet(key, result);
        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ success: false, error: 'فشل فحص القوائم السوداء' }, { status: 500 });
    }
}
