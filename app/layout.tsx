import type { Metadata, Viewport } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import './globals.css';
import Providers from '@/components/Providers';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import InstallPrompt from '@/components/InstallPrompt';
import SiteFooter from '@/components/SiteFooter';
import { SITE_ORIGIN, PLATFORM_URL, REPO_URL, AUTHOR_NAME, AUTHOR_URL, SOCIAL_LINKS } from '@/lib/siteLinks';

// Exposed as --font-*-src (not --font-cairo/--font-tajawal) because Tailwind
// v4's @theme block owns those names for the font-cairo/font-tajawal
// utilities (see app/globals.css), which point back at these variables.
const cairo = Cairo({
    subsets: ['arabic', 'latin'],
    variable: '--font-cairo-src',
    display: 'swap',
});

const tajawal = Tajawal({
    weight: ['400', '500', '700'],
    subsets: ['arabic', 'latin'],
    variable: '--font-tajawal-src',
    display: 'swap',
});

const isMobileBuild = process.env.MOBILE_BUILD === '1';
const SITE_TITLE = 'LinkGuard - كاشف الروابط';
const SITE_DESCRIPTION = 'فحص الروابط من البرمجيات الخبيثة والتصيد الاحتيالي - Scan URLs for malware, phishing, and viruses';

export const metadata: Metadata = {
    metadataBase: new URL(SITE_ORIGIN),
    alternates: { canonical: '/' },
    openGraph: {
        type: 'website',
        url: '/',
        siteName: 'LinkGuard',
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        locale: 'ar_AR',
        alternateLocale: ['en_US'],
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'LinkGuard' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        images: ['/og-image.png'],
    },
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    authors: [{ name: AUTHOR_NAME, url: AUTHOR_URL }],
    creator: AUTHOR_NAME,
    publisher: 'ScoutHub',
    keywords: ['cybersecurity', 'url scanner', 'malware detection', 'phishing', 'أمن سيبراني'],
    manifest: '/manifest.webmanifest',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'LinkGuard',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#0a0e27',
    // Android 15+ (targetSdk 36) forces edge-to-edge with no opt-out, so
    // content draws behind the status/navigation bars unless it opts in to
    // the safe-area insets below (see .safe-area-shell in globals.css).
    viewportFit: 'cover',
};

const ORGANIZATION_ID = `${PLATFORM_URL}#organization`;

// One @graph so search engines / AI assistants can tie the app to who runs it
// (Organization + sameAs accounts) and who built it (author).
const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Organization',
            '@id': ORGANIZATION_ID,
            name: 'ScoutHub',
            url: PLATFORM_URL,
            logo: `${SITE_ORIGIN}/scouthub.svg`,
            sameAs: SOCIAL_LINKS.map((link) => link.href),
        },
        {
            '@type': 'WebSite',
            '@id': `${SITE_ORIGIN}/#website`,
            name: 'LinkGuard',
            url: `${SITE_ORIGIN}/`,
            inLanguage: ['ar', 'en'],
            publisher: { '@id': ORGANIZATION_ID },
        },
        {
            '@type': 'SoftwareApplication',
            name: 'LinkGuard',
            url: `${SITE_ORIGIN}/`,
            description: SITE_DESCRIPTION,
            applicationCategory: 'SecurityApplication',
            operatingSystem: 'All',
            image: `${SITE_ORIGIN}/og-image.png`,
            sameAs: [REPO_URL],
            author: { '@type': 'Person', name: AUTHOR_NAME, url: AUTHOR_URL },
            publisher: { '@id': ORGANIZATION_ID },
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
            },
        },
    ],
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // The strict CSP set in proxy.ts uses a per-request nonce, which Next.js can
    // only stamp onto its inline scripts while rendering a request - so every
    // page renders at request time. The mobile static export has no requests
    // (and no proxy; the WebView's policy lives in capacitor.config.ts), so it
    // keeps prerendering.
    let nonce: string | undefined;
    if (!isMobileBuild) {
        await connection();
        nonce = (await headers()).get('x-nonce') ?? undefined;
    }

    return (
        <html lang="ar" dir="rtl">
            <body className={`${cairo.variable} ${tajawal.variable} font-cairo antialiased bg-cyber-dark text-white`}>
                <script
                    type="application/ld+json"
                    nonce={nonce}
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                <Providers>
                    {children}
                    <SiteFooter />
                    <ServiceWorkerRegistration />
                    <InstallPrompt />
                </Providers>
            </body>
        </html>
    );
}
