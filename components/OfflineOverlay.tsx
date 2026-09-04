'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { useLanguage } from './LanguageContext';

/** Full-screen offline fallback for the Android app: the static bundle
 * (out/) always opens instantly with no network, but every scan needs the
 * hosted backend (see lib/apiBase.ts), so a clear "you're offline" state
 * beats a scan that silently hangs or fails. Web-only browsers already get
 * their own offline UX from the platform, so this renders nothing there -
 * Capacitor.isNativePlatform() is false and the effect below never runs. */
export default function OfflineOverlay() {
    const { t } = useLanguage();
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let cancelled = false;

        Network.getStatus().then((status) => {
            if (!cancelled) setIsOffline(!status.connected);
        });

        const listenerPromise = Network.addListener('networkStatusChange', (status) => {
            setIsOffline(!status.connected);
        });

        return () => {
            cancelled = true;
            listenerPromise.then((handle) => handle.remove());
        };
    }, []);

    const retry = () => {
        Network.getStatus().then((status) => setIsOffline(!status.connected));
    };

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-cyber-dark"
                >
                    <div className="max-w-sm w-full text-center glass-effect rounded-3xl p-8 border-2 border-cyber-danger/30">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-cyber-danger/10 border border-cyber-danger/30 flex items-center justify-center mb-6">
                            <WifiOff className="w-8 h-8 text-cyber-danger" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t('offlineTitle')}</h2>
                        <p className="text-gray-400 mb-6">{t('offlineDesc')}</p>
                        <button
                            onClick={retry}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-safe text-cyber-dark rounded-xl font-bold hover:bg-cyber-glow transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {t('offlineRetry')}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
