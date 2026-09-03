'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { VerdictType, type ScanResult } from '@/types';
import { AlertTriangle, Globe, Server, Flag, Share2, Download, Copy, ExternalLink, Clock, Check, ShieldCheck, type LucideIcon } from 'lucide-react';
import { verdictTheme } from '@/lib/verdictTheme';
import SandboxWindow from '@/components/SandboxWindow';
import PhishingAlertCard from '@/components/PhishingAlertCard';
import EvidencePanel from '@/components/EvidencePanel';
import RiskScoreGauge from '@/components/RiskScoreGauge';
import RedirectChain from '@/components/RedirectChain';
import DomainInfoCard from '@/components/DomainInfoCard';
import { useLanguage, type TFunction } from './LanguageContext';

interface VerdictDashboardProps {
    result: ScanResult;
}

export default function VerdictDashboard({ result }: VerdictDashboardProps) {
    const { t } = useLanguage();
    const { verdict, vtStats, screenshotUrl, networkInfo, unshortenedUrl, vtEngines, vtUrlMeta, riskScore, redirectChain, domainInfo, sslInfo } = result;
    const [copied, setCopied] = useState(false);
    // Computed directly rather than via a mount effect+state: this component
    // only ever renders after a scan completes (never during the initial
    // server-rendered pass, since scanResult starts at IDLE), so there is no
    // server/client markup to reconcile here.
    const currentTime = new Date().toLocaleString();

    const theme = verdictTheme[verdict];
    const Icon = theme.icon;
    const totalVendors = vtStats ? Object.values(vtStats).reduce((a, b) => a + b, 0) : 0;
    const threatCount = vtStats ? vtStats.malicious + vtStats.suspicious : 0;
    const harmlessCount = vtStats ? vtStats.harmless + vtStats.undetected : 0;
    const safetyScore = totalVendors > 0 ? Math.round((harmlessCount / totalVendors) * 100) : 0;
    const flaggedEngines = vtEngines
        ? Object.entries(vtEngines).filter(([, data]) => data.category === 'malicious' || data.category === 'suspicious')
        : [];

    const handleShare = () => {
        const text = verdict === VerdictType.DANGER
            ? t('shareTextDanger')
            : t('shareTextSafe', { score: safetyScore });

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
            <div className={`glass-effect rounded-3xl p-10 mb-8 border-4 ${theme.colorClass} ${theme.glowClass} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/20 pointer-events-none" />

                {/* Export / Download PDF Button */}
                <button
                    onClick={() => window.print()}
                    className="absolute top-4 rtl:left-4 ltr:right-4 p-2 bg-cyber-navy/50 hover:bg-cyber-navy rounded-lg border border-gray-600/50 text-gray-400 hover:text-white transition-colors flex items-center gap-2 z-20 shadow-lg"
                    title={t('exportReport')}
                >
                    <Download className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-bold">{t('exportReport')}</span>
                </button>
                <div className="text-center relative z-10">
                    <Icon className={`w-24 h-24 mx-auto mb-6 ${theme.textColorClass}`} />
                    <h2 className={`text-6xl font-bold mb-3 ${theme.textColorClass}`}>{t(theme.textKey)}</h2>
                    <p className="text-2xl text-gray-300">{t(theme.subtextKey)}</p>

                    {totalVendors === 0 && (
                        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg inline-block">
                            <p className="text-yellow-400 text-sm">{t('noRecords')}</p>
                            <p className="text-gray-400 text-xs mt-1">{t('noRecordsSub')}</p>
                        </div>
                    )}

                    {unshortenedUrl && (
                        <div className="mt-6 p-4 bg-black/30 rounded-xl flex items-center gap-4 max-w-full overflow-hidden mx-auto justify-between border border-gray-800">
                            <div className="text-right flex-1 min-w-0">
                                <p className="text-sm text-gray-400 mb-1">{t('fullUrl')}</p>
                                <p className="text-lg text-white break-all font-mono" dir="ltr">
                                    {unshortenedUrl}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(unshortenedUrl);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className={`p-3 rounded-lg transition-colors shrink-0 ${copied ? 'bg-cyber-safe/20 text-cyber-safe' : 'bg-cyber-navy/50 hover:bg-cyber-safe/20 hover:text-cyber-safe'}`}
                                title={copied ? t('copiedUrl') : t('copyUrl')}
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        <a
                            href={unshortenedUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-cyber-safe hover:bg-emerald-500 text-cyber-dark rounded-xl transition-all font-bold shadow-lg hover:shadow-cyber-safe/30"
                        >
                            <ExternalLink className="w-5 h-5" />
                            {t('goToUrl')}
                        </a>
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

            {/* Redirect Chain */}
            {redirectChain && <RedirectChain chain={redirectChain} />}

            {/* Why this verdict — evidence & source breakdown */}
            {riskScore && <EvidencePanel riskScore={riskScore} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {riskScore && <RiskScoreGauge riskScore={riskScore} />}

                {/* Security Gauge */}
                <div className="glass-effect rounded-2xl p-8 border border-cyber-safe/30">
                    <h3 className="text-2xl font-bold mb-6 text-cyber-glow flex items-center gap-3">
                        <ShieldCheck className="w-7 h-7" />
                        {t('securityGauge')}
                    </h3>

                    <div className="flex flex-col items-center justify-center pt-4">
                        {/* SVG Donut Chart */}
                        <div className="relative w-48 h-48 mb-6">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                {/* Background Circle */}
                                <circle
                                    cx="18" cy="18" r="15.915"
                                    fill="transparent"
                                    stroke="#1f2937"
                                    strokeWidth="3.5"
                                />
                                {/* Value Circle */}
                                <motion.circle
                                    cx="18" cy="18" r="15.915"
                                    fill="transparent"
                                    stroke={theme.hex}
                                    strokeWidth="3.5"
                                    strokeDasharray={totalVendors > 0 ? "0 100" : "100 0"}
                                    animate={{ strokeDasharray: totalVendors > 0 ? `${(harmlessCount / totalVendors) * 100} ${100 - ((harmlessCount / totalVendors) * 100)}` : "100 0" }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-5xl font-bold font-mono" style={{ color: theme.hex }}>{threatCount}</span>
                                <span className="text-gray-500 font-bold border-t border-gray-700 mt-1 pt-1 min-w-12">/ {totalVendors}</span>
                            </div>
                        </div>

                        <h4 className="text-gray-200 text-lg font-bold mb-2 text-center">{t('threatMeter')}</h4>
                        <p className="text-gray-500 text-center max-w-sm text-sm leading-relaxed">
                            {t('vendorsFlagged', { threats: threatCount, total: totalVendors })}
                        </p>
                    </div>
                </div>

                {/* Detailed Intelligence (VT + Network) */}
                <div className="glass-effect rounded-2xl p-8 border border-cyber-safe/30 lg:col-span-2">
                    <h3 className="text-2xl font-bold mb-6 text-cyber-glow flex items-center gap-3">
                        <Server className="w-7 h-7" />
                        {t('threatIntel')}
                    </h3>

                    <div className="space-y-5">
                        {/* Network Info */}
                        <div className="bg-cyber-navy/30 p-4 rounded-xl space-y-4">
                            <h4 className="text-gray-400 text-sm font-bold border-b border-gray-700 pb-2 mb-2">{t('urlServerInfo')}</h4>

                            {/* Page Title & Tags */}
                            {vtUrlMeta?.title && (
                                <div className="mb-3">
                                    <p className="text-xs text-cyber-safe mb-1">{t('pageTitle')}</p>
                                    <p className="text-white text-sm font-bold truncate">{vtUrlMeta.title}</p>
                                </div>
                            )}

                            {/* Tags */}
                            {vtUrlMeta?.tags && vtUrlMeta.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {vtUrlMeta.tags.map((tag, i) => (
                                        <span key={i} className="text-xs bg-cyber-safe/10 text-cyber-safe px-2 py-1 rounded-full border border-cyber-safe/20">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Reputation */}
                            {vtUrlMeta?.reputation !== undefined && (
                                <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                                    <span className="text-gray-400 text-xs">{t('communityReputation')}</span>
                                    <span className={`text-sm font-bold ${vtUrlMeta.reputation > 0 ? 'text-green-400' : vtUrlMeta.reputation < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                        {vtUrlMeta.reputation > 0 ? '+' : ''}{vtUrlMeta.reputation}
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

                            {/* Real-time timestamp */}
                            {currentTime && (
                                <div className="flex items-center gap-4 p-4 bg-cyber-navy/50 rounded-xl mt-4 border border-cyber-safe/10">
                                    <Clock className="w-6 h-6 text-cyber-safe" />
                                    <div className="flex-1 text-right">
                                        <p className="text-sm text-gray-400">{t('scanDateTime')}</p>
                                        <p className="text-white font-mono mt-1" dir="ltr">{currentTime}</p>
                                    </div>
                                </div>
                            )}

                            <DomainInfoCard domainInfo={domainInfo} sslInfo={sslInfo} />
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

                            {threatCount > 0 && flaggedEngines.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {flaggedEngines.map(([engine, data]) => (
                                        <div key={engine} className="flex justify-between items-center p-2 bg-red-900/20 rounded-sm border border-red-500/30">
                                            <span className="font-bold text-gray-200 text-sm">{engine}</span>
                                            <span className="text-red-400 text-xs font-mono">{data.result}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : threatCount > 0 ? (
                                <div className="text-center py-4">
                                    <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">{t('engineDetailUnavailable')}</p>
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

function VerificationSteps({ t }: { t: TFunction }) {
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

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
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
