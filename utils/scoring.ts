import {
    VerdictType,
    type EvidenceItem,
    type SourceOutcome,
    type AggregatedVerdict,
    type ConfidenceLevel,
    type VTStats,
} from '@/types';

const DANGER_THRESHOLD = 70;
const WARNING_THRESHOLD = 30;
const AUTHORITATIVE_FLOOR = 85;

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
