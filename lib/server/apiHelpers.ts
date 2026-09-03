// Shared building blocks for the app/api/* source routes: env-key
// sanitizing, timeout'd fetch, request-body validation, and a cache wrapper
// that only pins successful results. Pulled out because every route was
// hand-rolling its own copy of most of this.

import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet, cacheKey } from './cache';
import { checkRateLimit, getClientId, type RateLimitOptions } from './rateLimit';
import type { ErrorResponse } from '@/types/api';

/** Strips whitespace/newlines from an env-sourced API key. Required because
 * newline characters are illegal in HTTP header values - a copy-pasted key
 * with a trailing newline would otherwise break every request to that
 * source silently (the fetch throws, the route reports a generic error). */
export function cleanKey(value: string | undefined): string {
    return (value || '').replace(/\s+/g, '');
}

/** fetch() with a hard timeout. A fresh AbortSignal is created on every
 * call, so reusing this helper for a retry always gets its own full
 * budget rather than inheriting whatever time is left on a shared
 * controller from the first attempt. */
export function fetchWithTimeout(input: string, init: RequestInit = {}, ms = 8000): Promise<Response> {
    return fetch(input, { ...init, signal: AbortSignal.timeout(ms) });
}

const MISSING_URL_MESSAGE = 'عنوان URL مطلوب';

/** Thrown by requireUrlBody; every source route already has a top-level
 * try/catch, so routes catch this alongside their own errors and respond
 * with `NextResponse.json(err.body, { status: err.status })`. `body.code`
 * is what the client keys its own localized message off of - see
 * lib/scan.ts - `body.error` is a pre-translated Arabic fallback for any
 * non-JS consumer hitting the API directly. */
export class ApiError extends Error {
    status: number;
    body: ErrorResponse;
    constructor(status: number, body: ErrorResponse) {
        super(body.error);
        this.status = status;
        this.body = body;
    }
}

/** Parses a source route's JSON body and asserts it carries a non-empty
 * `url`. Extra fields (e.g. blocklists' `ip`) pass through untouched. */
export async function requireUrlBody<T extends { url: string }>(request: NextRequest): Promise<T> {
    const body = (await request.json()) as Partial<T>;
    if (!body.url) {
        throw new ApiError(400, { success: false, code: 'missing_url', error: MISSING_URL_MESSAGE });
    }
    return body as T;
}

/** Cache-or-compute wrapper for the source routes. By default only results
 * with `status: 'ok'` are cached, so a transient upstream error or timeout
 * doesn't get pinned in place of a real answer for the full TTL - pass
 * `shouldCache` to override (e.g. to also cache a deliberate 'skipped'). */
export async function withCache<T extends Record<string, unknown>>(
    prefix: string,
    urlKey: string,
    compute: () => Promise<T>,
    options: {
        ttlMs?: number | ((result: T) => number);
        shouldCache?: (result: T) => boolean;
    } = {}
): Promise<T> {
    const shouldCache = options.shouldCache ?? ((result: T) => result.status === 'ok');
    const key = cacheKey(prefix, urlKey);
    const cached = cacheGet<T>(key);
    if (cached) return cached;

    const result = await compute();
    if (shouldCache(result)) {
        const ttlMs = typeof options.ttlMs === 'function' ? options.ttlMs(result) : options.ttlMs;
        cacheSet(key, result, ttlMs);
    }
    return result;
}

/** Calls `fn` up to `attempts` times, `intervalMs` apart, stopping as soon
 * as it returns a non-null value. Returns null if the budget runs out. */
export async function pollUntil<T>(
    fn: (attempt: number) => Promise<T | null>,
    { attempts, intervalMs }: { attempts: number; intervalMs: number }
): Promise<T | null> {
    for (let attempt = 0; attempt < attempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        const result = await fn(attempt);
        if (result !== null) return result;
    }
    return null;
}

const SSRF_BLOCKED_MESSAGE = 'تم حظر هذا الرابط لأنه يشير إلى عنوان شبكة داخلي غير آمن';

/** Standard response body for an SsrfBlockedError, shared so every route
 * that guards a URL reports the same message. */
export function ssrfBlockedResponse(): NextResponse {
    const body: ErrorResponse = { success: false, code: 'ssrf_blocked', error: SSRF_BLOCKED_MESSAGE, blocked: true };
    return NextResponse.json(body, { status: 400 });
}

/** Per-route rate limiting. Bucketed as `${routeName}:${clientId}` so hitting
 * the limit on one source (e.g. a slow VirusTotal poll loop) doesn't lock
 * the client out of the others - a single scan fans out to up to 6 routes,
 * so a single shared bucket would starve a user after 1-2 scans. Returns
 * the 429 NextResponse to send back, or null if the request is allowed. */
export function enforceRateLimit(
    routeName: string,
    request: NextRequest,
    options?: RateLimitOptions
): NextResponse | null {
    const result = checkRateLimit(`${routeName}:${getClientId(request)}`, options);
    if (result.allowed) return null;

    const body: ErrorResponse = {
        success: false,
        code: 'rate_limited',
        error: 'عدد كبير من الطلبات، يرجى المحاولة لاحقاً',
        retryAfterMs: result.retryAfterMs,
    };
    return NextResponse.json(body, { status: 429 });
}
