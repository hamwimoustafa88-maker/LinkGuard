import { NextRequest, NextResponse } from 'next/server';
import { ApiError, cleanKey, enforceRateLimit, fetchWithTimeout, requireUrlBody, withCache } from '@/lib/server/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 15;

export async function POST(request: NextRequest) {
    const rateLimited = enforceRateLimit('safebrowsing', request);
    if (rateLimited) return rateLimited;

    try {
        const { url } = await requireUrlBody(request);

        const result = await withCache('safebrowsing', url, () => checkUrl(url), { ttlMs: 15 * 60 * 1000 });
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(error.body, { status: error.status });
        }
        return NextResponse.json({ success: true, status: 'error', matches: [] });
    }
}

async function checkUrl(url: string) {
    const apiKey = cleanKey(process.env.GOOGLE_SAFE_BROWSING_API_KEY);
    if (!apiKey) {
        return { success: true, status: 'skipped' as const, matches: [] };
    }

    const res = await fetchWithTimeout(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client: { clientId: 'linkguard', clientVersion: '1.0.0' },
                threatInfo: {
                    threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
                    platformTypes: ['ANY_PLATFORM'],
                    threatEntryTypes: ['URL'],
                    threatEntries: [{ url }],
                },
            }),
        },
        10000
    );

    if (!res.ok) {
        return { success: true, status: 'error' as const, matches: [] };
    }

    const data = await res.json();
    const matches: string[] = (data.matches || []).map((m: { threatType: string }) => m.threatType);

    return { success: true, status: 'ok' as const, matches };
}
