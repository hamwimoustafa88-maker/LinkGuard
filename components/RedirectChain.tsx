'use client';

import type { RedirectHop } from '@/types';
import { useLanguage } from './LanguageContext';

interface RedirectChainProps {
    chain: RedirectHop[];
}

export default function RedirectChain({ chain }: RedirectChainProps) {
    const { t } = useLanguage();

    if (!chain || chain.length <= 1) return null;

    return (
        <div className="glass-effect rounded-2xl p-6 border border-cyber-safe/30 mb-8">
            <h3 className="text-lg font-bold mb-4 text-cyber-glow">
                {t('redirectChainTitle')} — {t('redirectHops').replace('{count}', String(chain.length))}
            </h3>
            <div className="space-y-2">
                {chain.map((hop, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500 font-mono w-6 shrink-0">{i + 1}</span>
                        <span className="text-white font-mono break-all flex-1" dir="ltr">{hop.url}</span>
                        <span
                            className={`font-mono text-xs px-2 py-0.5 rounded shrink-0 ${
                                hop.status && hop.status < 400 ? 'bg-cyber-safe/10 text-cyber-safe' : 'bg-cyber-danger/10 text-cyber-danger'
                            }`}
                        >
                            {hop.status ?? '?'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
