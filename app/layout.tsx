import type { Metadata, Viewport } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import InstallPrompt from '@/components/InstallPrompt';
import SiteFooter from '@/components/SiteFooter';

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

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN || 'https://linkguard.scouthub.dev';
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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "LinkGuard",
        "applicationCategory": "SecurityApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    return (
        <html lang="ar" dir="rtl">
            <body className={`${cairo.variable} ${tajawal.variable} font-cairo antialiased bg-cyber-dark text-white`}>
                <script
                    type="application/ld+json"
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
