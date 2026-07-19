'use client';

import { Calendar, Lock, Building2 } from 'lucide-react';
import type { DomainInfo, SslInfo } from '@/types';
import { useLanguage } from './LanguageContext';

interface DomainInfoCardProps {
    domainInfo?: DomainInfo;
    sslInfo?: SslInfo;
}

export default function DomainInfoCard({ domainInfo, sslInfo }: DomainInfoCardProps) {
    const { t } = useLanguage();

    const hasAge = domainInfo?.ageDays !== undefined;
    if (!hasAge && !sslInfo) return null;

    return (
        <div className="bg-cyber-navy/30 p-4 rounded-xl space-y-4 mt-4">
            <h4 className="text-gray-400 text-sm font-bold border-b border-gray-700 pb-2">{t('domainInfoTitle')}</h4>

            {hasAge && (
                <div className="flex items-center gap-4 p-3 bg-black/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-cyber-glow shrink-0" />
                    <div>
                        <p className="text-xs text-gray-400">{t('domainAgeLabel')}</p>
                        <p className="text-white text-sm">{t('domainAgeDays').replace('{days}', String(domainInfo!.ageDays))}</p>
                    </div>
                </div>
            )}

            {domainInfo?.registrar && (
                <div className="flex items-center gap-4 p-3 bg-black/20 rounded-lg">
                    <Building2 className="w-5 h-5 text-cyber-glow shrink-0" />
                    <div>
                        <p className="text-xs text-gray-400">{t('registrarLabel')}</p>
                        <p className="text-white text-sm" dir="ltr">{domainInfo.registrar}</p>
                    </div>
                </div>
            )}

            {sslInfo && (
                <div className="flex items-center gap-4 p-3 bg-black/20 rounded-lg">
                    <Lock className={`w-5 h-5 shrink-0 ${sslInfo.valid ? 'text-cyber-safe' : 'text-cyber-danger'}`} />
                    <div>
                        <p className="text-xs text-gray-400">{t('sslIssuer')}</p>
                        <p className="text-white text-sm" dir="ltr">{sslInfo.issuer || '-'}</p>
                        {sslInfo.validTo && (
                            <p className="text-gray-500 text-xs mt-0.5">
                                {t('sslValidUntil')}: <span dir="ltr">{new Date(sslInfo.validTo).toLocaleDateString()}</span>
                            </p>
                        )}
                        {!sslInfo.valid && <p className="text-cyber-danger text-xs mt-1">{t('sslInvalid')}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
