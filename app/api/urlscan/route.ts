import { NextRequest, NextResponse } from 'next/server';
import { ApiError, cleanKey, enforceRateLimit, fetchWithTimeout, pollUntil, requireUrlBody, withCache } from '@/lib/server/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 45;

const FETCH_TIMEOUT_MS = 15000;
const POLL_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 3000; // urlscan.io scans typically take 10-15s

export async function POST(request: NextRequest) {
    const rateLimited = enforceRateLimit('urlscan', request);
    if (rateLimited) return rateLimited;

    try {
        const { url } = await requireUrlBody(request);

        const result = await withCache('urlscan', url, () => scanUrl(url), { ttlMs: 15 * 60 * 1000 });
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(error.body, { status: error.status });
        }
        console.error('URLScan error:', error);
        return NextResponse.json({ success: true, status: 'error', reason: 'exception', screenshotUrl: null });
    }
}

async function scanUrl(url: string) {
    const apiKey = cleanKey(process.env.URLSCAN_API_KEY);
    if (!apiKey) {
        return { success: true, status: 'skipped' as const, screenshotUrl: null };
    }

    // Step 1: Initiate scan
    const scanResponse = await fetchWithTimeout(
        'https://urlscan.io/api/v1/scan/',
        {
            method: 'POST',
            headers: { 'API-Key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, visibility: 'public' }),
        },
        FETCH_TIMEOUT_MS
    );

    if (!scanResponse.ok) {
        if (scanResponse.status === 429) {
            return { success: true, status: 'error' as const, reason: 'rate_limited', screenshotUrl: null };
        }
        return { success: true, status: 'error' as const, reason: 'submit_failed', screenshotUrl: null };
    }

    const scanData = await scanResponse.json();
    const resultUrl = scanData.api;

    // Step 2: Poll for the result
    const resultData = await pollUntil(async () => {
        const resultResponse = await fetchWithTimeout(resultUrl, { headers: { 'API-Key': apiKey } }, FETCH_TIMEOUT_MS);
        if (!resultResponse.ok) return null;
        return resultResponse.json();
    }, { attempts: POLL_ATTEMPTS, intervalMs: POLL_INTERVAL_MS });

    if (!resultData) {
        return { success: true, status: 'error' as const, reason: 'timeout', screenshotUrl: null };
    }

    const screenshotUrl = resultData.task?.screenshotURL || resultData.screenshot || null;

    return {
        success: true,
        status: 'ok' as const,
        screenshotUrl,
        country: resultData.page?.country || null,
        ip: resultData.page?.ip || null,
        server: resultData.page?.server || null,
    };
}
