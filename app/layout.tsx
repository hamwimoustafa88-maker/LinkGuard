import type { Metadata, Viewport } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import InstallPrompt from '@/components/InstallPrompt';

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

export const metadata: Metadata = {
    title: 'LinkGuard - كاشف الروابط',
    description: 'فحص الروابط من البرمجيات الخبيثة والتصيد الاحتيالي - Scan URLs for malware, phishing, and viruses',
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
                    <ServiceWorkerRegistration />
                    <InstallPrompt />
                </Providers>
            </body>
        </html>
    );
}
