import { NextResponse, type NextRequest } from 'next/server';

// Explicit allowlist - never '*': /api/* routes spend paid/rate-limited
// third-party quota (VirusTotal, urlscan.io, Safe Browsing, ...) per request,
// so an open CORS policy would let any site burn through it on our behalf.
const ALLOWED = new Set(
    [
        'https://localhost', // Capacitor Android WebView (androidScheme: 'https')
        'capacitor://localhost', // Capacitor iOS, if the platform is added later
        process.env.NEXT_PUBLIC_SITE_ORIGIN, // the web app's own origin
    ].filter((origin): origin is string => Boolean(origin))
);

function corsHeaders(origin: string): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-health-token',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
    };
}

function handleApi(request: NextRequest): NextResponse {
    const origin = request.headers.get('origin');
    const allowed = origin !== null && ALLOWED.has(origin);

    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: allowed && origin ? corsHeaders(origin) : {},
        });
    }

    const response = NextResponse.next();
    if (allowed && origin) {
        for (const [key, value] of Object.entries(corsHeaders(origin))) {
            response.headers.set(key, value);
        }
    }
    return response;
}

/** Strict, nonce-based CSP (no 'unsafe-inline' for scripts). Next.js reads the
 * nonce back out of the *request's* Content-Security-Policy header while
 * rendering and stamps it on every framework/inline script it emits, which is
 * why app/layout.tsx opts all pages into request-time rendering - a page
 * prerendered at build time has no request, so no nonce to stamp.
 * 'strict-dynamic' lets those nonced scripts load the lazily-imported chunks
 * (QR scanner, etc.) without having to allowlist each one. */
export function buildCsp(nonce: string, isDev = process.env.NODE_ENV !== 'production'): string {
    return [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
        // Inline style *attributes* (framer-motion, Tailwind arbitrary values)
        // can't carry a nonce, so styles keep 'unsafe-inline' - CSS can't run code.
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
}

function handlePage(request: NextRequest): NextResponse {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const csp = buildCsp(nonce);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', csp);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Security-Policy', csp);
    return response;
}

export function proxy(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return handleApi(request);
    }
    return handlePage(request);
}

export const config = {
    matcher: [
        '/api/:path*',
        {
            // Pages only: skip build assets and any path with a file extension
            // (icons, sw.js, robots.txt, sitemap.xml, llms.txt, .well-known/*),
            // plus <Link> prefetches, which return RSC payloads, not HTML.
            source: '/((?!api/|_next/static|_next/image|.*\\..*).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
};
