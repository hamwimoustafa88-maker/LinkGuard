'use client';

import { motion } from 'framer-motion';
import { VerdictType, type ScanResult } from '@/types';
import { ShieldCheck, ShieldAlert, AlertTriangle, Globe, Server, Flag, Share2 } from 'lucide-react';
import SandboxWindow from '@/components/SandboxWindow';
import PhishingAlertCard from '@/components/PhishingAlertCard';
import { useLanguage } from './LanguageContext';

interface VerdictDashboardProps {
    result: ScanResult;
}

export default function VerdictDashboard({ result }: VerdictDashboardProps) {
    const { t } = useLanguage();
    const { verdict, vtStats, screenshotUrl, networkInfo, unshortenedUrl, vtDetails } = result;

    const verdictConfig = {
        [VerdictType.SAFE]: {
            icon: ShieldCheck,
            text: t('verdictSafe'),
            subtext: t('verdictSafeSub'),
            colorClass: 'text-cyber-safe border-cyber-safe',
            bgColor: '#00ff88',
            glowClass: 'neon-glow-safe',
        },
        [VerdictType.WARNING]: {
            icon: AlertTriangle,
            text: t('verdictWarning'),
            subtext: t('verdictWarningSub'),
            colorClass: 'text-cyber-warning border-cyber-warning',
            bgColor: '#ffaa00',
            glowClass: 'neon-glow-warning',
        },
        [VerdictType.DANGER]: {
            icon: ShieldAlert,
            text: t('verdictDanger'),
            subtext: t('verdictDangerSub'),
            colorClass: 'text-cyber-danger border-cyber-danger',
            bgColor: '#ff0055',
            glowClass: 'neon-glow-danger',
        },
        [VerdictType.UNKNOWN]: {
            icon: AlertTriangle,
            text: t('verdictUnknown'),
            subtext: t('verdictUnknownSub'),
            colorClass: 'text-gray-400 border-gray-400',
            bgColor: '#9ca3af',
            glowClass: '',
        },
    };

    const config = verdictConfig[verdict];
    const Icon = config.icon;
    const totalVendors = vtStats ? Object.values(vtStats).reduce((a, b) => a + b, 0) : 0;
    const threatCount = vtStats ? vtStats.malicious + vtStats.suspicious : 0;
    const harmlessCount = vtStats ? vtStats.harmless + vtStats.undetected : 0;
    const safetyScore = totalVendors > 0 ? Math.round((harmlessCount / totalVendors) * 100) : 0;

    const handleShare = () => {
        const text = verdict === VerdictType.DANGER
            ? t('shareTextDanger')
            : t('shareTextSafe').replace('{score}', safetyScore.toString());

        // Assuming current URL handles ?url= parameter, we share the app processing the same URL
        const shareUrl = `${window.location.host}/?url=${encodeURIComponent(unshortenedUrl || '')}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + shareUrl)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto mt-12 mb-16"
        >
            {/* Verification Steps Visualization */}
            <VerificationSteps t={t} />

            {/* Phishing Alert Card */}
            {result.phishingAlert && result.phishingAlert.detected && (
                <PhishingAlertCard alert={result.phishingAlert} />
            )}

            {/* Main Verdict Card */}
            <div className={`glass-effect rounded-3xl p-10 mb-8 border-4 ${config.colorClass} ${config.glowClass} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
                <div className="text-center relative z-10">
                    <Icon className={`w-24 h-24 mx-auto mb-6 ${config.colorClass.split(' ')[0]}`} />
                    <h2 className={`text-6xl font-bold mb-3 ${config.colorClass.split(' ')[0]}`}>{config.text}</h2>
                    <p className="text-2xl text-gray-300">{config.subtext}</p>

                    {totalVendors === 0 && (
                        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg inline-block">
                            <p className="text-yellow-400 text-sm">{t('noRecords')}</p>
                            <p className="text-gray-400 text-xs mt-1">{t('noRecordsSub')}</p>
                        </div>
                    )}

                    {unshortenedUrl && (
                        <div className="mt-6 p-4 bg-black/30 rounded-xl inline-block max-w-full">
                            <p className="text-sm text-gray-400 mb-1">{t('fullUrl')}</p>
                            <p className="text-lg text-white break-all font-mono" dir="ltr">
                                {unshortenedUrl}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        <a
                            href={`https://www.browserling.com/browse/win/7/ie/11/${encodeURIComponent(unshortenedUrl || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-indigo-500/30"
                        >
                            <Globe className="w-5 h-5" />
                            {t('openBrowserling')}
                        </a>

                        {/* WhatsApp Share Button */}
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-green-500/30"
                        >
                            <Share2 className="w-5 h-5" />
                            {t('shareWhatsApp')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Security Gauge */}
                <div className="glass-effect rounded-2xl p-8 border border-cyber-safe/30">
                    <h3 className="text-2xl font-bold mb-6 text-cyber-glow flex items-center gap-3">
                        <ShieldCheck className="w-7 h-7" />
                        {t('securityGauge')}
                    </h3>

                    <div className="space-y-4">
                        {/* Threat meter */}
                        <div className="text-center mb-6">
                            <div className="text-5xl font-bold mb-2">
                                <span style={{ color: config.bgColor }}>{threatCount}</span>
                                <span className="text-gray-500">/{totalVendors}</span>
                            </div>
                            <p className="text-gray-400">{t('threatMeter')}</p>
                        </div>

                        {/* Stats breakdown */}
                        {vtStats && (
                            <div className="space-y-3">
                                <StatBar label={t('statDangerous')} count={vtStats.malicious} color="#ff0055" />
                                <StatBar label={t('statSuspicious')} count={vtStats.suspicious} color="#ffaa00" />
                                <StatBar label={t('statSafe')} count={vtStats.harmless} color="#00ff88" />
                                <StatBar label={t('statUndetected')} count={vtStats.undetected} color="#6b7280" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Detailed Intelligence (VT + Network) */}
                <div className="glass-effect rounded-2xl p-8 border border-cyber-safe/30">
                    <h3 className="text-2xl font-bold mb-6 text-cyber-glow flex items-center gap-3">
                        <Server className="w-7 h-7" />
                        {t('threatIntel')}
                    </h3>

                    <div className="space-y-5">
                        {/* Network Info */}
                        <div className="bg-cyber-navy/30 p-4 rounded-xl space-y-4">
                            <h4 className="text-gray-400 text-sm font-bold border-b border-gray-700 pb-2 mb-2">{t('urlServerInfo')}</h4>

                            {/* Page Title & Tags */}
                            {(vtDetails as any)?.meta?.title && (
                                <div className="mb-3">
                                    <p className="text-xs text-cyber-safe mb-1">{t('pageTitle')}</p>
                                    <p className="text-white text-sm font-bold truncate">{(vtDetails as any).meta.title}</p>
                                </div>
                            )}

                            {/* Tags */}
                            {(vtDetails as any)?.meta?.tags && (vtDetails as any).meta.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(vtDetails as any).meta.tags.map((tag: string, i: number) => (
                                        <span key={i} className="text-xs bg-cyber-safe/10 text-cyber-safe px-2 py-1 rounded-full border border-cyber-safe/20">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Reputation */}
                            {(vtDetails as any)?.meta?.reputation !== undefined && (
                                <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                                    <span className="text-gray-400 text-xs">{t('communityReputation')}</span>
                                    <span className={`text-sm font-bold ${(vtDetails as any).meta.reputation > 0 ? 'text-green-400' : (vtDetails as any).meta.reputation < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                        {(vtDetails as any).meta.reputation > 0 ? '+' : ''}{(vtDetails as any).meta.reputation}
                                    </span>
                                </div>
                            )}

                            {networkInfo?.country && (
                                <InfoRow icon={Flag} label={t('country')} value={networkInfo.country} />
                            )}
                            {networkInfo?.ip && (
                                <InfoRow icon={Server} label={t('ipAddress')} value={networkInfo.ip} />
                            )}
                            {networkInfo?.server && (
                                <InfoRow icon={Server} label={t('server')} value={networkInfo.server} />
                            )}
                        </div>

                        {/* VT Detailed Scans */}
                        <div className="bg-cyber-navy/30 p-4 rounded-xl">
                            <h4 className="text-gray-400 text-sm font-bold border-b border-gray-700 pb-2 mb-2 flex justify-between">
                                <span>{t('vtReport')}</span>
                                <a
                                    href={result.scanId ? `https://www.virustotal.com/gui/url/${result.scanId}` : `https://www.virustotal.com/gui/search/${encodeURIComponent(unshortenedUrl || '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-cyber-safe hover:underline flex items-center gap-1"
                                >
                                    {t('viewOriginalReport')} <Globe className="w-3 h-3" />
                                </a>
                            </h4>

                            {threatCount > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                    {vtDetails?.scans && Object.entries(vtDetails.scans)
                                        .filter(([_, data]) => data.category === 'malicious' || data.category === 'suspicious')
                                        .map(([engine, data]) => (
                                            <div key={engine} className="flex justify-between items-center p-2 bg-red-900/20 rounded border border-red-500/30">
                                                <span className="font-bold text-gray-200 text-sm">{engine}</span>
                                                <span className="text-red-400 text-xs font-mono">{data.result}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <ShieldCheck className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">{t('cleanMessage')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sandbox Window */}
            {screenshotUrl && (
                <div className="mt-8">
                    <SandboxWindow screenshotUrl={screenshotUrl} />
                </div>
            )}
        </motion.div>
    );
}

function VerificationSteps({ t }: { t: any }) {
    const steps = [
        { id: 1, label: t('stepUnshorten'), status: 'done' },
        { id: 2, label: t('stepVirusScan'), status: 'done' },
        { id: 3, label: t('stepAnalyze'), status: 'done' },
        { id: 4, label: t('stepResult'), status: 'done' },
    ];

    return (
        <div className="flex items-center justify-between mb-8 relative px-4">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 -z-10 rounded-full" />

            {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center bg-cyber-dark p-2 rounded-xl border border-cyber-safe/20">
                    <div className="w-10 h-10 rounded-full bg-cyber-safe flex items-center justify-center text-cyber-dark font-bold mb-2 shadow-[0_0_15px_rgba(0,255,136,0.5)]">
                        ✓
                    </div>
                    <span className="text-sm font-bold text-cyber-safe">{step.label}</span>
                </div>
            ))}
        </div>
    );
}

function StatBar({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-gray-300">{label}</span>
                <span style={{ color }} className="font-bold">{count}</span>
            </div>
            <div className="h-2 bg-cyber-navy rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((count / 70) * 100, 100)}%` }}
                    style={{ backgroundColor: color }}
                    className="h-full"
                    transition={{ duration: 0.5, delay: 0.2 }}
                />
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-center gap-4 p-4 bg-cyber-navy/50 rounded-xl">
            <Icon className="w-6 h-6 text-cyber-glow" />
            <div className="flex-1">
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-white font-mono" dir="ltr">{value}</p>
            </div>
        </div>
    );
}
