import {
    VerdictType,
    type EvidenceItem,
    type SourceOutcome,
    type AggregatedVerdict,
    type ConfidenceLevel,
    type VTStats,
    type DomainInfo,
    type SslInfo,
    type RedirectHop,
} from '@/types';

export const DANGER_THRESHOLD = 70;
export const WARNING_THRESHOLD = 30;
const AUTHORITATIVE_FLOOR = 85;

// Point values for each evidence type. Pulled out of app/page.tsx's
// handleScan (previously inline literals scattered through the function)
// so the scoring policy lives in one testable place.
export const POINTS = {
    gsbMatch: 85,
    urlhausListed: 85,
    phishtankListed: 85,
    ipReputation: 20,
    veryYoungDomain: 25,
    youngDomain: 15,
    sslInvalid: 25,
    noHttps: 15,
    longRedirectChain: 10,
} as const;

const VERY_YOUNG_DOMAIN_DAYS = 7;
const YOUNG_DOMAIN_DAYS = 30;
const LONG_REDIRECT_CHAIN_HOPS = 3;

export function scoreVirusTotal(stats: VTStats): EvidenceItem | null {
    const total = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
    if (total === 0) return null;

    const weighted = stats.malicious * 2 + stats.suspicious;
    if (weighted === 0) return null;

    const points = Math.min(60, Math.round((weighted / total) * 150));
    const severity = stats.malicious >= 5 ? 'critical' : stats.malicious > 0 ? 'high' : 'medium';

    return {
        id: 'vtDetections',
        source: 'virustotal',
        severity,
        points,
        authoritative: stats.malicious >= 5,
        params: { malicious: stats.malicious, suspicious: stats.suspicious, total },
    };
}

/** Google Safe Browsing: any match at all is treated as authoritative. */
export function scoreSafeBrowsing(matches: string[] | undefined): EvidenceItem | null {
    const firstMatch = matches?.[0];
    if (!firstMatch) return null;
    return {
        id: 'gsbMatch',
        source: 'safebrowsing',
        severity: 'critical',
        points: POINTS.gsbMatch,
        authoritative: true,
        params: { threat: firstMatch },
    };
}

export interface BlocklistsResult {
    urlhaus: { status: 'ok' | 'skipped' | 'error'; listed: boolean; detail?: string };
    phishtank: { status: 'ok' | 'skipped' | 'error'; listed: boolean };
    abuseipdb: { status: 'ok' | 'skipped' | 'error'; listed: boolean; score?: number };
}

/** URLhaus / PhishTank / AbuseIPDB. Also appends each sub-source's outcome
 * to `sources` so the caller doesn't have to unpack this result twice. */
export function scoreBlocklists(result: BlocklistsResult, sources: SourceOutcome[]): EvidenceItem[] {
    const evidence: EvidenceItem[] = [];

    sources.push({ source: 'urlhaus', status: result.urlhaus.status });
    if (result.urlhaus.status === 'ok' && result.urlhaus.listed) {
        evidence.push({
            id: 'urlhausListed',
            source: 'urlhaus',
            severity: 'critical',
            points: POINTS.urlhausListed,
            authoritative: true,
            params: { threat: result.urlhaus.detail || '' },
        });
    }

    sources.push({ source: 'phishtank', status: result.phishtank.status });
    if (result.phishtank.status === 'ok' && result.phishtank.listed) {
        evidence.push({ id: 'phishtankListed', source: 'phishtank', severity: 'critical', points: POINTS.phishtankListed, authoritative: true });
    }

    sources.push({ source: 'abuseipdb', status: result.abuseipdb.status });
    if (result.abuseipdb.status === 'ok' && result.abuseipdb.listed) {
        evidence.push({ id: 'ipReputation', source: 'abuseipdb', severity: 'medium', points: POINTS.ipReputation, params: { score: result.abuseipdb.score ?? 0 } });
    }

    return evidence;
}

/** Domain age: flags very young (<7d) and young (<30d) registrations. */
export function scoreDomainAge(info: DomainInfo | undefined): EvidenceItem | null {
    if (info?.ageDays === undefined) return null;

    if (info.ageDays < VERY_YOUNG_DOMAIN_DAYS) {
        return { id: 'veryYoungDomain', source: 'domainAge', severity: 'high', points: POINTS.veryYoungDomain, params: { days: info.ageDays } };
    }
    if (info.ageDays < YOUNG_DOMAIN_DAYS) {
        return { id: 'youngDomain', source: 'domainAge', severity: 'medium', points: POINTS.youngDomain, params: { days: info.ageDays } };
    }
    return null;
}

/** SSL/TLS: an invalid cert (self-signed, expired, hostname mismatch) and a
 * plain-http target are scored independently - the latter applies even when
 * the domaininfo lookup itself was skipped or failed. */
export function scoreSsl(sslInfo: SslInfo | undefined, targetUrl: string): EvidenceItem[] {
    const evidence: EvidenceItem[] = [];

    if (sslInfo && !sslInfo.valid) {
        evidence.push({ id: 'sslInvalid', source: 'ssl', severity: 'medium', points: POINTS.sslInvalid });
    }
    if (targetUrl.startsWith('http://')) {
        evidence.push({ id: 'noHttps', source: 'ssl', severity: 'low', points: POINTS.noHttps });
    }

    return evidence;
}

/** A long redirect chain (>3 hops) is a mild phishing/cloaking signal. */
export function scoreRedirects(chain: RedirectHop[]): EvidenceItem | null {
    if (chain.length <= LONG_REDIRECT_CHAIN_HOPS) return null;
    return { id: 'longRedirectChain', source: 'redirects', severity: 'low', points: POINTS.longRedirectChain, params: { hops: chain.length } };
}

export function aggregateVerdict(
    evidence: EvidenceItem[],
    sources: SourceOutcome[]
): AggregatedVerdict {
    const sorted = [...evidence].sort((a, b) => b.points - a.points);
    const rawScore = sorted.reduce((sum, item) => sum + item.points, 0);
    const hasAuthoritative = sorted.some(item => item.authoritative);

    let score = Math.min(100, rawScore);
    if (hasAuthoritative) {
        score = Math.max(score, AUTHORITATIVE_FLOOR);
    }

    const okSources = sources.filter(s => s.status === 'ok').length;

    let verdict: VerdictType;
    if (okSources === 0) {
        verdict = VerdictType.UNKNOWN;
    } else if (score >= DANGER_THRESHOLD) {
        verdict = VerdictType.DANGER;
    } else if (score >= WARNING_THRESHOLD) {
        verdict = VerdictType.WARNING;
    } else {
        verdict = VerdictType.SAFE;
    }

    let confidence: ConfidenceLevel;
    if (okSources >= 3) {
        confidence = 'high';
    } else if (okSources === 2) {
        confidence = 'medium';
    } else {
        confidence = 'low';
    }

    return { score, verdict, confidence, evidence: sorted, sources };
}
