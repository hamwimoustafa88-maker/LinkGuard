import type { Metadata } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const cairo = Cairo({
    subsets: ['arabic', 'latin'],
    variable: '--font-cairo',
    display: 'swap',
});

const tajawal = Tajawal({
    weight: ['400', '500', '700'],
    subsets: ['arabic', 'latin'],
    variable: '--font-tajawal',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'LinkGuard - كاشف الروابط',
    description: 'فحص الروابط من البرمجيات الخبيثة والتصيد الاحتيالي - Scan URLs for malware, phishing, and viruses',
    keywords: ['cybersecurity', 'url scanner', 'malware detection', 'phishing', 'أمن سيبراني'],
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
            <body className={`${cairo.variable} ${tajawal.variable} antialiased bg-cyber-dark text-white`}>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
