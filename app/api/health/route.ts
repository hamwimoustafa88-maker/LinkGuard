import { NextResponse } from 'next/server';

interface ServiceStatus {
    status: 'online' | 'offline' | 'error' | 'no_key';
    latency: number;
    message: string;
}

async function checkKeyedService(
    keyEnvVar: string,
    check: () => Promise<{ ok: boolean; message: string }>
): Promise<ServiceStatus> {
    if (!process.env[keyEnvVar]) {
        return { status: 'no_key', latency: 0, message: 'مفتاح API غير مضبوط' };
    }

    const start = Date.now();
    try {
        const { ok, message } = await check();
        const latency = Date.now() - start;
        return { status: ok ? 'online' : 'error', latency, message };
    } catch (e: any) {
        return { status: 'offline', latency: 0, message: e.message };
    }
}

export async function GET() {
    const [virustotal, urlscan, safebrowsing, urlhaus, abuseipdb] = await Promise.all([
        checkKeyedService('VIRUSTOTAL_API_KEY', async () => {
            const res = await fetch('https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8', {
                headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY || '' },
                signal: AbortSignal.timeout(8000),
            });
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        }),
        checkKeyedService('URLSCAN_API_KEY', async () => {
            const res = await fetch('https://urlscan.io/user/quotas/', {
                headers: { 'API-Key': process.env.URLSCAN_API_KEY || '' },
                signal: AbortSignal.timeout(8000),
            });
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        }),
        checkKeyedService('GOOGLE_SAFE_BROWSING_API_KEY', async () => {
            const res = await fetch(
                `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client: { clientId: 'linkguard', clientVersion: '1.0.0' },
                        threatInfo: {
                            threatTypes: ['MALWARE'],
                            platformTypes: ['ANY_PLATFORM'],
                            threatEntryTypes: ['URL'],
                            threatEntries: [{ url: 'https://example.com' }],
                        },
                    }),
                    signal: AbortSignal.timeout(8000),
                }
            );
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        }),
        checkKeyedService('URLHAUS_AUTH_KEY', async () => {
            const form = new URLSearchParams();
            form.append('url', 'https://example.com');
            const res = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
                method: 'POST',
                headers: { 'Auth-Key': process.env.URLHAUS_AUTH_KEY || '', 'Content-Type': 'application/x-www-form-urlencoded' },
                body: form,
                signal: AbortSignal.timeout(8000),
            });
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        }),
        checkKeyedService('ABUSEIPDB_API_KEY', async () => {
            const res = await fetch('https://api.abuseipdb.com/api/v2/check?ipAddress=8.8.8.8', {
                headers: { Key: process.env.ABUSEIPDB_API_KEY || '', Accept: 'application/json' },
                signal: AbortSignal.timeout(8000),
            });
            return { ok: res.ok, message: res.ok ? 'متصل' : `خطأ: ${res.status}` };
        }),
    ]);

    return NextResponse.json({ virustotal, urlscan, safebrowsing, urlhaus, abuseipdb });
}
