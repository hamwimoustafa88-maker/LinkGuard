'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react';
import { PhishingAlert } from '@/types';
import { useLanguage } from './LanguageContext';

interface PhishingAlertCardProps {
    alert: PhishingAlert;
}

export default function PhishingAlertCard({ alert }: PhishingAlertCardProps) {
    const { t } = useLanguage();
    if (!alert.detected) return null;

    const severityConfig = {
        high: {
            color: '#ff0055',
            textColor: 'text-cyber-danger',
            borderColor: 'border-cyber-danger',
            bgColor: 'bg-cyber-danger/10',
            glowClass: 'neon-glow-danger',
            icon: ShieldAlert,
        },
        medium: {
            color: '#ffaa00',
            textColor: 'text-cyber-warning',
            borderColor: 'border-cyber-warning',
            bgColor: 'bg-cyber-warning/10',
            glowClass: 'neon-glow-warning',
            icon: AlertTriangle,
        },
        low: {
            color: '#fbbf24',
            textColor: 'text-yellow-400',
            borderColor: 'border-yellow-400',
            bgColor: 'bg-yellow-400/10',
            glowClass: '',
            icon: AlertTriangle,
        },
    };

    const config = severityConfig[alert.severity];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-effect rounded-3xl p-8 mb-8 border-4 ${config.borderColor} ${config.glowClass}`}
        >
            {/* Header */}
            <div className="text-center mb-6">
                <Icon className={`w-16 h-16 mx-auto mb-4 ${config.textColor}`} />
                <h2 className={`text-4xl font-bold mb-2 ${config.textColor}`}>
                    {t('phishingTitle')}
                </h2>
                <p className="text-xl text-gray-300">
                    {t('phishingSubtitle')} <span className="font-bold">{alert.brandNameArabic || alert.brandName}</span>
                </p>
            </div>

            {/* Visual Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Real Brand */}
                <div className="text-center">
                    <div className="mb-3">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">{alert.brandName?.charAt(0)}</span>
                        </div>
                    </div>
                    <p className="text-cyber-safe font-bold text-lg mb-1">{t('originalBrand')}</p>
                    <p className="text-white font-semibold">{alert.brandName}</p>
                    <p className="text-gray-400 text-sm">{alert.brandNameArabic}</p>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                    <div className={`text-6xl ${config.textColor}`}>≠</div>
                </div>

                {/* Fake Site */}
                <div className="text-center">
                    <div className="mb-3">
                        <div className={`w-24 h-24 mx-auto ${config.bgColor} border-4 ${config.borderColor} rounded-2xl flex items-center justify-center`}>
                            <HelpCircle className={`w-12 h-12 ${config.textColor}`} />
                        </div>
                    </div>
                    <p className={`font-bold text-lg mb-1 ${config.textColor}`}>{t('fakeSite')}</p>
                    <p className="text-white font-mono text-sm break-all" dir="ltr">{alert.fakeDomain}</p>
                </div>
            </div>

            {/* Details */}
            <div className={`${config.bgColor} rounded-2xl p-6 mb-6`}>
                <h3 className="text-xl font-bold text-white mb-3">{t('details')}</h3>
                <div className="space-y-3">
                    <div>
                        <p className="text-gray-400 text-sm mb-1">{t('legitDomains')}</p>
                        <div className="flex flex-wrap gap-2">
                            {alert.legitimateDomains?.map((domain, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-cyber-safe/20 border border-cyber-safe rounded-lg text-cyber-safe font-mono text-sm"
                                    dir="ltr"
                                >
                                    {domain}
                                </span>
                            ))}
                        </div>
                    </div>

                    {alert.reason && (
                        <div>
                            <p className="text-gray-400 text-sm mb-1">{t('reason')}</p>
                            <p className="text-white">{alert.reason}</p>
                        </div>
                    )}

                    <div>
                        <p className="text-gray-400 text-sm mb-1">{t('severity')}</p>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                {[1, 2, 3].map((level) => (
                                    <div
                                        key={level}
                                        className={`w-8 h-3 rounded ${level <= (alert.severity === 'high' ? 3 : alert.severity === 'medium' ? 2 : 1)
                                            ? config.borderColor.replace('border-', 'bg-')
                                            : 'bg-gray-700'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className={`font-bold ${config.textColor}`}>
                                {alert.severity === 'high' ? t('severityHigh') : alert.severity === 'medium' ? t('severityMedium') : t('severityLow')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning message */}
            <div className={`text-center p-4 ${config.bgColor} border-2 ${config.borderColor} rounded-xl`}>
                <p className={`font-bold ${config.textColor} text-lg`}>
                    {t('phishingWarning')}
                </p>
            </div>
        </motion.div>
    );
}
