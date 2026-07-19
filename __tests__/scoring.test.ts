import { describe, it, expect } from 'vitest';
import { aggregateVerdict, scoreVirusTotal } from '@/utils/scoring';
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
