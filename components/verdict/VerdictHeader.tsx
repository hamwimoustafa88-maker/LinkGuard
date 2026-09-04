'use client';

import { useState } from 'react';
import { Download, Globe, ExternalLink, Share2, Copy, Check } from 'lucide-react';
import { VerdictType } from '@/types';
import type { VerdictThemeEntry } from '@/lib/verdictTheme';
import { useLanguage } from '@/components/LanguageContext';

interface VerdictHeaderProps {
    verdict: VerdictType;
    theme: VerdictThemeEntry;
    unshortenedUrl?: string;
    totalVendors: number;
    safetyScore: number;
}

export default function VerdictHeader({ verdict, theme, unshortenedUrl, totalVendors, safetyScore }: VerdictHeaderProps) {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);
    const Icon = theme.icon;

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
    );
}
