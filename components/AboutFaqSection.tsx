'use client';

import Link from 'next/link';
import { Info, HelpCircle, ChevronDown } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import type { TranslationKey } from '@/utils/translations';

const HOW_STEPS: TranslationKey[] = ['aboutHow1', 'aboutHow2', 'aboutHow3'];

const FAQ: ReadonlyArray<[TranslationKey, TranslationKey]> = [
    ['faq1Q', 'faq1A'],
    ['faq2Q', 'faq2A'],
    ['faq3Q', 'faq3A'],
    ['faq4Q', 'faq4A'],
    ['faq5Q', 'faq5A'],
    ['faq6Q', 'faq6A'],
];

/** "About us" and FAQ sections on the landing page. Rendered in the
 * prerendered HTML (not behind any client-only state) so crawlers and the
 * first paint see real content, and anchored (#about / #faq) so the top bar
 * and footer can link straight to them. The FAQ uses native <details>, which
 * is keyboard- and screen-reader-accessible with no JS. */
export default function AboutFaqSection() {
    const { t } = useLanguage();

    return (
        <div className="max-w-4xl mx-auto w-full mt-16 space-y-12">
            <section id="about" aria-labelledby="about-title" className="glass-effect rounded-2xl border border-cyber-safe/20 p-6 sm:p-8 scroll-mt-8">
                <h2 id="about-title" className="flex items-center gap-2 text-2xl font-bold text-cyber-safe mb-4">
                    <Info className="w-6 h-6" aria-hidden="true" />
                    {t('aboutTitle')}
                </h2>
                <p className="text-gray-300 leading-relaxed max-w-[70ch]">{t('aboutIntro')}</p>

                <h3 className="text-lg font-bold text-white mt-6 mb-3">{t('aboutHowTitle')}</h3>
                <ol className="space-y-2 text-gray-300 leading-relaxed list-decimal ps-6 max-w-[70ch]">
                    {HOW_STEPS.map((key) => (
                        <li key={key}>{t(key)}</li>
                    ))}
                </ol>

                <h3 className="text-lg font-bold text-white mt-6 mb-3">{t('aboutWhoTitle')}</h3>
                <p className="text-gray-300 leading-relaxed max-w-[70ch]">{t('aboutWho')}</p>

                <Link
                    href="/about"
                    className="inline-flex min-h-11 items-center mt-4 text-cyber-safe hover:text-cyber-glow underline transition-colors"
                >
                    {t('aboutMore')}
                </Link>
            </section>

            <section id="faq" aria-labelledby="faq-title" className="scroll-mt-8">
                <h2 id="faq-title" className="flex items-center gap-2 text-2xl font-bold text-cyber-safe mb-4">
                    <HelpCircle className="w-6 h-6" aria-hidden="true" />
                    {t('faqTitle')}
                </h2>
                <div className="space-y-3">
                    {FAQ.map(([q, a]) => (
                        <details key={q} className="group glass-effect rounded-xl border border-gray-700/60 open:border-cyber-safe/40">
                            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 p-4 font-bold text-white [&::-webkit-details-marker]:hidden">
                                <span>{t(q)}</span>
                                <ChevronDown className="w-5 h-5 shrink-0 text-cyber-safe transition-transform group-open:rotate-180" aria-hidden="true" />
                            </summary>
                            <p className="px-4 pb-4 text-gray-300 leading-relaxed max-w-[70ch]">{t(a)}</p>
                        </details>
                    ))}
                </div>
            </section>
        </div>
    );
}
