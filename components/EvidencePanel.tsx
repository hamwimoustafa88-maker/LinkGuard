'use client';

import type { AggregatedVerdict } from '@/types';
import { severityTheme } from '@/lib/verdictTheme';
import { useLanguage } from './LanguageContext';

function interpolate(template: string, params?: Record<string, string | number>): string {
    if (!params) return template;
    return Object.entries(params).reduce(
        (acc, [key, value]) => acc.split(`{${key}}`).join(String(value)),
        template
    );
}

interface EvidencePanelProps {
    riskScore: AggregatedVerdict;
}

export default function EvidencePanel({ riskScore }: EvidencePanelProps) {
    const { t } = useLanguage();

    const sourceLabel = (status: string) => {
        if (status === 'ok') return t('sourceOk');
        if (status === 'skipped') return t('sourceNoKey');
        return t('sourceError');
    };

    const sourceColor = (status: string) => {
        if (status === 'ok') return 'border-cyber-safe/40 text-cyber-safe';
        if (status === 'skipped') return 'border-gray-600 text-gray-400';
        return 'border-cyber-danger/40 text-cyber-danger';
    };

    return (
        <div className="glass-effect rounded-2xl p-8 border border-cyber-safe/30 mb-8">
            <h3 className="text-2xl font-bold mb-6 text-cyber-glow">{t('whyVerdict')}</h3>

            {riskScore.evidence.length === 0 ? (
                <p className="text-gray-500 text-sm py-2">{t('cleanMessage')}</p>
            ) : (
                <div className="space-y-2">
                    {riskScore.evidence.map((item, i) => {
                        const style = severityTheme[item.severity];
                        const Icon = style.icon;
                        const text = t(`evidence_${item.id}`);
                        return (
                            <div key={i} className="flex items-start gap-3 p-3 bg-cyber-navy/30 rounded-xl">
                                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${style.colorClass}`} />
                                <p className="text-gray-200 text-sm leading-relaxed">{interpolate(text, item.params)}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-700">
                <h4 className="text-gray-400 text-sm font-bold mb-3">{t('sourcesTitle')}</h4>
                <div className="flex flex-wrap gap-2">
                    {riskScore.sources.map((s, i) => (
                        <span
                            key={i}
                            className={`text-xs px-2 py-1 rounded-full border font-mono ${sourceColor(s.status)}`}
                        >
                            {s.source}: {sourceLabel(s.status)}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
