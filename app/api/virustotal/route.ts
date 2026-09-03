import { NextRequest, NextResponse } from 'next/server';
import { ApiError, cleanKey, enforceRateLimit, fetchWithTimeout, pollUntil, requireUrlBody, withCache } from '@/lib/server/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 60;

const FETCH_TIMEOUT_MS = 15000;
const POLL_ATTEMPTS = 12;
const POLL_INTERVAL_MS = 2000; // 12 * 2s = 24s max

export async function POST(request: NextRequest) {
    const rateLimited = enforceRateLimit('virustotal', request);
    if (rateLimited) return rateLimited;

    try {
        const { url } = await requireUrlBody(request);

        const result = await withCache('virustotal', url, () => scanUrl(url), { ttlMs: 15 * 60 * 1000 });
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(error.body, { status: error.status });
        }
        console.error('VirusTotal error:', error);
        return NextResponse.json({ success: true, status: 'error', reason: 'exception' });
    }
}

async function scanUrl(url: string) {
    const apiKey = cleanKey(process.env.VIRUSTOTAL_API_KEY);
    if (!apiKey) {
        return { success: true, status: 'skipped' as const };
    }

    // Step 1: Submit URL for scanning
    const formData = new URLSearchParams();
    formData.append('url', url);

    const submitResponse = await fetchWithTimeout(
        'https://www.virustotal.com/api/v3/urls',
        { method: 'POST', headers: { 'x-apikey': apiKey }, body: formData },
        FETCH_TIMEOUT_MS
    );

    if (!submitResponse.ok) {
        if (submitResponse.status === 429) {
            return { success: true, status: 'error' as const, reason: 'rate_limited' };
        }
        return { success: true, status: 'error' as const, reason: 'submit_failed' };
    }

    const submitData = await submitResponse.json();
    const analysisId = submitData.data.id;

    // Step 2: Poll for completion with a bounded, soft timeout - a timeout no
    // longer fails the whole scan, it just means this source contributes nothing.
    const completed = await pollUntil(async () => {
        const analysisResponse = await fetchWithTimeout(
            `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
            { headers: { 'x-apikey': apiKey } },
            FETCH_TIMEOUT_MS
        );
        if (!analysisResponse.ok) return null;

        const analysisData = await analysisResponse.json();
        const attributes = analysisData.data.attributes;
        if (attributes.status !== 'completed') return null;

        return { attributes, meta: analysisData.meta };
    }, { attempts: POLL_ATTEMPTS, intervalMs: POLL_INTERVAL_MS });

    if (!completed) {
        return { success: true, status: 'error' as const, reason: 'timeout' };
    }

    const stats = completed.attributes.stats;
    let vtEngines: Record<string, unknown> = completed.attributes.results;
    let vtUrlMeta: Record<string, unknown> | undefined;
    let scanId = analysisId;

    if (completed.meta?.url_info?.id) {
        scanId = completed.meta.url_info.id;

        try {
            const urlResponse = await fetchWithTimeout(
                `https://www.virustotal.com/api/v3/urls/${scanId}`,
                { headers: { 'x-apikey': apiKey } },
                FETCH_TIMEOUT_MS
            );
            if (urlResponse.ok) {
                const urlData = await urlResponse.json();
                const attr = urlData.data.attributes;

                vtEngines = { ...vtEngines, ...attr.last_analysis_results };
                vtUrlMeta = {
                    title: attr.title,
                    tags: attr.tags,
                    categories: attr.categories,
                    reputation: attr.reputation,
                    times_submitted: attr.times_submitted,
                    first_submission_date: attr.first_submission_date,
                    last_submission_date: attr.last_submission_date,
                    total_votes: attr.total_votes,
                };
            }
        } catch {
            // metadata is a nice-to-have; ignore failures
        }
    }

    return {
        success: true,
        status: 'ok' as const,
        stats: {
            malicious: stats.malicious || 0,
            suspicious: stats.suspicious || 0,
            harmless: stats.harmless || 0,
            undetected: stats.undetected || 0,
        },
        vtEngines,
        vtUrlMeta,
        scanId,
    };
}
