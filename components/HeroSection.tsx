'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, Camera, ClipboardPaste } from 'lucide-react';
import QrScannerModal from './QrScannerModal';
import { useLanguage } from './LanguageContext';
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton';

interface HeroSectionProps {
    onScan: (url: string) => void;
    isScanning: boolean;
    isCompact?: boolean;
}

export default function HeroSection({ onScan, isScanning, isCompact = false }: HeroSectionProps) {
    const { t } = useLanguage();
    const [url, setUrl] = useState('');
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    // Hardware back button on Android: close the QR scanner first if it's
    // open, instead of exiting the app or navigating away mid-scan.
    useAndroidBackButton(() => {
        if (isQrModalOpen) {
            setIsQrModalOpen(false);
            return true;
        }
        return false;
    });

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

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text.trim()) setUrl(text.trim());
        } catch {
            // Clipboard permission denied/unavailable (e.g. an insecure
            // context, or the WebView blocked it) - the user can still
            // long-press the field for the native paste menu.
        }
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-4xl mx-auto ${isCompact ? 'mb-8' : 'mb-16'}`}
        >
            <form onSubmit={handleSubmit} className="relative">
                <div className={isCompact ? 'flex flex-col sm:flex-row items-center gap-3' : ''}>
                    {/* Input field with QR button wrapper */}
                    <div className={`flex gap-3 ${isCompact ? 'flex-1 w-full' : ''}`}>
                        {/* Glowing input field */}
                        <div className="relative group flex-1">
                            <div className={`absolute -inset-1 bg-linear-to-r from-cyber-safe to-cyber-glow rounded-2xl blur-sm opacity-25 group-hover:opacity-50 group-focus-within:opacity-100 group-focus-within:duration-300 transition duration-1000 ${isCompact ? 'opacity-20' : ''}`} />
                            <div className="relative">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder={t('scanPlaceholder')}
                                    disabled={isScanning}
                                    // Left/right padding is intentionally asymmetric (not px-*): the
                                    // icons below are pinned to fixed physical sides regardless of
                                    // page direction (the input's own dir="ltr" means typed/placeholder
                                    // text always starts at its left edge), so each side needs just
                                    // enough clearance for its own icon rather than equal padding -
                                    // equal padding let text start directly under the search icon.
                                    className={`w-full bg-cyber-navy/90 backdrop-blur-xs border-2 border-cyber-safe/30 rounded-2xl text-white placeholder-gray-400 focus:outline-hidden focus:border-cyber-safe focus:shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all duration-300 disabled:opacity-50 ${isCompact ? 'pl-12 pr-14 py-4 text-base' : 'pl-14 pr-16 py-6 text-xl'}`}
                                    dir="ltr"
                                />
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-cyber-safe/50 pointer-events-none ${isCompact ? 'w-5 h-5' : 'left-6 w-6 h-6'}`} />
                                {!isScanning && (
                                    <button
                                        type="button"
                                        onClick={handlePaste}
                                        title={t('pasteButton')}
                                        aria-label={t('pasteButton')}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 text-cyber-safe/50 hover:text-cyber-safe transition-colors ${isCompact ? '' : 'right-6'}`}
                                    >
                                        <ClipboardPaste className={isCompact ? 'w-5 h-5' : 'w-6 h-6'} />
                                    </button>
                                )}
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
                            <div className="absolute -inset-1 bg-linear-to-r from-cyber-safe to-cyber-glow rounded-2xl blur-sm opacity-0 group-hover:opacity-30 transition duration-300" />
                            <Camera className={`relative text-cyber-safe ${isCompact ? 'w-6 h-6' : 'w-7 h-7'}`} />
                        </motion.button>
                    </div>

                    {/* Scan button */}
                    <motion.button
                        type="submit"
                        disabled={isScanning || !url.trim()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`font-bold bg-linear-to-r from-cyber-safe to-emerald-400 text-cyber-dark rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group hover:from-emerald-400 hover:to-cyber-safe hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] transition-all duration-300 ${isCompact ? 'px-8 py-4 text-lg w-full sm:w-auto shrink-0' : 'w-full mt-6 px-8 py-5 text-2xl'}`}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <Shield className={isCompact ? 'w-5 h-5' : 'w-7 h-7'} />
                            {isScanning ? t('scanningButton') : (isCompact ? t('newScan') : t('scanButton'))}
                        </span>

                        {/* Radar scanning animation */}
                        {isScanning && (
                            <motion.div
                                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
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
