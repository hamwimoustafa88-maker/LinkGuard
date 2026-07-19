// In-memory sliding-window rate limiter, per client IP. Same per-instance
// caveat as lib/server/cache.ts — good enough to blunt abusive bursts, not a
// substitute for an edge/WAF-level limiter.

interface Bucket {
    count: number;
    windowStart: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 10;

export interface RateLimitResult {
    allowed: boolean;
    retryAfterMs: number;
}

export function checkRateLimit(clientId: string): RateLimitResult {
    const now = Date.now();
    const bucket = buckets.get(clientId);

    if (!bucket || now - bucket.windowStart > WINDOW_MS) {
        buckets.set(clientId, { count: 1, windowStart: now });
        return { allowed: true, retryAfterMs: 0 };
    }

    if (bucket.count >= MAX_REQUESTS) {
        return { allowed: false, retryAfterMs: WINDOW_MS - (now - bucket.windowStart) };
    }

    bucket.count++;
    return { allowed: true, retryAfterMs: 0 };
}

export function getClientId(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    return forwarded?.split(',')[0].trim() || 'unknown';
}
