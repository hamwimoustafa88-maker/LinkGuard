'use client';

import { motion } from 'framer-motion';
import { ScanStatus } from '@/types';
import { Loader2 } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface StatusTerminalProps {
    status: ScanStatus;
}

export default function StatusTerminal({ status }: StatusTerminalProps) {
    const { t } = useLanguage();

    const getStatusText = (status: ScanStatus) => {
        switch (status) {
            case ScanStatus.UNSHORTENING: return t('statusUnshortening');
            case ScanStatus.SCANNING: return t('statusScanning');
            case ScanStatus.ANALYZING: return t('statusAnalyzing');
            case ScanStatus.COMPLETE: return t('statusComplete');
            case ScanStatus.ERROR: return t('statusError');
            default: return '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto mb-12"
        >
            <div className="glass-effect rounded-xl p-8 border border-cyber-safe/30">
                <div className="flex items-center gap-4">
                    <Loader2 className="w-8 h-8 text-cyber-safe animate-spin" />
                    <div className="flex-1">
                        <motion.p
                            key={status}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="terminal-text text-2xl font-mono"
                        >
                            {getStatusText(status)}
                        </motion.p>
                        <div className="flex gap-1 mt-3">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 bg-cyber-safe rounded-full"
                                    animate={{
                                        opacity: [0.3, 1, 0.3],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6 h-2 bg-cyber-navy rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyber-safe to-cyber-glow"
                        initial={{ width: '0%' }}
                        animate={{
                            width: status === ScanStatus.UNSHORTENING ? '33%' :
                                status === ScanStatus.SCANNING ? '66%' :
                                    status === ScanStatus.ANALYZING ? '90%' : '100%'
                        }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
