// Shared shapes for app/api/* route responses. Every source route
// (virustotal, urlscan, safebrowsing, blocklists, domaininfo) returns a
// SourceResponse; every route's failure path returns an ErrorResponse.
// Previously these were three ad-hoc, mutually incompatible shapes across
// the routes - this collapses them into two, with a machine-readable `code`
// on the error side so the client can pick its own (localized) message
// instead of displaying server-side Arabic text regardless of the user's
// selected UI language.

import type { SourceStatus } from '@/types';

/** Base shape every source route's success response extends - e.g.
 * `{ success: true, status: 'ok', stats: {...} }` for /api/virustotal.
 * Extend it with a route's own extra fields: `SourceResponse & { stats?: VTStats }`. */
export interface SourceResponse {
    success: true;
    status: SourceStatus;
    reason?: string;
}

export type ErrorCode =
    | 'missing_url'
    | 'ssrf_blocked'
    | 'rate_limited'
    | 'resolve_failed'
    | 'internal';

/** Shape every route's failure response uses. `error` carries a
 * pre-translated Arabic message (kept for any non-JS/curl consumer hitting
 * the API directly); `code` is what the client actually keys its own,
 * language-aware message off - see lib/scan.ts's ERROR_CODE_TO_TRANSLATION_KEY. */
export interface ErrorResponse {
    success: false;
    code: ErrorCode;
    error: string;
    retryAfterMs?: number;
    blocked?: boolean;
}
