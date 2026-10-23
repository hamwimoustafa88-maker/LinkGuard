'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from './LanguageContext';

const PLATFORM_URL = 'https://scouthub.dev/';
const CONTACT_EMAIL = 'hamwi.moustafa88@gmail.com';

/** Footer links, copyright and "initiative of ScoutHub" line shown at the bottom of every
 * page. Mounted once in app/layout.tsx so new routes get it automatically. */
export default function SiteFooter() {
    const { t } = useLanguage();

    return (
        <footer className="relative z-10 text-center text-gray-500 text-sm px-4 pb-8 pt-4">
            <nav aria-label="Footer" className="mb-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
                <Link href="/privacy" className="hover:text-cyber-safe underline transition-colors">
                    {t('privacyPolicy')}
                </Link>
                <Link href="/status" className="hover:text-cyber-safe underline transition-colors">
                    {t('checkServices')}
                </Link>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-cyber-safe underline transition-colors">
                    {t('contactUs')}
                </a>
            </nav>
            <p>{t('footerCopy')}</p>
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                <span>{t('footerInitiative')}</span>
                <a
                    href={PLATFORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-gray-300 hover:text-cyber-safe transition-colors"
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
