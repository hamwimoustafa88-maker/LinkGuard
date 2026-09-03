'use client';

import { motion } from 'framer-motion';
import type { ScanResult } from '@/types';
import { verdictTheme } from '@/lib/verdictTheme';
import SandboxWindow from '@/components/SandboxWindow';
import PhishingAlertCard from '@/components/PhishingAlertCard';
import EvidencePanel from '@/components/EvidencePanel';
import RiskScoreGauge from '@/components/RiskScoreGauge';
import RedirectChain from '@/components/RedirectChain';
import VerificationSteps from '@/components/verdict/VerificationSteps';
import VerdictHeader from '@/components/verdict/VerdictHeader';
import ThreatMeter from '@/components/verdict/ThreatMeter';
import ThreatIntel from '@/components/verdict/ThreatIntel';
import { useLanguage } from './LanguageContext';

interface VerdictDashboardProps {
    result: ScanResult;
}

export default function VerdictDashboard({ result }: VerdictDashboardProps) {
    const { t } = useLanguage();
    const { verdict, vtStats, screenshotUrl, networkInfo, unshortenedUrl, vtEngines, vtUrlMeta, riskScore, redirectChain, domainInfo, sslInfo, scanId } = result;

    // Computed directly rather than via a mount effect+state: this component
    // only ever renders after a scan completes (never during the initial
    // server-rendered pass, since scanResult starts at IDLE), so there is no
    // server/client markup to reconcile here.
    const currentTime = new Date().toLocaleString();

    const theme = verdictTheme[verdict];
    const totalVendors = vtStats ? Object.values(vtStats).reduce((a, b) => a + b, 0) : 0;
    const threatCount = vtStats ? vtStats.malicious + vtStats.suspicious : 0;
    const harmlessCount = vtStats ? vtStats.harmless + vtStats.undetected : 0;
    const safetyScore = totalVendors > 0 ? Math.round((harmlessCount / totalVendors) * 100) : 0;
    const flaggedEngines = vtEngines
        ? Object.entries(vtEngines).filter(([, data]) => data.category === 'malicious' || data.category === 'suspicious')
        : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto mt-12 mb-16"
        >
            <VerificationSteps t={t} />

            {result.phishingAlert && result.phishingAlert.detected && (
                <PhishingAlertCard alert={result.phishingAlert} />
            )}

            <VerdictHeader
                verdict={verdict}
                theme={theme}
                unshortenedUrl={unshortenedUrl}
                totalVendors={totalVendors}
                safetyScore={safetyScore}
            />

            {redirectChain && <RedirectChain chain={redirectChain} />}

            {/* Why this verdict — evidence & source breakdown */}
            {riskScore && <EvidencePanel riskScore={riskScore} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {riskScore && <RiskScoreGauge riskScore={riskScore} />}

                <ThreatMeter
                    totalVendors={totalVendors}
                    threatCount={threatCount}
                    harmlessCount={harmlessCount}
                    colorHex={theme.hex}
                />

                <ThreatIntel
                    vtUrlMeta={vtUrlMeta}
                    networkInfo={networkInfo}
                    domainInfo={domainInfo}
                    sslInfo={sslInfo}
                    scanId={scanId}
                    unshortenedUrl={unshortenedUrl}
                    threatCount={threatCount}
                    flaggedEngines={flaggedEngines}
                    currentTime={currentTime}
                />
            </div>

            {screenshotUrl && (
                <div className="mt-8">
                    <SandboxWindow screenshotUrl={screenshotUrl} />
                </div>
            )}
        </motion.div>
    );
}
