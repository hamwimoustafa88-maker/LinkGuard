'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, Camera } from 'lucide-react';
import QrScannerModal from './QrScannerModal';
import { useLanguage } from './LanguageContext';

interface HeroSectionProps {
    onScan: (url: string) => void;
    isScanning: boolean;
    isCompact?: boolean;
}

export default function HeroSection({ onScan, isScanning, isCompact = false }: HeroSectionProps) {
    const { t } = useLanguage();
    const [url, setUrl] = useState('');
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onScan(url.trim());
        }
    };

    const handleQrScan = (scannedUrl: string) => {
        setUrl(scannedUrl);
        setIsQrModalOpen(false);
        // Auto-trigger scan after a short delay
        setTimeout(() => {
            onScan(scannedUrl);
        }, 100);
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-4xl mx-auto ${isCompact ? 'mb-8' : 'mb-16'}`}
        >
            <form onSubmit={handleSubmit} className="relative">
                <div className={`flex gap-3 ${isCompact ? 'flex-col sm:flex-row items-center' : 'flex-col sm:flex-row'}`}>
                    {/* Input field with QR button wrapper */}
                    <div className={`flex gap-3 flex-1 ${isCompact ? 'w-full' : 'w-full'}`}>
                        {/* Glowing input field */}
                        <div className="relative group flex-1">
                            <div className={`absolute -inset-1 bg-gradient-to-r from-cyber-safe to-cyber-glow rounded-2xl blur opacity-25 group-hover:opacity-50 group-focus-within:opacity-100 group-focus-within:duration-300 transition duration-1000 ${isCompact ? 'opacity-20' : ''}`} />
                            <div className="relative">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder={t('scanPlaceholder')}
                                    disabled={isScanning}
                                    className={`w-full bg-cyber-navy/90 backdrop-blur-sm border-2 border-cyber-safe/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyber-safe focus:shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all duration-300 disabled:opacity-50 ${isCompact ? 'px-6 py-4 text-base' : 'px-8 py-6 text-xl'}`}
                                    dir="ltr"
                                />
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-cyber-safe/50 rtl:left-4 rtl:right-auto ltr:right-4 ltr:left-auto ${isCompact ? 'w-5 h-5' : 'left-6 w-6 h-6 rtl:left-6 ltr:right-6'}`} />
                            </div>
                        </div>

                        {/* QR Scanner Button */}
                        <motion.button
                            type="button"
                            onClick={() => setIsQrModalOpen(true)}
                            disabled={isScanning}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative group bg-cyber-navy/90 border-2 border-cyber-safe/30 rounded-2xl hover:border-cyber-safe transition-all duration-300 disabled:opacity-50 ${isCompact ? 'px-4 py-4' : 'px-6 py-6'}`}
                            title={t('scanInfo')}
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyber-safe to-cyber-glow rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300" />
                            <Camera className={`relative text-cyber-safe ${isCompact ? 'w-6 h-6' : 'w-7 h-7'}`} />
                        </motion.button>
                    </div>

                    {/* Scan button */}
                    <motion.button
                        type="submit"
                        disabled={isScanning || !url.trim()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`font-bold bg-gradient-to-r from-cyber-safe to-emerald-400 text-cyber-dark rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group hover:from-emerald-400 hover:to-cyber-safe hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] transition-all duration-300 ${isCompact ? 'px-8 py-4 text-lg w-full sm:w-auto shrink-0' : 'w-full mt-6 px-8 py-5 text-2xl'}`}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <Shield className={isCompact ? 'w-5 h-5' : 'w-7 h-7'} />
                            {isScanning ? t('scanningButton') : (isCompact ? t('newScan') : t('scanButton'))}
                        </span>

                        {/* Radar scanning animation */}
                        {isScanning && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                            />
                        )}
                    </motion.button>
                </div>
            </form>

            <QrScannerModal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                onScanSuccess={handleQrScan}
            />

            {/* Info text - hide when compact */}
            {!isCompact && (
                <p className="text-center text-gray-300 mt-6 text-base font-medium">
                    {t('scanInfo')}
                </p>
            )}
        </motion.section>
    );
}
