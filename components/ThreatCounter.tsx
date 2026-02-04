'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export default function ThreatCounter() {
    const { t } = useLanguage();
    // Start at 1,357
    const [count, setCount] = useState(1357);

    useEffect(() => {
        // Increment every 3 minutes (180,000 ms)
        const interval = setInterval(() => {
            setCount(prev => prev + 1);
        }, 3 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    // Also a little fake "live" feel on mount maybe? No, stick to requirements: +1 every 3 mins.

    return (
        <div className="flex items-center gap-3 bg-cyber-dark/50 border border-cyber-danger/30 px-4 py-2 rounded-lg backdrop-blur-sm">
            <div className="relative">
                <ShieldAlert className="w-5 h-5 text-cyber-danger animate-pulse" />
                <div className="absolute inset-0 bg-cyber-danger blur opacity-20 animate-pulse" />
            </div>
            <div className="flex flex-col items-start leading-tight">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                    {t('threatsDetected')}
                </span>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={count}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-xl font-mono font-bold text-cyber-danger text-shadow-glow"
                    >
                        {count.toLocaleString('en-US')}

                    </motion.span>
                </AnimatePresence>
            </div>
        </div>
    );
}
