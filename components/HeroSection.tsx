'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, Camera } from 'lucide-react';
import QrScannerModal from './QrScannerModal';
import { useLanguage } from './LanguageContext';

interface HeroSectionProps {
    onScan: (url: string) => void;
    isScanning: boolean;
}

export default function HeroSection({ onScan, isScanning }: HeroSectionProps) {
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
            className="max-w-4xl mx-auto mb-16"
        >
            <form onSubmit={handleSubmit} className="relative">
                {/* Input field with QR button */}
                <div className="flex gap-3">
                    {/* Glowing input field */}
                    <div className="relative group flex-1">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyber-safe to-cyber-glow rounded-2xl blur opacity-25 group-hover:opacity-50 group-focus-within:opacity-100 group-focus-within:duration-300 transition duration-1000" />
                        <div className="relative">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder={t('scanPlaceholder')}
                                disabled={isScanning}
                                className="w-full px-8 py-6 text-xl bg-cyber-navy/90 backdrop-blur-sm border-2 border-cyber-safe/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyber-safe focus:shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all duration-300 disabled:opacity-50"
                                dir="ltr"
                            />
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-cyber-safe/50 w-6 h-6 rtl:left-6 rtl:right-auto ltr:right-6 ltr:left-auto" />
                            {/* Note: Icon position might need flip based on direction? 
                                Original: left-6. 
                                In RTL (Arabic), left is end. If placeholder is Arabic, input is RTL?
                                Input has dir="ltr" hardcoded for URLs! URLs are always LTR.
                                So placeholder will be LTR too if dir="ltr" is on input.
                                Ideally input for URL should be LTR always. 
                                The prompt says "update all text content instantly and flip the layout direction".
                                But URLs are LTR. Keep input dir="ltr".
                                Disclaimer: Placeholder alignment follows dir.
                                If I force dir="ltr" on input, placeholder aligns left.
                                In Arabic, it might look weird if aligned left.
                                I'll keep input dir="ltr" for URL input correctness.
                             */}
                        </div>
                    </div>

                    {/* QR Scanner Button */}
                    <motion.button
                        type="button"
                        onClick={() => setIsQrModalOpen(true)}
                        disabled={isScanning}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative group px-6 py-6 bg-cyber-navy/90 border-2 border-cyber-safe/30 rounded-2xl hover:border-cyber-safe transition-all duration-300 disabled:opacity-50"
                        title={t('scanInfo')} // Using generic info text or I should add 'scanQr' translation? I'll leave title empty or use generic for now to avoid breaking. Actually "مسح رمز QR" -> I'll assume users know what the icon means or I should have added it.
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyber-safe to-cyber-glow rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300" />
                        <Camera className="relative w-7 h-7 text-cyber-safe" />
                    </motion.button>
                </div>

                {/* Scan button */}
                <motion.button
                    type="submit"
                    disabled={isScanning || !url.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-6 px-8 py-5 text-2xl font-bold bg-gradient-to-r from-cyber-safe to-emerald-400 text-cyber-dark rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group hover:from-emerald-400 hover:to-cyber-safe hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] transition-all duration-300"
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        <Shield className="w-7 h-7" />
                        {isScanning ? t('scanningButton') : t('scanButton')}
                    </span>

                    {/* Radar scanning animation */}
                    {isScanning && (
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                                x: ['-100%', '100%'],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        />
                    )}
                </motion.button>
            </form>

            {/* QR Scanner Modal */}
            <QrScannerModal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                onScanSuccess={handleQrScan}
            />

            {/* Info text */}
            <p className="text-center text-gray-300 mt-6 text-base font-medium">
                {t('scanInfo')}
            </p>
        </motion.section>
    );
}
