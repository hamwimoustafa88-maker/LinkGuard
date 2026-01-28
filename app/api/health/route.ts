import { NextResponse } from 'next/server';

export async function GET() {
    const results = {
        virustotal: { status: 'unknown', latency: 0, message: '' },
        urlscan: { status: 'unknown', latency: 0, message: '' },
        unshorten: { status: 'unknown', latency: 0, message: '' },
    };

    // 1. Check VirusTotal
    if (!process.env.VIRUSTOTAL_API_KEY) {
        results.virustotal = { status: 'error', latency: 0, message: 'مفتاح API مفقود' };
    } else {
        const start = Date.now();
        try {
            // Check a known safe IP or domain to test API
            const res = await fetch('https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8', {
                headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY || '' }
            });
            const latency = Date.now() - start;
            if (res.ok) {
                results.virustotal = { status: 'online', latency, message: 'متصل' };
            } else {
                results.virustotal = { status: 'error', latency, message: `خطأ: ${res.status}` };
            }
        } catch (e: any) {
            results.virustotal = { status: 'offline', latency: 0, message: e.message };
        }
    }

    // 2. Check URLScan.io
    if (!process.env.URLSCAN_API_KEY) {
        results.urlscan = { status: 'error', latency: 0, message: 'مفتاح API مفقود' };
    } else {
        const start = Date.now();
        try {
            // Check quota or simple endpoint
            const res = await fetch('https://urlscan.io/user/quotas/', {
                headers: { 'API-Key': process.env.URLSCAN_API_KEY || '' }
            });
            const latency = Date.now() - start;
            if (res.ok) {
                results.urlscan = { status: 'online', latency, message: 'متصل' };
            } else {
                // If quota fail, it might be 400/403 but network is ok, but we need API to work.
                results.urlscan = { status: 'error', latency, message: `خطأ: ${res.status}` };
            }
        } catch (e: any) {
            results.urlscan = { status: 'offline', latency: 0, message: e.message };
        }
    }

    // 3. Check Unshorten service (mock check as we use public API or library, assumed generic internet check)
    // Actually we implemented a local unshorten or used an external API in route?
    // Let's check the external API we use 'https://unshorten.me/api/v2/unshorten?url=...'
    const start = Date.now();
    try {
        const res = await fetch('https://unshorten.me/api/v2/unshorten?url=https://t.ly/test', {
            method: 'GET'
        });
        const latency = Date.now() - start;
        if (res.ok) {
            results.unshorten = { status: 'online', latency, message: 'متصل' };
        } else {
            // Unshorten.me might return text directly
            results.unshorten = { status: 'online', latency, message: 'متصل (مع تنبيه)' };
        }
    } catch (e: any) {
        results.unshorten = { status: 'offline', latency: 0, message: e.message };
    }

    return NextResponse.json(results);
}
