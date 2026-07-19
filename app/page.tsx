'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, ShieldCheck } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import StatusTerminal from '@/components/StatusTerminal';
import VerdictDashboard from '@/components/VerdictDashboard';
import EducationFooter from '@/components/EducationFooter';
import LanguageToggle from '@/components/LanguageToggle';
import ThreatCounter from '@/components/ThreatCounter';
import ScanHistory from '@/components/ScanHistory';
import { useLanguage } from '@/components/LanguageContext';
import { ScanStatus, VerdictType, type ScanResult, type EvidenceItem, type SourceOutcome, type RedirectHop } from '@/types';
import { analyzeBrandMismatch, analyzeUrlHeuristics } from '@/utils/brandMatcher';
import { aggregateVerdict, scoreVirusTotal } from '@/utils/scoring';
import { appendHistory } from '@/utils/history';

async function postJson(url: string, body: unknown) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
}

function HomeContent() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const [scanResult, setScanResult] = useState<ScanResult>({
        status: ScanStatus.IDLE,
        verdict: VerdictType.UNKNOWN,
    });

    useEffect(() => {
        const urlParam = searchParams.get('url');
        if (urlParam && scanResult.status === ScanStatus.IDLE) {
            handleScan(urlParam);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleScan = async (url: string) => {
        setScanResult({
            status: ScanStatus.UNSHORTENING,
            verdict: VerdictType.UNKNOWN,
            originalUrl: url,
        });

        try {
            // Step 1: Resolve the final destination by following redirects ourselves
            // (works for any shortener, not just a hardcoded list).
            const resolveData = await postJson('/api/resolve', { url });
            if (!resolveData.success) {
                throw new Error(resolveData.error || t('statusError'));
            }

            const targetUrl: string = resolveData.finalUrl || resolveData.originalUrl;
            const redirectChain: RedirectHop[] = resolveData.chain || [];

            setScanResult(prev => ({
                ...prev,
                status: ScanStatus.SCANNING,
                unshortenedUrl: targetUrl,
                redirectChain,
            }));

            // Step 2: Run every independent external source in parallel — one
            // slow/unavailable source no longer blocks or fails the whole scan.
            const [vtSettled, urlscanSettled, sbSettled, domainSettled] = await Promise.allSettled([
                postJson('/api/virustotal', { url: targetUrl }),
                postJson('/api/urlscan', { url: targetUrl }),
                postJson('/api/safebrowsing', { url: targetUrl }),
                postJson('/api/domaininfo', { url: targetUrl }),
            ]);

            setScanResult(prev => ({ ...prev, status: ScanStatus.ANALYZING }));

            const vtData = vtSettled.status === 'fulfilled' ? vtSettled.value : null;
            const urlscanData = urlscanSettled.status === 'fulfilled' ? urlscanSettled.value : null;
            const sbData = sbSettled.status === 'fulfilled' ? sbSettled.value : null;
            const domainData = domainSettled.status === 'fulfilled' ? domainSettled.value : null;

            const blocklistsData = await postJson('/api/blocklists', {
                url: targetUrl,
                ip: urlscanData?.ip || undefined,
            }).catch(() => null);

            const evidence: EvidenceItem[] = [];
            const sources: SourceOutcome[] = [];

            // VirusTotal
            if (vtData?.status === 'ok' && vtData.stats) {
                sources.push({ source: 'virustotal', status: 'ok' });
                const vtEvidence = scoreVirusTotal(vtData.stats);
                if (vtEvidence) evidence.push(vtEvidence);
            } else {
                sources.push({ source: 'virustotal', status: vtData?.status === 'skipped' ? 'skipped' : 'error' });
            }

            // urlscan.io (preview only — contributes to confidence, not risk points)
            sources.push({ source: 'urlscan', status: urlscanData?.status === 'ok' ? 'ok' : urlscanData?.status === 'skipped' ? 'skipped' : 'error' });

            // Google Safe Browsing
            if (sbData?.status === 'ok') {
                sources.push({ source: 'safebrowsing', status: 'ok' });
                if (sbData.matches?.length > 0) {
                    evidence.push({
                        id: 'gsbMatch',
                        source: 'safebrowsing',
                        severity: 'critical',
                        points: 85,
                        authoritative: true,
                        params: { threat: sbData.matches[0] },
                    });
                }
            } else {
                sources.push({ source: 'safebrowsing', status: sbData?.status === 'skipped' ? 'skipped' : 'error' });
            }

            // URLhaus / PhishTank / AbuseIPDB
            if (blocklistsData?.success) {
                const { urlhaus, phishtank, abuseipdb } = blocklistsData;
                sources.push({ source: 'urlhaus', status: urlhaus.status });
                if (urlhaus.status === 'ok' && urlhaus.listed) {
                    evidence.push({ id: 'urlhausListed', source: 'urlhaus', severity: 'critical', points: 85, authoritative: true, params: { threat: urlhaus.detail || '' } });
                }

                sources.push({ source: 'phishtank', status: phishtank.status });
                if (phishtank.status === 'ok' && phishtank.listed) {
                    evidence.push({ id: 'phishtankListed', source: 'phishtank', severity: 'critical', points: 85, authoritative: true });
                }

                sources.push({ source: 'abuseipdb', status: abuseipdb.status });
                if (abuseipdb.status === 'ok' && abuseipdb.listed) {
                    evidence.push({ id: 'ipReputation', source: 'abuseipdb', severity: 'medium', points: 20, params: { score: abuseipdb.score ?? 0 } });
                }
            }

            // Local heuristics — always available, never fails
            sources.push({ source: 'heuristics', status: 'ok' });
            evidence.push(...analyzeUrlHeuristics(targetUrl));
            const phishingAlert = analyzeBrandMismatch(targetUrl);

            // Domain age + SSL
            let domainInfo = undefined;
            let sslInfo = undefined;
            if (domainData?.success) {
                if (domainData.domainAge?.status === 'ok') {
                    sources.push({ source: 'domainAge', status: 'ok' });
                    domainInfo = domainData.domainAge.info;
                    if (domainInfo?.ageDays !== undefined) {
                        if (domainInfo.ageDays < 7) {
                            evidence.push({ id: 'veryYoungDomain', source: 'domainAge', severity: 'high', points: 25, params: { days: domainInfo.ageDays } });
                        } else if (domainInfo.ageDays < 30) {
                            evidence.push({ id: 'youngDomain', source: 'domainAge', severity: 'medium', points: 15, params: { days: domainInfo.ageDays } });
                        }
                    }
                } else {
                    sources.push({ source: 'domainAge', status: domainData.domainAge?.status === 'skipped' ? 'skipped' : 'error' });
                }

                if (domainData.ssl?.status === 'ok') {
                    sources.push({ source: 'ssl', status: 'ok' });
                    sslInfo = domainData.ssl.info;
                    if (sslInfo && !sslInfo.valid) {
                        evidence.push({ id: 'sslInvalid', source: 'ssl', severity: 'medium', points: 25 });
                    }
                } else {
                    sources.push({ source: 'ssl', status: domainData.ssl?.status === 'skipped' ? 'skipped' : 'error' });
                }
            }

            if (targetUrl.startsWith('http://')) {
                evidence.push({ id: 'noHttps', source: 'ssl', severity: 'low', points: 15 });
            }

            if (redirectChain.length > 3) {
                evidence.push({ id: 'longRedirectChain', source: 'redirects', severity: 'low', points: 10, params: { hops: redirectChain.length } });
            }

            const aggregated = aggregateVerdict(evidence, sources);

            const finalResult: ScanResult = {
                status: ScanStatus.COMPLETE,
                originalUrl: url,
                unshortenedUrl: targetUrl,
                verdict: aggregated.verdict,
                vtStats: vtData?.stats,
                vtDetails: vtData?.details,
                vtUrlMeta: vtData?.vtUrlMeta,
                scanId: vtData?.scanId,
                screenshotUrl: urlscanData?.screenshotUrl,
                networkInfo: {
                    country: urlscanData?.country,
                    ip: urlscanData?.ip,
                    server: urlscanData?.server,
                },
                phishingAlert,
                riskScore: aggregated,
                redirectChain,
                domainInfo,
                sslInfo,
            };

            setScanResult(finalResult);
            appendHistory({
                url,
                finalUrl: targetUrl,
                verdict: aggregated.verdict,
                score: aggregated.score,
                timestamp: Date.now(),
            });
        } catch (error: any) {
            setScanResult({
                status: ScanStatus.ERROR,
                verdict: VerdictType.UNKNOWN,
                error: error.message || t('statusError'),
            });
        }
    };

    return (
        <main className="min-h-screen relative overflow-hidden flex flex-col">
            {/* Background effects */}
            <div className="fixed inset-0 bg-gradient-to-br from-cyber-dark via-cyber-navy to-cyber-dark" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

            <div className="relative z-10 container mx-auto px-4 py-8 flex-1 flex flex-col">
                {/* Navbar / Top Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <ThreatCounter />
                    <LanguageToggle />
                </div>

                {/* Header - Hidden when scan is active/complete to save space */}
                {scanResult.status === ScanStatus.IDLE && (
                    <header className="text-center mb-16 mt-4 flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyber-safe/10 border border-cyber-safe/30 text-cyber-safe text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            <span>{t('poweredByAI')}</span>
                        </div>
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <ShieldCheck className="w-14 h-14 text-cyber-safe" />
                            <h1 className="text-6xl font-bold bg-gradient-to-r from-cyber-safe to-cyber-glow bg-clip-text text-transparent">
                                {t('appTitle')}
                            </h1>
                        </div>
                        <p className="text-2xl text-cyber-glow font-tajawal">{t('appSubtitle')}</p>
                        <p className="text-gray-400 mt-2">{t('appDescription')}</p>
                    </header>
                )}

                {/* Hero Section */}
                <HeroSection
                    onScan={handleScan}
                    isScanning={scanResult.status !== ScanStatus.IDLE && scanResult.status !== ScanStatus.COMPLETE && scanResult.status !== ScanStatus.ERROR}
                    isCompact={scanResult.status === ScanStatus.COMPLETE || scanResult.status === ScanStatus.ERROR}
                />

                {/* Scan History (only on the idle/landing screen) */}
                {scanResult.status === ScanStatus.IDLE && (
                    <ScanHistory onRescan={handleScan} />
                )}

                {/* Status Terminal */}
                {scanResult.status !== ScanStatus.IDLE && scanResult.status !== ScanStatus.COMPLETE && (
                    <StatusTerminal status={scanResult.status} />
                )}

                {/* Verdict Dashboard */}
                {scanResult.status === ScanStatus.COMPLETE && (
                    <VerdictDashboard result={scanResult} />
                )}

                {/* Error Display */}
                {scanResult.status === ScanStatus.ERROR && (
                    <div className="max-w-2xl mx-auto mt-8 p-6 glass-effect rounded-lg border-2 border-cyber-danger">
                        <p className="text-cyber-danger text-center text-xl">{scanResult.error}</p>
                    </div>
                )}

                {/* Education Footer */}
                <EducationFooter />

                {/* Disclaimer and Footer */}
                <footer className="mt-auto text-center pb-8 border-t border-gray-800 pt-8">
                    <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4 inline-block max-w-2xl mx-auto mb-8">
                        <p className="text-red-400 font-bold text-lg mb-1">
                            {t('disclaimerTitle')}
                        </p>
                        <p className="text-gray-400 text-sm">
                            {t('disclaimerText')}
                        </p>
                    </div>
                    <div className="text-gray-500 text-sm mt-4">
                        <p>{t('footerCopy')}</p>
                    </div>
                </footer>
            </div>
        </main>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-cyber-dark text-white flex items-center justify-center">Loading...</div>}>
            <HomeContent />
        </Suspense>
    );
}
