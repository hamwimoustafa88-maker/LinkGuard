import { NextRequest, NextResponse } from 'next/server';
import { assertPublicHttpUrl, SsrfBlockedError } from '@/lib/server/ssrfGuard';
import { checkRateLimit, getClientId } from '@/lib/server/rateLimit';
import type { RedirectHop } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 45;

const MAX_HOPS = 8;
const HOP_TIMEOUT_MS = 5000;

async function followRedirects(startUrl: string): Promise<{ finalUrl: string; chain: RedirectHop[] }> {
    const chain: RedirectHop[] = [];
    let current = startUrl;

    for (let i = 0; i < MAX_HOPS; i++) {
        const validated = await assertPublicHttpUrl(current);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), HOP_TIMEOUT_MS);

        let response: Response;
        try {
            response = await fetch(validated.toString(), {
                method: 'HEAD',
                redirect: 'manual',
                signal: controller.signal,
            });
            if (response.status === 405 || response.status === 501) {
                response = await fetch(validated.toString(), {
                    method: 'GET',
                    redirect: 'manual',
                    signal: controller.signal,
                });
            }
        } finally {
            clearTimeout(timeout);
        }

        chain.push({ url: validated.toString(), status: response.status });

        const location = response.headers.get('location');
        const isRedirect = response.status >= 300 && response.status < 400 && !!location;
        if (!isRedirect) {
            return { finalUrl: validated.toString(), chain };
        }

        current = new URL(location!, validated).toString();
    }

    return { finalUrl: current, chain };
}

export async function POST(request: NextRequest) {
    let url = '';

    const rateLimit = checkRateLimit(getClientId(request));
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { success: false, error: 'عدد كبير من الطلبات، يرجى المحاولة لاحقاً', retryAfterMs: rateLimit.retryAfterMs },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();
        url = body.url;

        if (!url) {
            return NextResponse.json({ success: false, error: 'عنوان URL مطلوب' }, { status: 400 });
        }

        try {
            const { finalUrl, chain } = await followRedirects(url);
            return NextResponse.json({ success: true, originalUrl: finalUrl, finalUrl, chain });
        } catch (err) {
            if (err instanceof SsrfBlockedError) {
                return NextResponse.json(
                    { success: false, error: 'تم حظر هذا الرابط لأنه يشير إلى عنوان شبكة داخلي غير آمن', blocked: true },
                    { status: 400 }
                );
            }
            throw err;
        }
    } catch (error) {
        // Direct resolution failed (network error, timeout, host refuses HEAD/GET).
        // Fall back to unshorten.me when configured, otherwise pass the input through.
        const apiKey = process.env.UNSHORTEN_API_KEY;
        if (apiKey) {
            try {
                const apiUrl = `https://unshorten.me/api/v2/unshorten?url=${encodeURIComponent(url)}`;
                const response = await fetch(apiUrl, { headers: { Authorization: `Token ${apiKey}` } });
                if (response.ok) {
                    const data = await response.json();
                    const resolved = data.resolved_url || data.url || url;
                    return NextResponse.json({
                        success: true,
                        originalUrl: resolved,
                        finalUrl: resolved,
                        chain: [],
                        note: 'تم الحل عبر خدمة unshorten.me الاحتياطية',
                    });
                }
            } catch {
                // fall through to raw passthrough below
            }
        }

        return NextResponse.json({
            success: true,
            originalUrl: url || 'unknown',
            finalUrl: url || 'unknown',
            chain: [],
            note: 'تعذر تتبع التحويلات، تم استخدام الرابط الأصلي',
        });
    }
}
