'use client';

import { useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { History, Trash2, RotateCcw } from 'lucide-react';
import { subscribe, getSnapshot, getServerSnapshot, clearHistory } from '@/utils/history';
import { verdictTheme } from '@/lib/verdictTheme';
import { useLanguage } from './LanguageContext';

interface ScanHistoryProps {
    onRescan: (url: string) => void;
}

export default function ScanHistory({ onRescan }: ScanHistoryProps) {
    const { t } = useLanguage();
    // Subscribes directly to the localStorage-backed store instead of
    // snapshotting it once on mount - a scan completed in the same session
    // now shows up here immediately, and other tabs stay in sync too.
    const entries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    if (entries.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto w-full mb-12"
        >
            <div className="glass-effect rounded-2xl p-6 border border-cyber-safe/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-cyber-glow flex items-center gap-2">
                        <History className="w-5 h-5" />
                        {t('historyTitle')}
                    </h3>
                    <button
                        onClick={clearHistory}
                        className="text-gray-400 hover:text-cyber-danger transition-colors flex items-center gap-1 text-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        {t('historyClear')}
                    </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {entries.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 p-3 bg-cyber-navy/30 rounded-xl">
                            <div className="min-w-0 flex-1">
                                <p className="text-white text-sm font-mono truncate" dir="ltr">{entry.finalUrl}</p>
                                <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
                            </div>
                            <span className={`text-xs font-bold shrink-0 ${verdictTheme[entry.verdict].textColorClass}`}>{entry.score}</span>
                            <button
                                onClick={() => onRescan(entry.url)}
                                className="p-2 rounded-lg hover:bg-cyber-safe/10 text-cyber-safe shrink-0"
                                title={t('historyRescan')}
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
