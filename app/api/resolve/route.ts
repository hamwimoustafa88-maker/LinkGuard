import { NextRequest, NextResponse } from 'next/server';
import { assertPublicHttpUrl, SsrfBlockedError } from '@/lib/server/ssrfGuard';
import { ApiError, enforceRateLimit, fetchWithTimeout, requireUrlBody, ssrfBlockedResponse } from '@/lib/server/apiHelpers';
import type { RedirectHop } from '@/types';
import type { ErrorResponse } from '@/types/api';

export const runtime = 'nodejs';
export const maxDuration = 45;

const MAX_HOPS = 8;
const HOP_TIMEOUT_MS = 5000;

// Users very often paste a bare domain ("facebook.com") with no scheme.
// `new URL()` inside assertPublicHttpUrl then throws (it's not an absolute
// URL), which previously surfaced as the exact same "blocked - unsafe
// internal address" message as a real SSRF hit - misleading for what's
// simply a missing https://. Default to https, matching what a browser
// address bar does for the same input.
function normalizeUrl(raw: string): string {
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

async function followRedirects(startUrl: string): Promise<{ finalUrl: string; chain: RedirectHop[]; truncated: boolean }> {
    const chain: RedirectHop[] = [];
    let current = startUrl;

    for (let i = 0; i < MAX_HOPS; i++) {
        const validated = await assertPublicHttpUrl(current);

        let response = await fetchWithTimeout(validated.toString(), { method: 'HEAD', redirect: 'manual' }, HOP_TIMEOUT_MS);
        if (response.status === 405 || response.status === 501) {
            response = await fetchWithTimeout(validated.toString(), { method: 'GET', redirect: 'manual' }, HOP_TIMEOUT_MS);
        }

        chain.push({ url: validated.toString(), status: response.status });

        const location = response.headers.get('location');
        const isRedirect = response.status >= 300 && response.status < 400 && !!location;
        if (!isRedirect) {
            return { finalUrl: validated.toString(), chain, truncated: false };
        }

        current = new URL(location!, validated).toString();
    }

    // Hop budget exhausted with a pending redirect still unresolved. `current`
    // was never fetched or SSRF-checked at this point - validate it before
    // handing it back, since it's about to be forwarded to virustotal/
    // urlscan/blocklists, none of which re-guard against internal targets.
    const finalValidated = await assertPublicHttpUrl(current);
    return { finalUrl: finalValidated.toString(), chain, truncated: true };
}

export async function POST(request: NextRequest) {
    const rateLimited = enforceRateLimit('resolve', request);
    if (rateLimited) return rateLimited;

    let url = '';

    try {
        const body = await requireUrlBody<{ url: string }>(request);
        url = normalizeUrl(body.url);

        try {
            const { finalUrl, chain, truncated } = await followRedirects(url);
            return NextResponse.json({ success: true, originalUrl: finalUrl, finalUrl, chain, truncated });
        } catch (err) {
            if (err instanceof SsrfBlockedError) {
                return ssrfBlockedResponse();
            }
            throw err;
        }
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(error.body, { status: error.status });
        }

        // Direct resolution failed (network error, timeout, host refuses HEAD/GET).
        // Fall back to unshorten.me when configured; its result is SSRF-checked
        // too, since it's just as capable of returning an internal-network URL.
        const apiKey = process.env.UNSHORTEN_API_KEY;
        if (apiKey) {
            try {
                const apiUrl = `https://unshorten.me/api/v2/unshorten?url=${encodeURIComponent(url)}`;
                const response = await fetchWithTimeout(apiUrl, { headers: { Authorization: `Token ${apiKey}` } }, 8000);
                if (response.ok) {
                    const data = await response.json();
                    const resolved = data.resolved_url || data.url || url;
                    const validated = await assertPublicHttpUrl(resolved);
                    return NextResponse.json({
                        success: true,
                        originalUrl: validated.toString(),
                        finalUrl: validated.toString(),
                        chain: [],
                        truncated: false,
                        note: 'تم الحل عبر خدمة unshorten.me الاحتياطية',
                    });
                }
            } catch {
                // SsrfBlockedError or a network failure on the fallback itself -
                // either way, fall through to the failure response below rather
                // than silently trusting an unvalidated URL.
            }
        }

        // Previously this returned success:true with the raw, unresolved input
        // URL - meaning a link that failed to resolve could get scanned and
        // reported as clean under its unshortened face. Report the failure
        // instead; the client surfaces it rather than silently degrading.
        const body: ErrorResponse = { success: false, code: 'resolve_failed', error: 'تعذر تتبع التحويلات لهذا الرابط' };
        return NextResponse.json(body, { status: 502 });
    }
}
