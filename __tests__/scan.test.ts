import { describe, it, expect, vi } from 'vitest';
import { runScan, type PostFn } from '@/lib/scan';
import { ScanStatus, VerdictType } from '@/types';

const RESOLVE_OK = { success: true, finalUrl: 'https://example.com', originalUrl: 'https://example.com', chain: [], truncated: false };
const VT_SKIPPED = { success: true, status: 'skipped' };
const URLSCAN_SKIPPED = { success: true, status: 'skipped', screenshotUrl: null };
const SB_SKIPPED = { success: true, status: 'skipped', matches: [] };
const DOMAININFO_SKIPPED = { success: true, domainAge: { status: 'skipped' }, ssl: { status: 'skipped' } };
const BLOCKLISTS_CLEAN = {
    success: true,
    urlhaus: { status: 'skipped', listed: false },
    phishtank: { status: 'ok', listed: false },
    abuseipdb: { status: 'skipped', listed: false },
};

/** Builds a fake `post` that dispatches by route path, with per-route
 * overrides. Every route not overridden returns a benign "skipped" shape. */
function fakePost(overrides: Record<string, unknown> = {}): PostFn {
    const defaults: Record<string, unknown> = {
        '/api/resolve': RESOLVE_OK,
        '/api/virustotal': VT_SKIPPED,
        '/api/urlscan': URLSCAN_SKIPPED,
        '/api/safebrowsing': SB_SKIPPED,
        '/api/domaininfo': DOMAININFO_SKIPPED,
        '/api/blocklists': BLOCKLISTS_CLEAN,
        ...overrides,
    };
    return vi.fn(async (url: string) => defaults[url] as Record<string, unknown> & { success?: boolean });
}

describe('runScan', () => {
    it('resolves SAFE with zero evidence when every source is skipped/clean', async () => {
        const result = await runScan('https://example.com', {
            post: fakePost(),
            fallbackErrorMessage: 'error',
        });

        expect(result.status).toBe(ScanStatus.COMPLETE);
        expect(result.verdict).toBe(VerdictType.SAFE);
        expect(result.riskScore?.score).toBe(0);
    });

    it('falls back to low confidence when only local heuristics succeeded', async () => {
        // Local heuristics always run and always report 'ok' (utils/brandMatcher
        // never throws), so even a total external-source outage still yields a
        // computable verdict rather than UNKNOWN - just at low confidence.
        const result = await runScan('https://example.com', {
            post: fakePost({
                '/api/virustotal': { success: true, status: 'error', reason: 'timeout' },
                '/api/urlscan': { success: true, status: 'error', reason: 'timeout' },
                '/api/safebrowsing': { success: true, status: 'error', matches: [] },
                '/api/domaininfo': { success: false },
                '/api/blocklists': null,
            }),
            fallbackErrorMessage: 'error',
        });

        expect(result.status).toBe(ScanStatus.COMPLETE);
        expect(result.verdict).toBe(VerdictType.SAFE);
        expect(result.riskScore?.sources.filter((s) => s.status === 'ok')).toEqual([{ source: 'heuristics', status: 'ok' }]);
        expect(result.riskScore?.confidence).toBe('low');
    });

    it('floors the score at 85 (DANGER) on a Safe Browsing match', async () => {
        const result = await runScan('https://phish.example', {
            post: fakePost({
                '/api/safebrowsing': { success: true, status: 'ok', matches: ['SOCIAL_ENGINEERING'] },
            }),
            fallbackErrorMessage: 'error',
        });

        expect(result.verdict).toBe(VerdictType.DANGER);
        expect(result.riskScore?.score).toBe(85);
        expect(result.riskScore?.evidence.some((e) => e.id === 'gsbMatch')).toBe(true);
    });

    it('carries VirusTotal engine results through to the final result (D6)', async () => {
        const result = await runScan('https://example.com', {
            post: fakePost({
                '/api/virustotal': {
                    success: true,
                    status: 'ok',
                    stats: { malicious: 1, suspicious: 0, harmless: 60, undetected: 5 },
                    vtEngines: { EngineA: { category: 'malicious', result: 'phishing', method: 'blacklist', engine_name: 'EngineA' } },
                    vtUrlMeta: { title: 'Example' },
                    scanId: 'abc123',
                },
            }),
            fallbackErrorMessage: 'error',
        });

        expect(result.vtEngines).toEqual({ EngineA: { category: 'malicious', result: 'phishing', method: 'blacklist', engine_name: 'EngineA' } });
        expect(result.vtUrlMeta).toEqual({ title: 'Example' });
        expect(result.scanId).toBe('abc123');
    });

    it('resolves ERROR (not a throw) when /api/resolve fails', async () => {
        const result = await runScan('https://broken.example', {
            post: fakePost({ '/api/resolve': { success: false, code: 'resolve_failed', error: 'تعذر تتبع التحويلات' } }),
            fallbackErrorMessage: 'fallback',
        });

        expect(result.status).toBe(ScanStatus.ERROR);
        expect(result.error).toBe('تعذر تتبع التحويلات');
    });

    it('falls back to fallbackErrorMessage when a failure carries no message', async () => {
        const result = await runScan('https://broken.example', {
            post: fakePost({ '/api/resolve': { success: false } }),
            fallbackErrorMessage: 'fallback message',
        });

        expect(result.status).toBe(ScanStatus.ERROR);
        expect(result.error).toBe('fallback message');
    });

    it('reports progress through the expected status sequence', async () => {
        const seen: string[] = [];
        await runScan('https://example.com', {
            post: fakePost(),
            fallbackErrorMessage: 'error',
            onProgress: (partial) => {
                if (partial.status) seen.push(partial.status);
            },
        });

        expect(seen).toEqual([ScanStatus.UNSHORTENING, ScanStatus.SCANNING, ScanStatus.ANALYZING]);
    });

    it('scores a long redirect chain and passes it through as evidence + result field', async () => {
        const chain = Array.from({ length: 5 }, (_, i) => ({ url: `https://hop${i}.example`, status: 302 }));
        const result = await runScan('https://example.com', {
            post: fakePost({ '/api/resolve': { ...RESOLVE_OK, chain } }),
            fallbackErrorMessage: 'error',
        });

        expect(result.redirectChain).toHaveLength(5);
        expect(result.riskScore?.evidence.some((e) => e.id === 'longRedirectChain')).toBe(true);
    });
});
