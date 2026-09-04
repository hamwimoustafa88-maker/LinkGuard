// Base URL for app/api/* calls. Empty on the web build - fetches stay
// same-origin relative paths, exactly as they are today. Set at mobile
// build time (see scripts/build-mobile.mjs / .env.production) so the
// Capacitor WebView (origin https://localhost) calls the hosted backend
// on Vercel instead.
const BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/+$/, '');

export function apiUrl(path: string): string {
    return `${BASE}${path}`;
}
