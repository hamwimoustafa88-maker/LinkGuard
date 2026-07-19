import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet, cacheKey } from '@/lib/server/cache';

export const maxDuration = 15;

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();
        if (!url) {
            return NextResponse.json({ success: false, error: 'عنوان URL مطلوب' }, { status: 400 });
        }

        const key = cacheKey('safebrowsing', url);
        const cached = cacheGet<Record<string, unknown>>(key);
        if (cached) {
            return NextResponse.json(cached);
        }

        const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: true, status: 'skipped', matches: [] });
        }

        const res = await fetch(
            `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
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
                signal: AbortSignal.timeout(10000),
            }
        );

        if (!res.ok) {
            return NextResponse.json({ success: true, status: 'error', matches: [] });
        }

        const data = await res.json();
        const matches: string[] = (data.matches || []).map((m: any) => m.threatType);

        const result = { success: true, status: 'ok', matches };
        cacheSet(key, result);
        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ success: true, status: 'error', matches: [] });
    }
}
