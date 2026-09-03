import { describe, it, expect } from 'vitest';
import {
    aggregateVerdict,
    scoreVirusTotal,
    scoreSafeBrowsing,
    scoreBlocklists,
    scoreDomainAge,
    scoreSsl,
    scoreRedirects,
    POINTS,
    type BlocklistsResult,
} from '@/utils/scoring';
import { VerdictType, type EvidenceItem, type SourceOutcome } from '@/types';

describe('scoreVirusTotal', () => {
    it('returns null when there are no detections', () => {
        expect(scoreVirusTotal({ malicious: 0, suspicious: 0, harmless: 70, undetected: 5 })).toBeNull();
    });

    it('returns null when total engines is zero (no records)', () => {
        expect(scoreVirusTotal({ malicious: 0, suspicious: 0, harmless: 0, undetected: 0 })).toBeNull();
    });

    it('marks authoritative when malicious >= 5', () => {
        const evidence = scoreVirusTotal({ malicious: 6, suspicious: 0, harmless: 60, undetected: 4 });
        expect(evidence?.authoritative).toBe(true);
        expect(evidence?.severity).toBe('critical');
    });

    it('is not authoritative for a couple of suspicious flags', () => {
        const evidence = scoreVirusTotal({ malicious: 0, suspicious: 2, harmless: 68, undetected: 0 });
        expect(evidence?.authoritative).toBe(false);
        expect(evidence!.points).toBeGreaterThan(0);
    });
});

describe('aggregateVerdict', () => {
    const okSources: SourceOutcome[] = [
        { source: 'virustotal', status: 'ok' },
        { source: 'heuristics', status: 'ok' },
        { source: 'safebrowsing', status: 'ok' },
    ];

    it('is UNKNOWN when no source succeeded, regardless of evidence', () => {
        const result = aggregateVerdict([], [{ source: 'virustotal', status: 'error' }]);
        expect(result.verdict).toBe(VerdictType.UNKNOWN);
        expect(result.confidence).toBe('low');
    });

    it('is SAFE with zero evidence and at least one ok source', () => {
        const result = aggregateVerdict([], [{ source: 'virustotal', status: 'ok' }]);
        expect(result.verdict).toBe(VerdictType.SAFE);
        expect(result.score).toBe(0);
    });

    it('floors the score at 85 for any authoritative evidence, even if points are low', () => {
        const evidence: EvidenceItem[] = [
            { id: 'urlhausListed', source: 'urlhaus', severity: 'critical', points: 10, authoritative: true },
        ];
        const result = aggregateVerdict(evidence, okSources);
        expect(result.score).toBe(85);
        expect(result.verdict).toBe(VerdictType.DANGER);
    });

    it('crosses WARNING at 30 and DANGER at 70 using summed points', () => {
        const warn = aggregateVerdict(
            [{ id: 'typosquat', source: 'heuristics', severity: 'medium', points: 35 }],
            okSources
        );
        expect(warn.verdict).toBe(VerdictType.WARNING);

        const danger = aggregateVerdict(
            [
                { id: 'typosquat', source: 'heuristics', severity: 'high', points: 40 },
                { id: 'homograph', source: 'heuristics', severity: 'high', points: 40 },
            ],
            okSources
        );
        expect(danger.verdict).toBe(VerdictType.DANGER);
    });

    it('caps the score at 100', () => {
        const evidence: EvidenceItem[] = [
            { id: 'a', source: 'heuristics', severity: 'high', points: 60 },
            { id: 'b', source: 'heuristics', severity: 'high', points: 60 },
        ];
        const result = aggregateVerdict(evidence, okSources);
        expect(result.score).toBe(100);
    });

    it('reports confidence based on number of ok sources', () => {
        expect(aggregateVerdict([], [{ source: 'a', status: 'ok' }]).confidence).toBe('low');
        expect(
            aggregateVerdict([], [
                { source: 'a', status: 'ok' },
                { source: 'b', status: 'ok' },
            ]).confidence
        ).toBe('medium');
        expect(
            aggregateVerdict([], [
                { source: 'a', status: 'ok' },
                { source: 'b', status: 'ok' },
                { source: 'c', status: 'ok' },
            ]).confidence
        ).toBe('high');
    });

    it('sorts evidence by points descending', () => {
        const evidence: EvidenceItem[] = [
            { id: 'low', source: 'heuristics', severity: 'low', points: 10 },
            { id: 'high', source: 'heuristics', severity: 'high', points: 40 },
        ];
        const result = aggregateVerdict(evidence, okSources);
        expect(result.evidence[0].id).toBe('high');
    });
});

describe('scoreSafeBrowsing', () => {
    it('returns null with no matches', () => {
        expect(scoreSafeBrowsing([])).toBeNull();
        expect(scoreSafeBrowsing(undefined)).toBeNull();
    });

    it('is authoritative at the gsbMatch point value on any match', () => {
        const evidence = scoreSafeBrowsing(['SOCIAL_ENGINEERING']);
        expect(evidence?.authoritative).toBe(true);
        expect(evidence?.points).toBe(POINTS.gsbMatch);
        expect(evidence?.params?.threat).toBe('SOCIAL_ENGINEERING');
    });
});

describe('scoreBlocklists', () => {
    const clean: BlocklistsResult = {
        urlhaus: { status: 'ok', listed: false },
        phishtank: { status: 'ok', listed: false },
        abuseipdb: { status: 'skipped', listed: false },
    };

    it('produces no evidence and pushes ok/skipped source outcomes for a clean result', () => {
        const sources: SourceOutcome[] = [];
        const evidence = scoreBlocklists(clean, sources);
        expect(evidence).toHaveLength(0);
        expect(sources).toEqual([
            { source: 'urlhaus', status: 'ok' },
            { source: 'phishtank', status: 'ok' },
            { source: 'abuseipdb', status: 'skipped' },
        ]);
    });

    it('scores each listed sub-source independently and authoritatively (except abuseipdb)', () => {
        const sources: SourceOutcome[] = [];
        const evidence = scoreBlocklists(
            {
                urlhaus: { status: 'ok', listed: true, detail: 'malware' },
                phishtank: { status: 'ok', listed: true },
                abuseipdb: { status: 'ok', listed: true, score: 80 },
            },
            sources
        );

        const byId = Object.fromEntries(evidence.map((e) => [e.id, e]));
        expect(byId.urlhausListed).toMatchObject({ points: POINTS.urlhausListed, authoritative: true });
        expect(byId.phishtankListed).toMatchObject({ points: POINTS.phishtankListed, authoritative: true });
        expect(byId.ipReputation).toMatchObject({ points: POINTS.ipReputation, params: { score: 80 } });
        expect(byId.ipReputation.authoritative).toBeUndefined();
    });
});

describe('scoreDomainAge', () => {
    it('returns null when age is unknown', () => {
        expect(scoreDomainAge(undefined)).toBeNull();
        expect(scoreDomainAge({})).toBeNull();
    });

    it('flags very young domains (<7d) higher than young ones (<30d)', () => {
        expect(scoreDomainAge({ ageDays: 2 })).toMatchObject({ id: 'veryYoungDomain', points: POINTS.veryYoungDomain });
        expect(scoreDomainAge({ ageDays: 15 })).toMatchObject({ id: 'youngDomain', points: POINTS.youngDomain });
    });

    it('does not flag an established domain', () => {
        expect(scoreDomainAge({ ageDays: 365 })).toBeNull();
    });

    it('is exactly boundary-inclusive at 7 and 30 days', () => {
        expect(scoreDomainAge({ ageDays: 7 })?.id).toBe('youngDomain');
        expect(scoreDomainAge({ ageDays: 30 })).toBeNull();
    });
});

describe('scoreSsl', () => {
    it('flags an invalid cert', () => {
        const evidence = scoreSsl({ valid: false }, 'https://example.com');
        expect(evidence.some((e) => e.id === 'sslInvalid')).toBe(true);
        expect(evidence.some((e) => e.id === 'noHttps')).toBe(false);
    });

    it('flags plain http independently of ssl info being present', () => {
        const evidence = scoreSsl(undefined, 'http://example.com');
        expect(evidence).toEqual([{ id: 'noHttps', source: 'ssl', severity: 'low', points: POINTS.noHttps }]);
    });

    it('can flag both at once', () => {
        const evidence = scoreSsl({ valid: false }, 'http://example.com');
        expect(evidence.map((e) => e.id).sort()).toEqual(['noHttps', 'sslInvalid']);
    });

    it('flags nothing for a valid https cert', () => {
        expect(scoreSsl({ valid: true }, 'https://example.com')).toEqual([]);
    });
});

describe('scoreRedirects', () => {
    it('returns null at or below the 3-hop threshold', () => {
        const chain = Array.from({ length: 3 }, (_, i) => ({ url: `https://hop${i}`, status: 302 }));
        expect(scoreRedirects(chain)).toBeNull();
    });

    it('flags a chain longer than 3 hops', () => {
        const chain = Array.from({ length: 4 }, (_, i) => ({ url: `https://hop${i}`, status: 302 }));
        expect(scoreRedirects(chain)).toMatchObject({ id: 'longRedirectChain', points: POINTS.longRedirectChain, params: { hops: 4 } });
    });
});
