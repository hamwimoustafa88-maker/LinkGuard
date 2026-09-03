import { NextRequest, NextResponse } from 'next/server';
import tls from 'tls';
import { parse } from 'tldts';
import { assertPublicHttpUrl, SsrfBlockedError } from '@/lib/server/ssrfGuard';
import { cacheGet, cacheSet, cacheKey } from '@/lib/server/cache';
import type { DomainInfo, SslInfo } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 20;

async function fetchDomainAge(registrableDomain: string): Promise<{ status: 'ok' | 'skipped' | 'error'; info?: DomainInfo }> {
    try {
        const res = await fetch(`https://rdap.org/domain/${registrableDomain}`, {
            signal: AbortSignal.timeout(8000),
            headers: { Accept: 'application/rdap+json' },
        });

        if (res.status === 404) {
            return { status: 'skipped' };
        }
        if (!res.ok) {
            return { status: 'error' };
        }

        const data = await res.json();
        const events: { eventAction: string; eventDate: string }[] = data.events || [];
        const registration = events.find(e => e.eventAction === 'registration');
        if (!registration) {
            return { status: 'skipped' };
        }

        const createdAt = registration.eventDate;
        const ageDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const registrarEntity = (data.entities || []).find((e: any) => (e.roles || []).includes('registrar'));
        const registrar = registrarEntity?.vcardArray?.[1]?.find((f: any) => f[0] === 'fn')?.[3];

        return { status: 'ok', info: { ageDays, createdAt, registrar } };
    } catch {
        return { status: 'error' };
    }
}

function checkSsl(hostname: string): Promise<{ status: 'ok' | 'skipped' | 'error'; info?: SslInfo }> {
    return new Promise((resolve) => {
        const socket = tls.connect(
            {
                host: hostname,
                port: 443,
                servername: hostname,
                rejectUnauthorized: false,
                timeout: 5000,
            },
            () => {
                try {
                    const cert = socket.getPeerCertificate();
                    if (!cert || !cert.subject) {
                        resolve({ status: 'skipped' });
                        socket.end();
                        return;
                    }

                    const selfSigned = cert.issuer?.CN === cert.subject?.CN;
                    const hostnameMatch = !tls.checkServerIdentity(hostname, cert);
                    const validTo = cert.valid_to;
                    const daysUntilExpiry = Math.floor((new Date(validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                    // DN fields (O, CN) are technically multi-valued in the X.509 encoding,
                    // so newer @types/node types them as string | string[].
                    const dnField = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

                    resolve({
                        status: 'ok',
                        info: {
                            issuer: dnField(cert.issuer?.O) || dnField(cert.issuer?.CN),
                            validFrom: cert.valid_from,
                            validTo,
                            daysUntilExpiry,
                            selfSigned,
                            hostnameMatch,
                            valid: hostnameMatch && daysUntilExpiry > 0 && !selfSigned,
                        },
                    });
                } catch {
                    resolve({ status: 'error' });
                } finally {
                    socket.end();
                }
            }
        );

        socket.on('error', () => resolve({ status: 'error' }));
        socket.on('timeout', () => {
            socket.destroy();
            resolve({ status: 'error' });
        });
    });
}

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();
        if (!url) {
            return NextResponse.json({ success: false, error: 'عنوان URL مطلوب' }, { status: 400 });
        }

        let validated;
        try {
            validated = await assertPublicHttpUrl(url);
        } catch (err) {
            if (err instanceof SsrfBlockedError) {
                return NextResponse.json({ success: false, error: 'رابط غير آمن', blocked: true }, { status: 400 });
            }
            throw err;
        }

        const hostname = validated.hostname;

        const key = cacheKey('domaininfo', hostname);
        const cached = cacheGet<Record<string, unknown>>(key);
        if (cached) {
            return NextResponse.json(cached);
        }

        const parsed = parse(hostname);
        const registrableDomain = parsed.domain;

        const [ageResult, sslResult] = await Promise.allSettled([
            registrableDomain ? fetchDomainAge(registrableDomain) : Promise.resolve({ status: 'skipped' as const }),
            validated.protocol === 'https:' ? checkSsl(hostname) : Promise.resolve({ status: 'skipped' as const }),
        ]);

        const result = {
            success: true,
            domainAge: ageResult.status === 'fulfilled' ? ageResult.value : { status: 'error' },
            ssl: sslResult.status === 'fulfilled' ? sslResult.value : { status: 'error' },
        };

        // Domain age/registrar/certificate rarely change within a day — cache longer.
        cacheSet(key, result, 6 * 60 * 60 * 1000);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ success: false, error: 'فشل جلب معلومات النطاق' }, { status: 500 });
    }
}
