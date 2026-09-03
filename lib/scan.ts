// The scan orchestration pulled out of app/page.tsx's handleScan: resolve
// the redirect chain, fan out to every external source in parallel, score
// the results, and produce a final ScanResult. Kept React-free (the `post`
// function is injected) so it's directly unit-testable without a DOM.

import { ScanStatus, VerdictType, type ScanResult, type EvidenceItem, type SourceOutcome, type RedirectHop, type VTStats, type DomainInfo, type SslInfo } from '@/types';
import { analyzeBrandMismatch, analyzeUrlHeuristics } from '@/utils/brandMatcher';
import { aggregateVerdict, scoreVirusTotal, scoreSafeBrowsing, scoreBlocklists, scoreDomainAge, scoreSsl, scoreRedirects, type BlocklistsResult } from '@/utils/scoring';

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

// `PostFn` stays a generic (untyped) JSON-in/JSON-out signature so a single
// fake implementation can drive every route in a test. These describe each
// actual route's response shape (mirroring their app/api/*/route.ts return
// values) so the `post(...) as X` casts below still get real structural
// checking on every property access that follows, unlike a blanket `as
// never`/`any` that would silence mistakes at every use site downstream.
interface ResolveResponse {
    success: boolean;
    finalUrl?: string;
    originalUrl?: string;
    chain?: RedirectHop[];
    error?: string;
}

interface VirusTotalResponse {
    success: boolean;
    status?: 'ok' | 'skipped' | 'error';
    stats?: VTStats;
    vtEngines?: ScanResult['vtEngines'];
    vtUrlMeta?: ScanResult['vtUrlMeta'];
    scanId?: string;
}

interface UrlscanResponse {
    success: boolean;
    status?: 'ok' | 'skipped' | 'error';
    screenshotUrl?: string | null;
    country?: string | null;
    ip?: string | null;
    server?: string | null;
}

interface SafeBrowsingResponse {
    success: boolean;
    status?: 'ok' | 'skipped' | 'error';
    matches?: string[];
}

interface DomainInfoResponse {
    success: boolean;
    domainAge?: { status: 'ok' | 'skipped' | 'error'; info?: DomainInfo };
    ssl?: { status: 'ok' | 'skipped' | 'error'; info?: SslInfo };
}

interface BlocklistsResponse {
    success: boolean;
    urlhaus?: BlocklistsResult['urlhaus'];
    phishtank?: BlocklistsResult['phishtank'];
    abuseipdb?: BlocklistsResult['abuseipdb'];
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
        const resolveData = (await post('/api/resolve', { url })) as ResolveResponse;
        if (!resolveData.success) {
            throw new Error(resolveData.error || fallbackErrorMessage);
        }

        const targetUrl = resolveData.finalUrl || resolveData.originalUrl || url;
        const redirectChain: RedirectHop[] = resolveData.chain || [];

        progress({ status: ScanStatus.SCANNING, unshortenedUrl: targetUrl, redirectChain });

        // Step 2: Run every independent external source in parallel - one
        // slow/unavailable source no longer blocks or fails the whole scan.
        const [vtSettled, urlscanSettled, sbSettled, domainSettled] = await Promise.allSettled([
            post('/api/virustotal', { url: targetUrl }) as Promise<VirusTotalResponse>,
            post('/api/urlscan', { url: targetUrl }) as Promise<UrlscanResponse>,
            post('/api/safebrowsing', { url: targetUrl }) as Promise<SafeBrowsingResponse>,
            post('/api/domaininfo', { url: targetUrl }) as Promise<DomainInfoResponse>,
        ]);

        progress({ status: ScanStatus.ANALYZING });

        const vtData = vtSettled.status === 'fulfilled' ? vtSettled.value : null;
        const urlscanData = urlscanSettled.status === 'fulfilled' ? urlscanSettled.value : null;
        const sbData = sbSettled.status === 'fulfilled' ? sbSettled.value : null;
        const domainData = domainSettled.status === 'fulfilled' ? domainSettled.value : null;

        const blocklistsData = await (post('/api/blocklists', {
            url: targetUrl,
            ip: urlscanData?.ip || undefined,
        }) as Promise<BlocklistsResponse>).catch(() => null);

        const evidence: EvidenceItem[] = [];
        const sources: SourceOutcome[] = [];

        // VirusTotal
        if (vtData?.status === 'ok' && vtData.stats) {
            sources.push({ source: 'virustotal', status: 'ok' });
            const vtEvidence = scoreVirusTotal(vtData.stats);
            if (vtEvidence) evidence.push(vtEvidence);
        } else {
            sources.push({ source: 'virustotal', status: vtData?.status === 'skipped' ? 'skipped' : 'error' });
        }

        // urlscan.io (preview only - contributes to confidence, not risk points)
        sources.push({ source: 'urlscan', status: urlscanData?.status === 'ok' ? 'ok' : urlscanData?.status === 'skipped' ? 'skipped' : 'error' });

        // Google Safe Browsing
        if (sbData?.status === 'ok') {
            sources.push({ source: 'safebrowsing', status: 'ok' });
            const gsbEvidence = scoreSafeBrowsing(sbData.matches);
            if (gsbEvidence) evidence.push(gsbEvidence);
        } else {
            sources.push({ source: 'safebrowsing', status: sbData?.status === 'skipped' ? 'skipped' : 'error' });
        }

        // URLhaus / PhishTank / AbuseIPDB
        if (blocklistsData?.success && blocklistsData.urlhaus && blocklistsData.phishtank && blocklistsData.abuseipdb) {
            evidence.push(...scoreBlocklists(
                { urlhaus: blocklistsData.urlhaus, phishtank: blocklistsData.phishtank, abuseipdb: blocklistsData.abuseipdb },
                sources
            ));
        }

        // Local heuristics - always available, never fails
        sources.push({ source: 'heuristics', status: 'ok' });
        evidence.push(...analyzeUrlHeuristics(targetUrl));
        const phishingAlert = analyzeBrandMismatch(targetUrl);

        // Domain age + SSL
        let domainInfo: DomainInfo | undefined;
        let sslInfo: SslInfo | undefined;
        if (domainData?.success) {
            const domainAge = domainData.domainAge;
            if (domainAge?.status === 'ok') {
                sources.push({ source: 'domainAge', status: 'ok' });
                domainInfo = domainAge.info;
                const ageEvidence = scoreDomainAge(domainInfo);
                if (ageEvidence) evidence.push(ageEvidence);
            } else {
                sources.push({ source: 'domainAge', status: domainAge?.status === 'skipped' ? 'skipped' : 'error' });
            }

            const ssl = domainData.ssl;
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
            vtStats: vtData?.stats,
            vtEngines: vtData?.vtEngines,
            vtUrlMeta: vtData?.vtUrlMeta,
            scanId: vtData?.scanId,
            screenshotUrl: urlscanData?.screenshotUrl ?? undefined,
            networkInfo: {
                country: urlscanData?.country ?? undefined,
                ip: urlscanData?.ip ?? undefined,
                server: urlscanData?.server ?? undefined,
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
