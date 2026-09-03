'use client';

import { Flag, Server, Globe, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ScanResult } from '@/types';
import DomainInfoCard from '@/components/DomainInfoCard';
import InfoRow from './InfoRow';
import { useLanguage } from '@/components/LanguageContext';

interface ThreatIntelProps {
    vtUrlMeta: ScanResult['vtUrlMeta'];
    networkInfo: ScanResult['networkInfo'];
    domainInfo: ScanResult['domainInfo'];
    sslInfo: ScanResult['sslInfo'];
    scanId?: string;
    unshortenedUrl?: string;
    threatCount: number;
    flaggedEngines: [string, NonNullable<ScanResult['vtEngines']>[string]][];
    currentTime: string;
}

export default function ThreatIntel({
    vtUrlMeta,
    networkInfo,
    domainInfo,
    sslInfo,
    scanId,
    unshortenedUrl,
    threatCount,
    flaggedEngines,
    currentTime,
}: ThreatIntelProps) {
    const { t } = useLanguage();

    return (
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
                            href={scanId ? `https://www.virustotal.com/gui/url/${scanId}` : `https://www.virustotal.com/gui/search/${encodeURIComponent(unshortenedUrl || '')}`}
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
    );
}
