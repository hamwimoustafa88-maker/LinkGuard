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

export function proxy(request: NextRequest) {
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

export const config = {
    matcher: '/api/:path*',
};
