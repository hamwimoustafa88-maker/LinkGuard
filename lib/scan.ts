// The scan orchestration pulled out of app/page.tsx's handleScan: resolve
// the redirect chain, fan out to every external source in parallel, score
// the results, and produce a final ScanResult. Kept React-free (the `post`
// function is injected) so it's directly unit-testable without a DOM.

import { ScanStatus, VerdictType, type ScanResult, type EvidenceItem, type SourceOutcome, type RedirectHop } from '@/types';
import { analyzeBrandMismatch, analyzeUrlHeuristics } from '@/utils/brandMatcher';
import { aggregateVerdict, scoreVirusTotal, scoreSafeBrowsing, scoreBlocklists, scoreDomainAge, scoreSsl, scoreRedirects } from '@/utils/scoring';

export type PostFn = (url: string, body: unknown) => Promise<Record<string, unknown> & { success?: boolean }>;

export interface RunScanOptions {
    post: PostFn;
    /** Shown when a step fails without its own message (e.g. a network error). */
    fallbackErrorMessage: string;
    /** Called after each step completes, so the UI can show live progress. */
    onProgress?: (partial: Partial<ScanResult>) => void;
}

export async function postJson(url: string, body: unknown): Promise<Record<string, unknown> & { success?: boolean }> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
    });

    // A non-2xx response usually means an HTML error page or an empty body,
    // neither of which is valid JSON - surface a clear failure instead of
    // letting res.json() throw an opaque "Unexpected token" error.
    if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}` };
    }
    try {
        return await res.json();
    } catch {
        return { success: false, error: 'Invalid JSON response' };
    }
}

/** Runs a full scan and always resolves to a ScanResult - a failure at any
 * step produces `{ status: ERROR, ... }` rather than throwing, so callers
 * don't need their own try/catch around this. */
export async function runScan(url: string, options: RunScanOptions): Promise<ScanResult> {
    const { post, fallbackErrorMessage, onProgress } = options;

    const progress = (partial: Partial<ScanResult>) => onProgress?.(partial);

    progress({ status: ScanStatus.UNSHORTENING, verdict: VerdictType.UNKNOWN, originalUrl: url });

    try {
        // Step 1: Resolve the final destination by following redirects ourselves
        // (works for any shortener, not just a hardcoded list).
        const resolveData = await post('/api/resolve', { url });
        if (!resolveData.success) {
            throw new Error((resolveData.error as string) || fallbackErrorMessage);
        }

        const targetUrl = (resolveData.finalUrl as string) || (resolveData.originalUrl as string);
        const redirectChain: RedirectHop[] = (resolveData.chain as RedirectHop[]) || [];

        progress({ status: ScanStatus.SCANNING, unshortenedUrl: targetUrl, redirectChain });

        // Step 2: Run every independent external source in parallel - one
        // slow/unavailable source no longer blocks or fails the whole scan.
        const [vtSettled, urlscanSettled, sbSettled, domainSettled] = await Promise.allSettled([
            post('/api/virustotal', { url: targetUrl }),
            post('/api/urlscan', { url: targetUrl }),
            post('/api/safebrowsing', { url: targetUrl }),
            post('/api/domaininfo', { url: targetUrl }),
        ]);

        progress({ status: ScanStatus.ANALYZING });

        const vtData = vtSettled.status === 'fulfilled' ? vtSettled.value : null;
        const urlscanData = urlscanSettled.status === 'fulfilled' ? urlscanSettled.value : null;
        const sbData = sbSettled.status === 'fulfilled' ? sbSettled.value : null;
        const domainData = domainSettled.status === 'fulfilled' ? domainSettled.value : null;

        const blocklistsData = await post('/api/blocklists', {
            url: targetUrl,
            ip: (urlscanData?.ip as string) || undefined,
        }).catch(() => null);

        const evidence: EvidenceItem[] = [];
        const sources: SourceOutcome[] = [];

        // VirusTotal
        if (vtData?.status === 'ok' && vtData.stats) {
            sources.push({ source: 'virustotal', status: 'ok' });
            const vtEvidence = scoreVirusTotal(vtData.stats as never);
            if (vtEvidence) evidence.push(vtEvidence);
        } else {
            sources.push({ source: 'virustotal', status: vtData?.status === 'skipped' ? 'skipped' : 'error' });
        }

        // urlscan.io (preview only - contributes to confidence, not risk points)
        sources.push({ source: 'urlscan', status: urlscanData?.status === 'ok' ? 'ok' : urlscanData?.status === 'skipped' ? 'skipped' : 'error' });

        // Google Safe Browsing
        if (sbData?.status === 'ok') {
            sources.push({ source: 'safebrowsing', status: 'ok' });
            const gsbEvidence = scoreSafeBrowsing(sbData.matches as string[] | undefined);
            if (gsbEvidence) evidence.push(gsbEvidence);
        } else {
            sources.push({ source: 'safebrowsing', status: sbData?.status === 'skipped' ? 'skipped' : 'error' });
        }

        // URLhaus / PhishTank / AbuseIPDB
        if (blocklistsData?.success) {
            evidence.push(...scoreBlocklists(blocklistsData as never, sources));
        }

        // Local heuristics - always available, never fails
        sources.push({ source: 'heuristics', status: 'ok' });
        evidence.push(...analyzeUrlHeuristics(targetUrl));
        const phishingAlert = analyzeBrandMismatch(targetUrl);

        // Domain age + SSL
        let domainInfo;
        let sslInfo;
        if (domainData?.success) {
            const domainAge = domainData.domainAge as { status: string; info?: never } | undefined;
            if (domainAge?.status === 'ok') {
                sources.push({ source: 'domainAge', status: 'ok' });
                domainInfo = domainAge.info;
                const ageEvidence = scoreDomainAge(domainInfo);
                if (ageEvidence) evidence.push(ageEvidence);
            } else {
                sources.push({ source: 'domainAge', status: domainAge?.status === 'skipped' ? 'skipped' : 'error' });
            }

            const ssl = domainData.ssl as { status: string; info?: never } | undefined;
            if (ssl?.status === 'ok') {
                sources.push({ source: 'ssl', status: 'ok' });
                sslInfo = ssl.info;
            } else {
                sources.push({ source: 'ssl', status: ssl?.status === 'skipped' ? 'skipped' : 'error' });
            }
        }
        evidence.push(...scoreSsl(sslInfo, targetUrl));

        const redirectEvidence = scoreRedirects(redirectChain);
        if (redirectEvidence) evidence.push(redirectEvidence);

        const aggregated = aggregateVerdict(evidence, sources);

        return {
            status: ScanStatus.COMPLETE,
            originalUrl: url,
            unshortenedUrl: targetUrl,
            verdict: aggregated.verdict,
            vtStats: vtData?.stats as never,
            vtEngines: vtData?.vtEngines as never,
            vtUrlMeta: vtData?.vtUrlMeta as never,
            scanId: vtData?.scanId as string | undefined,
            screenshotUrl: urlscanData?.screenshotUrl as string | undefined,
            networkInfo: {
                country: urlscanData?.country as string | undefined,
                ip: urlscanData?.ip as string | undefined,
                server: urlscanData?.server as string | undefined,
            },
            phishingAlert,
            riskScore: aggregated,
            redirectChain,
            domainInfo,
            sslInfo,
        };
    } catch (error) {
        return {
            status: ScanStatus.ERROR,
            verdict: VerdictType.UNKNOWN,
            error: error instanceof Error ? error.message : fallbackErrorMessage,
        };
    }
}
