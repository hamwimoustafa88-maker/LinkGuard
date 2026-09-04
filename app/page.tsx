'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ShieldCheck } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import StatusTerminal from '@/components/StatusTerminal';
import VerdictDashboard from '@/components/VerdictDashboard';
import EducationFooter from '@/components/EducationFooter';
import LanguageToggle from '@/components/LanguageToggle';
import GitHubLink from '@/components/GitHubLink';
import ScanHistory from '@/components/ScanHistory';
import ShareTargetListener from '@/components/ShareTargetListener';
import { useLanguage } from '@/components/LanguageContext';
import { useScan } from '@/hooks/useScan';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { ScanStatus } from '@/types';

function HomeContent() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const { scanResult, scan } = useScan();

    usePullToRefresh();

    useEffect(() => {
        const urlParam = searchParams.get('url');
        if (urlParam && scanResult.status === ScanStatus.IDLE) {
            scan(urlParam);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    return (
        <main className="min-h-screen relative overflow-hidden flex flex-col">
            <ShareTargetListener onUrl={scan} />

            {/* Background effects */}
            <div className="fixed inset-0 bg-linear-to-br from-cyber-dark via-cyber-navy to-cyber-dark" />
            <div className="fixed inset-0 bg-radial-[at_top] from-cyan-900/20 via-transparent to-transparent" />

            <div className="relative z-10 container mx-auto px-4 py-8 flex-1 flex flex-col">
                {/* Navbar / Top Bar */}
                <div className="flex justify-end items-center gap-3 mb-8">
                    <GitHubLink />
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
                            <h1 className="text-6xl font-bold bg-linear-to-r from-cyber-safe to-cyber-glow bg-clip-text text-transparent">
                                {t('appTitle')}
                            </h1>
                        </div>
                        <p className="text-2xl text-cyber-glow font-tajawal">{t('appSubtitle')}</p>
                        <p className="text-gray-400 mt-2">{t('appDescription')}</p>
                    </header>
                )}

                {/* Hero Section */}
                <HeroSection
                    onScan={scan}
                    isScanning={scanResult.status !== ScanStatus.IDLE && scanResult.status !== ScanStatus.COMPLETE && scanResult.status !== ScanStatus.ERROR}
                    isCompact={scanResult.status === ScanStatus.COMPLETE || scanResult.status === ScanStatus.ERROR}
                />

                {/* Scan History (only on the idle/landing screen) */}
                {scanResult.status === ScanStatus.IDLE && (
                    <ScanHistory onRescan={scan} />
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
                        <Link href="/privacy" className="text-gray-500 hover:text-cyber-safe underline transition-colors mt-2 inline-block">
                            {t('privacyPolicy')}
                        </Link>
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
