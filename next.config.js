const isMobile = process.env.MOBILE_BUILD === '1';
const isDev = process.env.NODE_ENV !== 'production';
const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN || 'https://linkguard.scouthub.dev';

// 'unsafe-inline' for scripts is needed by Next's inline hydration payload and
// the JSON-LD block in app/layout.tsx; a nonce-based policy would force every
// page into dynamic rendering. Everything else is locked to same-origin -
// the only third-party resource the UI loads is the urlscan.io screenshot.
const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://urlscan.io",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
    { key: 'Content-Security-Policy', value: csp },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // camera=(self): the QR scanner needs getUserMedia on our own origin.
    { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        // Static export has no server to run the Image Optimization API -
        // required by Next.js whenever output: 'export' is set.
        unoptimized: isMobile,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'urlscan.io',
            },
        ],
    },
    // Static export (mobile) has no server to attach headers to; the Android
    // WebView is also governed by capacitor.config.ts, not these.
    ...(!isMobile && {
        async headers() {
            return [
                {
                    source: '/:path*',
                    headers: securityHeaders,
                },
                {
                    // Vercel serves prerendered pages with
                    // `Access-Control-Allow-Origin: *`; pin HTML pages to our own
                    // origin. /api/* is excluded - proxy.ts owns its CORS allowlist.
                    source: '/((?!api/).*)',
                    headers: [{ key: 'Access-Control-Allow-Origin', value: siteOrigin }],
                },
            ];
        },
    }),
    ...(isMobile && {
        output: 'export',
        // Emits out/status/index.html, which Capacitor's local web server
        // resolves for the /status route. Output lands in the default
        // out/ dir (webDir in capacitor.config.ts) - Next.js repurposes
        // `distDir` as the export destination itself under output:
        // 'export', so it's deliberately left unset here.
        trailingSlash: true,
        // scripts/build-mobile.mjs temporarily parks app/api (not part of
        // the mobile bundle) so `__tests__/*` importing those routes fail
        // type-check here even though the real tree is already verified by
        // `npm run typecheck` against app/api in place.
        typescript: { ignoreBuildErrors: true },
    }),
};

module.exports = nextConfig;
