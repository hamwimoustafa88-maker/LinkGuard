// In-memory rate limiter, per client IP (and per named bucket - see
// checkRateLimit's `bucketId`). Same per-instance caveat as
// lib/server/cache.ts - good enough to blunt abusive bursts, not a
// substitute for an edge/WAF-level limiter.
//
// Implements a sliding-window *counter* (the standard two-window
// approximation, not a true fixed window): each bucket tracks the current
// window's count plus the previous window's, and weights the previous
// count by how much of it is still "inside" the trailing windowMs. A fixed
// window allows a burst of up to 2x maxRequests right at the boundary
// (all of window N's tail plus all of window N+1's head); this doesn't.

interface Bucket {
    windowStart: number;
    currentCount: number;
    previousCount: number;
}

const buckets = new Map<string, Bucket>();

const DEFAULT_WINDOW_MS = 5 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 10;

export interface RateLimitResult {
    allowed: boolean;
    retryAfterMs: number;
}

export interface RateLimitOptions {
    windowMs?: number;
    maxRequests?: number;
}

export function checkRateLimit(
    bucketId: string,
    { windowMs = DEFAULT_WINDOW_MS, maxRequests = DEFAULT_MAX_REQUESTS }: RateLimitOptions = {}
): RateLimitResult {
    const now = Date.now();
    let bucket = buckets.get(bucketId);

    if (!bucket) {
        bucket = { windowStart: now, currentCount: 0, previousCount: 0 };
        buckets.set(bucketId, bucket);
    }

    let elapsed = now - bucket.windowStart;
    if (elapsed >= windowMs) {
        // Roll over. If more than one full window has passed since the last
        // request, the "previous" window is empty rather than stale data.
        bucket.previousCount = elapsed < windowMs * 2 ? bucket.currentCount : 0;
        bucket.windowStart += windowMs * Math.floor(elapsed / windowMs);
        bucket.currentCount = 0;
        elapsed = now - bucket.windowStart;
    }

    const weight = 1 - elapsed / windowMs;
    const estimated = bucket.previousCount * weight + bucket.currentCount;

    if (estimated >= maxRequests) {
        return { allowed: false, retryAfterMs: Math.ceil(windowMs - elapsed) };
    }

    bucket.currentCount++;
    return { allowed: true, retryAfterMs: 0 };
}

// Best-effort client identifier from proxy headers. `x-forwarded-for` can
// carry a client-supplied chain on a non-proxied deployment, but this is a
// burst-blunting limiter, not an auth boundary. Requests with none of these
// headers (e.g. direct, non-proxied access) all collapse onto one shared
// 'unknown' bucket - documented, not silently assumed away.
export function getClientId(request: Request): string {
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();

    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp) return cfIp.trim();

    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();

    return 'unknown';
}
