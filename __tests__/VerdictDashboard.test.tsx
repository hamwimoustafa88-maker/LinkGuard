import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VerdictDashboard from '@/components/VerdictDashboard';
import { LanguageProvider } from '@/components/LanguageContext';
import { ScanStatus, VerdictType, type ScanResult } from '@/types';

function baseResult(overrides: Partial<ScanResult> = {}): ScanResult {
    return {
        status: ScanStatus.COMPLETE,
        verdict: VerdictType.SAFE,
        unshortenedUrl: 'https://example.com',
        vtStats: { malicious: 0, suspicious: 0, harmless: 60, undetected: 10 },
        riskScore: {
            score: 0,
            verdict: VerdictType.SAFE,
            confidence: 'high',
            evidence: [],
            sources: [{ source: 'virustotal', status: 'ok' }],
        },
        ...overrides,
    };
}

function renderDashboard(result: ScanResult) {
    return render(
        <LanguageProvider>
            <VerdictDashboard result={result} />
        </LanguageProvider>
    );
}

describe('VerdictDashboard', () => {
    it('shows the clean message when there are no detections', () => {
        // Rendered by both EvidencePanel (no evidence) and ThreatIntel (no VT
        // detections) - two independent panels legitimately agreeing "clean".
        renderDashboard(baseResult());
        expect(screen.getAllByText('نظيف: لم يبلغ أي محرك فحص عن مشاكل.')).toHaveLength(2);
    });

    it('D6: lists the flagged engines when vtEngines has malicious/suspicious entries', () => {
        renderDashboard(baseResult({
            verdict: VerdictType.DANGER,
            vtStats: { malicious: 1, suspicious: 0, harmless: 59, undetected: 10 },
            vtEngines: {
                EvilEngine: { category: 'malicious', result: 'phishing', method: 'blacklist', engine_name: 'EvilEngine' },
                CleanEngine: { category: 'harmless', result: 'clean', method: 'blacklist', engine_name: 'CleanEngine' },
            },
        }));

        expect(screen.getByText('EvilEngine')).toBeInTheDocument();
        expect(screen.getByText('phishing')).toBeInTheDocument();
        // The harmless engine is not a "flagged" row.
        expect(screen.queryByText('CleanEngine')).not.toBeInTheDocument();
    });

    it('shows the third state when threatCount > 0 but no engine breakdown is available', () => {
        renderDashboard(baseResult({
            verdict: VerdictType.DANGER,
            vtStats: { malicious: 1, suspicious: 0, harmless: 59, undetected: 10 },
            vtEngines: undefined,
            riskScore: {
                score: 60,
                verdict: VerdictType.DANGER,
                confidence: 'high',
                // A real dangerous scan has evidence backing the VT stats, so
                // EvidencePanel doesn't independently fall back to its own
                // "clean" message here too - it's genuinely a distinct panel.
                evidence: [{ id: 'vtDetections', source: 'virustotal', severity: 'high', points: 60 }],
                sources: [{ source: 'virustotal', status: 'ok' }],
            },
        }));

        expect(screen.getByText('رُصدت مؤشرات خطر، لكن تفاصيل محركات الفحص غير متاحة حالياً.')).toBeInTheDocument();
        expect(screen.queryByText('نظيف: لم يبلغ أي محرك فحص عن مشاكل.')).not.toBeInTheDocument();
    });

    it('renders the verdict theme text for the given verdict', () => {
        renderDashboard(baseResult({ verdict: VerdictType.DANGER }));
        expect(screen.getByText('خطر')).toBeInTheDocument();
        expect(screen.getByText('رابط خطير - لا تقم بزيارته')).toBeInTheDocument();
    });
});
