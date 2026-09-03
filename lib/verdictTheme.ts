// Single source of truth for verdict/severity -> visual treatment, pulled
// out because the same VerdictType -> color mapping was hand-copied across
// VerdictDashboard.tsx, ScanHistory.tsx and RiskScoreGauge.tsx (each with
// its own subtly different set of Tailwind classes and hex values for the
// same four verdicts), and translation keys were duplicated with it.

import { VerdictType, type EvidenceSeverity } from '@/types';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, type LucideIcon } from 'lucide-react';

export interface VerdictThemeEntry {
    icon: LucideIcon;
    /** Tailwind text+border color classes, e.g. "text-cyber-safe border-cyber-safe" */
    colorClass: string;
    /** Bare Tailwind text color class only, e.g. "text-cyber-safe" */
    textColorClass: string;
    hex: string;
    glowClass: string;
    textKey: string;
    subtextKey: string;
}

export const verdictTheme: Record<VerdictType, VerdictThemeEntry> = {
    [VerdictType.SAFE]: {
        icon: ShieldCheck,
        colorClass: 'text-cyber-safe border-cyber-safe',
        textColorClass: 'text-cyber-safe',
        hex: '#00ff88',
        glowClass: 'neon-glow-safe',
        textKey: 'verdictSafe',
        subtextKey: 'verdictSafeSub',
    },
    [VerdictType.WARNING]: {
        icon: AlertTriangle,
        colorClass: 'text-cyber-warning border-cyber-warning',
        textColorClass: 'text-cyber-warning',
        hex: '#ffaa00',
        glowClass: 'neon-glow-warning',
        textKey: 'verdictWarning',
        subtextKey: 'verdictWarningSub',
    },
    [VerdictType.DANGER]: {
        icon: ShieldAlert,
        colorClass: 'text-cyber-danger border-cyber-danger',
        textColorClass: 'text-cyber-danger',
        hex: '#ff0055',
        glowClass: 'neon-glow-danger',
        textKey: 'verdictDanger',
        subtextKey: 'verdictDangerSub',
    },
    [VerdictType.UNKNOWN]: {
        icon: AlertTriangle,
        colorClass: 'text-gray-400 border-gray-400',
        textColorClass: 'text-gray-400',
        hex: '#9ca3af',
        glowClass: '',
        textKey: 'verdictUnknown',
        subtextKey: 'verdictUnknownSub',
    },
};

/** Same DANGER/WARNING/SAFE hex values as verdictTheme, keyed by a raw 0-100
 * score instead of a VerdictType - for gauges/bars that only have the number. */
export function colorForScore(score: number, dangerThreshold: number, warningThreshold: number): string {
    if (score >= dangerThreshold) return verdictTheme[VerdictType.DANGER].hex;
    if (score >= warningThreshold) return verdictTheme[VerdictType.WARNING].hex;
    return verdictTheme[VerdictType.SAFE].hex;
}

export const severityTheme: Record<EvidenceSeverity, { icon: LucideIcon; colorClass: string }> = {
    critical: { icon: ShieldAlert, colorClass: 'text-cyber-danger' },
    high: { icon: AlertTriangle, colorClass: 'text-cyber-danger' },
    medium: { icon: AlertTriangle, colorClass: 'text-cyber-warning' },
    low: { icon: Info, colorClass: 'text-yellow-400' },
    info: { icon: Info, colorClass: 'text-gray-400' },
};
