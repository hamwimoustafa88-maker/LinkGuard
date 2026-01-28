'use client';

import { useState } from 'react';
import HeroSection from '@/components/HeroSection';
import StatusTerminal from '@/components/StatusTerminal';
import VerdictDashboard from '@/components/VerdictDashboard';

import EducationFooter from '@/components/EducationFooter';
import { ScanStatus, VerdictType, type ScanResult } from '@/types';
import { analyzeBrandMismatch } from '@/utils/brandMatcher';

export default function Home() {
    const [scanResult, setScanResult] = useState<ScanResult>({
        status: ScanStatus.IDLE,
        verdict: VerdictType.UNKNOWN,
    });

    const handleScan = async (url: string) => {
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
                error: error.message || 'حدث خطأ أثناء الفحص',
            });
        }
    };

    return (
        <main className="min-h-screen relative overflow-hidden">
            {/* Background effects */}
            <div className="fixed inset-0 bg-gradient-to-br from-cyber-dark via-cyber-navy to-cyber-dark" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

            <div className="relative z-10 container mx-auto px-4 py-8">
                {/* Header */}
                <header className="text-center mb-16 mt-8">
                    <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyber-safe to-cyber-glow bg-clip-text text-transparent">
                        LinkGuard
                    </h1>
                    <p className="text-2xl text-cyber-glow font-tajawal">كاشف الروابط الخبيثة</p>
                    <p className="text-gray-400 mt-2">حماية متقدمة ضد الروابط المشبوهة والبرمجيات الخبيثة</p>
                </header>

                {/* Hero Section */}
                <HeroSection onScan={handleScan} isScanning={scanResult.status !== ScanStatus.IDLE && scanResult.status !== ScanStatus.COMPLETE && scanResult.status !== ScanStatus.ERROR} />

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

                {/* Disclaimer */}
                <footer className="mt-12 text-center pb-8 border-t border-gray-800 pt-8">
                    <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4 inline-block max-w-2xl mx-auto">
                        <p className="text-red-400 font-bold text-lg mb-1">
                            ⚠️ إخلاء مسؤولية هام
                        </p>
                        <p className="text-gray-400 text-sm">
                            فحص الروابط لا يعني الموافقة على محتواها. الدخول إلى أي رابط يكون على مسؤوليتك الخاصة.
                            النتائج تعتمد على قواعد بيانات خارجية وقد لا تكون دقيقة بنسبة 100%.
                        </p>
                    </div>
                </footer>
            </div>
        </main>
    );
}
