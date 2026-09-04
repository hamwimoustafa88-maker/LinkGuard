'use client';

import { motion } from 'framer-motion';
import type { AggregatedVerdict, ConfidenceLevel } from '@/types';
import { DANGER_THRESHOLD, WARNING_THRESHOLD } from '@/utils/scoring';
import { colorForScore } from '@/lib/verdictTheme';
import { useLanguage } from './LanguageContext';
import type { TranslationKey } from '@/utils/translations';

const confidenceKey: Record<ConfidenceLevel, TranslationKey> = {
    high: 'confidenceHigh',
    medium: 'confidenceMedium',
    low: 'confidenceLow',
};

const confidenceColor: Record<ConfidenceLevel, string> = {
    high: 'border-cyber-safe text-cyber-safe',
    medium: 'border-cyber-warning text-cyber-warning',
    low: 'border-gray-500 text-gray-400',
};

interface RiskScoreGaugeProps {
    riskScore: AggregatedVerdict;
}

export default function RiskScoreGauge({ riskScore }: RiskScoreGaugeProps) {
    const { t } = useLanguage();
    const color = colorForScore(riskScore.score, DANGER_THRESHOLD, WARNING_THRESHOLD);

    return (
        <div className="glass-effect rounded-2xl p-8 border border-cyber-safe/30">
            <h3 className="text-2xl font-bold mb-6 text-cyber-glow">{t('riskScoreLabel')}</h3>

            <div className="flex flex-col items-center justify-center pt-2">
                <div className="relative w-40 h-40 mb-6">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#1f2937" strokeWidth="3.5" />
                        <motion.circle
                            cx="18" cy="18" r="15.915"
                            fill="transparent"
                            stroke={color}
                            strokeWidth="3.5"
                            strokeDasharray="0 100"
                            animate={{ strokeDasharray: `${riskScore.score} ${100 - riskScore.score}` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-bold font-mono" style={{ color }}>{riskScore.score}</span>
                        <span className="text-gray-500 text-xs border-t border-gray-700 mt-1 pt-1">/ 100</span>
                    </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${confidenceColor[riskScore.confidence]}`}>
                    {t('confidenceLabel')}: {t(confidenceKey[riskScore.confidence])}
                </div>
            </div>
        </div>
    );
}
