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
import { useLanguage } from '@/components/LanguageContext';
import { ScanStatus, VerdictType, type ScanResult } from '@/types';
import { analyzeBrandMismatch } from '@/utils/brandMatcher';

function HomeContent() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const [scanResult, setScanResult] = useState<ScanResult>({
        status: ScanStatus.IDLE,
        verdict: VerdictType.UNKNOWN,
    });

    // Auto-scan if query param exists
    useEffect(() => {
        const urlParam = searchParams.get('url');
        if (urlParam && scanResult.status === ScanStatus.IDLE) {
            handleScan(urlParam);
        }
    }, [searchParams]); // Dependencies adjusted to run only when params change or initially

    const handleScan = async (url: string) => {
        // ... (rest of handleScan function is same, but I need to include it here or just reference it if I could, but I can't. 
        // PROMPT: I need to replace Home component with Home wrapped in Suspense and move logic inside.)

        // Actually, just making Home async/client requires Suspense if using useSearchParams in some Next versions? 
        // 'use client' is already set.
        // It's better to extract content to a component.

        setScanResult({
            status: ScanStatus.UNSHORTENING,
            verdict: VerdictType.UNKNOWN,
            originalUrl: url,
        });

        try {
            // Step 1: Unshorten URL
            const unshortenRes = await fetch('/api/unshorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const unshortenData = await unshortenRes.json();
            if (!unshortenData.success) {
                throw new Error(unshortenData.error);
            }

            const targetUrl = unshortenData.originalUrl;

            // Step 2: Scan with VirusTotal
            setScanResult(prev => ({
                ...prev,
                status: ScanStatus.SCANNING,
                unshortenedUrl: targetUrl,
            }));

            const vtRes = await fetch('/api/virustotal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl }),
            });

            const vtData = await vtRes.json();
            if (!vtData.success) {
                throw new Error(vtData.error);
            }

            // Step 3: Get screenshot from URLScan
            setScanResult(prev => ({
                ...prev,
                status: ScanStatus.ANALYZING,
                vtStats: vtData.stats,
            }));

            const urlscanRes = await fetch('/api/urlscan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl }),
            });

            const urlscanData = await urlscanRes.json();

            // Determine verdict
            const maliciousCount = vtData.stats.malicious + vtData.stats.suspicious;
            let verdict = VerdictType.SAFE;

            if (maliciousCount > 5) {
                verdict = VerdictType.DANGER;
            } else if (maliciousCount > 0) {
                verdict = VerdictType.WARNING;
            }

            // Run phishing/brand mismatch analysis
            const phishingAlert = analyzeBrandMismatch(targetUrl);

            // Upgrade verdict if high-severity phishing detected
            if (phishingAlert.detected && phishingAlert.severity === 'high' && verdict === VerdictType.SAFE) {
                verdict = VerdictType.WARNING;
            }

            // Complete scan
            setScanResult({
                status: ScanStatus.COMPLETE,
                originalUrl: url,
                unshortenedUrl: targetUrl,
                verdict,
                vtStats: vtData.stats,
                vtDetails: vtData.details,
                vtUrlMeta: vtData.vtUrlMeta,
                scanId: vtData.scanId,
                screenshotUrl: urlscanData.screenshotUrl,
                networkInfo: {
                    country: urlscanData.country,
                    ip: urlscanData.ip,
                    server: urlscanData.server,
                },
                phishingAlert,
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
