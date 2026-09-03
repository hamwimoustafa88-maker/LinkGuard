'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Trash2, RotateCcw } from 'lucide-react';
import { VerdictType } from '@/types';
import { getHistory, clearHistory, type HistoryEntry } from '@/utils/history';
import { useLanguage } from './LanguageContext';

const verdictColor: Record<VerdictType, string> = {
    [VerdictType.SAFE]: 'text-cyber-safe',
    [VerdictType.WARNING]: 'text-cyber-warning',
    [VerdictType.DANGER]: 'text-cyber-danger',
    [VerdictType.UNKNOWN]: 'text-gray-400',
};

interface ScanHistoryProps {
    onRescan: (url: string) => void;
}

export default function ScanHistory({ onRescan }: ScanHistoryProps) {
    const { t } = useLanguage();
    const [entries, setEntries] = useState<HistoryEntry[]>([]);

    useEffect(() => {
        setEntries(getHistory());
    }, []);

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
                        onClick={() => {
                            clearHistory();
                            setEntries([]);
                        }}
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
                            <span className={`text-xs font-bold shrink-0 ${verdictColor[entry.verdict]}`}>{entry.score}</span>
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
