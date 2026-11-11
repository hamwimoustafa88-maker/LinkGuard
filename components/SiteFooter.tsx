'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from './LanguageContext';
import { PLATFORM_URL, SOCIAL_LINKS, type SocialName } from '@/lib/siteLinks';

const CONTACT_EMAIL = 'hamwi.moustafa88@gmail.com';
const FOOTER_LINK = 'inline-flex min-h-11 items-center px-2 underline transition-colors hover:text-cyber-safe';

// lucide-react 1.x dropped brand logos, so the social glyphs are inlined (24x24 viewBox).
// The URLs live in lib/siteLinks.ts (shared with the Organization JSON-LD).
const SOCIAL_ICONS: Record<SocialName, ReactNode> = {
    LinkedIn: <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.063 2.063 0 1 1 0-4.127 2.063 2.063 0 0 1 0 4.127zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
    YouTube: <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
    Facebook: <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
    Instagram: (
        <g fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="5.5" />
            <circle cx="12" cy="12" r="4.5" />
            <circle cx="17.6" cy="6.4" r="0.6" fill="currentColor" />
        </g>
    ),
    Telegram: <path fill="currentColor" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />,
    Threads: <path fill="currentColor" d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />,
};

/** Footer links, copyright and "initiative of ScoutHub" line shown at the bottom of every
 * page. Mounted once in app/layout.tsx so new routes get it automatically. */
export default function SiteFooter() {
    const { t } = useLanguage();

    return (
        <footer className="relative z-10 text-center text-gray-500 text-sm px-4 pb-8 pt-4">
            <ul aria-label={t('footerFollowUs')} className="mb-4 flex flex-wrap items-center justify-center gap-2">
                {SOCIAL_LINKS.map(({ name, href }) => (
                    <li key={name}>
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={name}
                            aria-label={name}
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-700/60 text-gray-400 transition-colors hover:border-cyber-safe hover:text-cyber-safe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-safe"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                                {SOCIAL_ICONS[name]}
                            </svg>
                        </a>
                    </li>
                ))}
            </ul>
            <nav aria-label={t('footerNavLabel')} className="mb-3 flex flex-wrap items-center justify-center gap-x-3">
                {/* min-h-11 + px pad each link to a ~44px tap target without changing the text size. */}
                <Link href="/about" className={FOOTER_LINK}>{t('aboutNav')}</Link>
                <Link href="/#faq" className={FOOTER_LINK}>{t('faqNav')}</Link>
                <Link href="/privacy" className={FOOTER_LINK}>{t('privacyPolicy')}</Link>
                <Link href="/terms" className={FOOTER_LINK}>{t('termsNav')}</Link>
                <Link href="/status" className={FOOTER_LINK}>{t('checkServices')}</Link>
                <a href={`mailto:${CONTACT_EMAIL}`} className={FOOTER_LINK}>{t('contactUs')}</a>
            </nav>
            <p>{t('footerCopy')}</p>
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                <span>{t('footerInitiative')}</span>
                <a
                    href={PLATFORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 font-bold text-gray-300 hover:text-cyber-safe transition-colors"
                >
                    <Image
                        src="/scouthub.svg"
                        alt=""
                        width={20}
                        height={20}
                        unoptimized
                        className="rounded-md"
                    />
                    <span dir="ltr">{t('footerPlatformName')}</span>
                </a>
            </p>
        </footer>
    );
}
