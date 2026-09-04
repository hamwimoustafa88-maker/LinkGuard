'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface ThreatMeterProps {
    totalVendors: number;
    threatCount: number;
    harmlessCount: number;
    colorHex: string;
}

export default function ThreatMeter({ totalVendors, threatCount, harmlessCount, colorHex }: ThreatMeterProps) {
    const { t } = useLanguage();

    return (
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
                            stroke={colorHex}
                            strokeWidth="3.5"
                            strokeDasharray={totalVendors > 0 ? "0 100" : "100 0"}
                            animate={{ strokeDasharray: totalVendors > 0 ? `${(harmlessCount / totalVendors) * 100} ${100 - ((harmlessCount / totalVendors) * 100)}` : "100 0" }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-5xl font-bold font-mono" style={{ color: colorHex }}>{threatCount}</span>
                        <span className="text-gray-500 font-bold border-t border-gray-700 mt-1 pt-1 min-w-12">/ {totalVendors}</span>
                    </div>
                </div>

                <h4 className="text-gray-200 text-lg font-bold mb-2 text-center">{t('threatMeter')}</h4>
                <p className="text-gray-500 text-center max-w-sm text-sm leading-relaxed">
                    {t('vendorsFlagged', { threats: threatCount, total: totalVendors })}
                </p>
            </div>
        </div>
    );
}
