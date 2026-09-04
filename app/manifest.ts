import type { MetadataRoute } from 'next';

// Static content with no per-request logic - forcing this lets the mobile
// (Capacitor) build's `output: 'export'` prerender it, which Next.js
// otherwise refuses for any route handler (manifest.ts included) that
// doesn't declare force-static or a revalidate window.
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'LinkGuard - كاشف الروابط الخبيثة',
        short_name: 'LinkGuard',
        description: 'فحص الروابط من البرمجيات الخبيثة والتصيد الاحتيالي قبل النقر عليها',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0a0e27',
        theme_color: '#0a0e27',
        icons: [
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/icon-maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
