import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

async function loadProxy() {
    return import('@/proxy');
}

afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
});

describe('proxy - page CSP', () => {
    it('sets a nonce-based CSP with no unsafe-inline for scripts', async () => {
        const { proxy } = await loadProxy();
        const res = proxy(new NextRequest('https://linkguard.scouthub.dev/'));
        const csp = res.headers.get('Content-Security-Policy') ?? '';

        const scriptSrc = csp.split('; ').find((d) => d.startsWith('script-src')) ?? '';
        expect(scriptSrc).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
        expect(scriptSrc).toContain("'strict-dynamic'");
        expect(scriptSrc).not.toContain("'unsafe-inline'");
        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).toContain("object-src 'none'");
    });

    it('forwards the same nonce to rendering via the request headers', async () => {
        const { proxy } = await loadProxy();
        const res = proxy(new NextRequest('https://linkguard.scouthub.dev/about'));
        const csp = res.headers.get('Content-Security-Policy') ?? '';
        const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];

        expect(nonce).toBeTruthy();
        // NextResponse.next({ request: { headers } }) encodes overridden
        // request headers as x-middleware-request-* on the response.
        expect(res.headers.get('x-middleware-request-x-nonce')).toBe(nonce);
        expect(res.headers.get('x-middleware-request-content-security-policy')).toBe(csp);
    });

    it('generates a fresh nonce per request', async () => {
        const { proxy } = await loadProxy();
        const a = proxy(new NextRequest('https://linkguard.scouthub.dev/')).headers.get('Content-Security-Policy');
        const b = proxy(new NextRequest('https://linkguard.scouthub.dev/')).headers.get('Content-Security-Policy');
        expect(a).not.toBe(b);
    });

    it("only allows 'unsafe-eval' in development", async () => {
        const { buildCsp } = await loadProxy();
        expect(buildCsp('abc', false)).not.toContain("'unsafe-eval'");
        expect(buildCsp('abc', true)).toContain("'unsafe-eval'");
    });
});

describe('proxy - API CORS', () => {
    it('answers preflight from an allowed origin and sets no CSP', async () => {
        const { proxy } = await loadProxy();
        const res = proxy(
            new NextRequest('https://linkguard.scouthub.dev/api/verdict', {
                method: 'OPTIONS',
                headers: { origin: 'https://localhost' },
            })
        );
        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://localhost');
        expect(res.headers.get('Content-Security-Policy')).toBeNull();
    });

    it('does not grant CORS to an unknown origin', async () => {
        const { proxy } = await loadProxy();
        const res = proxy(
            new NextRequest('https://linkguard.scouthub.dev/api/verdict', {
                method: 'OPTIONS',
                headers: { origin: 'https://evil.example' },
            })
        );
        expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
});
