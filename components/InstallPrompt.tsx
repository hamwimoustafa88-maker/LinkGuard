'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share, X, ShieldCheck } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const DISMISS_KEY = 'linkguard.pwa.dismissed';
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
    return (
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
    );
}

function isIos(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isDismissedRecently(): boolean {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (Number.isNaN(dismissedAt)) return false;
    const elapsedDays = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return elapsedDays < DISMISS_DAYS;
}

export default function InstallPrompt() {
    const { t } = useLanguage();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [visible, setVisible] = useState(false);
    const [showIosInstructions, setShowIosInstructions] = useState(false);

    useEffect(() => {
        if (isStandalone() || isDismissedRecently()) return;

        if (isIos()) {
            setShowIosInstructions(true);
            setVisible(true);
            return;
        }

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
            setVisible(true);
        };

        const handleAppInstalled = () => {
            setVisible(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const dismiss = useCallback(() => {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setVisible(false);
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (outcome === 'accepted') {
            setVisible(false);
        } else {
            dismiss();
        }
    }, [deferredPrompt, dismiss]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed bottom-0 inset-x-0 z-50 p-4"
                >
                    <div className="max-w-2xl mx-auto glass-effect rounded-2xl border border-cyber-safe/30 p-4 shadow-2xl bg-cyber-navy/95">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-cyber-safe/10 border border-cyber-safe/30 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-6 h-6 text-cyber-safe" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-base">{t('installTitle')}</h3>
                                <p className="text-gray-400 text-sm mt-0.5">{t('installDesc')}</p>

                                {showIosInstructions ? (
                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-300 bg-black/20 rounded-lg p-3">
                                        <span className="flex items-center gap-1">
                                            <Share className="w-4 h-4 text-cyber-safe" /> {t('installIosStep1')}
                                        </span>
                                        <span className="text-gray-500">←</span>
                                        <span>{t('installIosStep2')}</span>
                                    </div>
                                ) : (
                                    <div className="flex gap-3 mt-3">
                                        <button
                                            onClick={handleInstall}
                                            className="flex items-center gap-2 px-4 py-2 bg-cyber-safe text-cyber-dark rounded-lg font-bold text-sm hover:bg-cyber-glow transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            {t('installButton')}
                                        </button>
                                        <button
                                            onClick={dismiss}
                                            className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                                        >
                                            {t('installLater')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={dismiss}
                                className="text-gray-500 hover:text-white transition-colors shrink-0"
                                aria-label={t('installLater')}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
