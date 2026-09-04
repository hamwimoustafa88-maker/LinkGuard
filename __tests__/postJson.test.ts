import { describe, it, expect, vi, afterEach } from 'vitest';
import { postJson, runScan } from '@/lib/scan';

function jsonResponse(body: unknown, status: number) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('postJson', () => {
    // Every app/api/* route returns a well-formed ErrorResponse JSON body -
    // including a machine-readable `code` - on its non-2xx paths too:
    // missing_url/ssrf_blocked -> 400, rate_limited -> 429, resolve_failed
    // -> 502, internal -> 500. postJson previously discarded the body and
    // substituted a hardcoded "HTTP {status}" string on any !res.ok
    // response, which silently defeated the whole code/translateError
    // localization mechanism for every real server error - it only ever
    // "worked" in scan.test.ts's fake `post`, which bypasses fetch/postJson
    // entirely and hands the JSON object straight through regardless of
    // status.
    it.each([
        [400, { success: false, code: 'missing_url', error: 'عنوان URL مطلوب' }],
        [400, { success: false, code: 'ssrf_blocked', error: 'تم حظر هذا الرابط', blocked: true }],
        [429, { success: false, code: 'rate_limited', error: 'عدد كبير من الطلبات', retryAfterMs: 5000 }],
        [502, { success: false, code: 'resolve_failed', error: 'تعذر تتبع التحويلات' }],
        [500, { success: false, code: 'internal', error: 'حدث خطأ' }],
    ])('parses the JSON body (including code) from a %i response instead of discarding it', async (status, body) => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(body, status)));

        const result = await postJson('/api/resolve', { url: 'https://example.com' });

        expect(result).toEqual(body);
    });

    it('falls back to a synthetic internal error only when the body truly is not JSON', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 })));

        const result = await postJson('/api/resolve', { url: 'https://example.com' });

        expect(result).toEqual({ success: false, code: 'internal', error: 'HTTP 502' });
    });

    it('parses a 2xx body as before (no regression on the success path)', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, status: 'ok' }, 200)));

        const result = await postJson('/api/virustotal', { url: 'https://example.com' });

        expect(result).toEqual({ success: true, status: 'ok' });
    });
});

describe('runScan + postJson integration', () => {
    it('end-to-end: a real 429 rate_limited response from /api/resolve is localized via translateError', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            jsonResponse({ success: false, code: 'rate_limited', error: 'عدد كبير من الطلبات' }, 429)
        ));

        const result = await runScan('https://example.com', {
            post: postJson,
            fallbackErrorMessage: 'fallback',
            translateError: (code) => `localized:${code}`,
        });

        expect(result.error).toBe('localized:rate_limited');
    });
});
