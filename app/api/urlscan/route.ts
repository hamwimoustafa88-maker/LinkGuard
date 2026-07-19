import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 45;

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ success: false, error: 'عنوان URL مطلوب' }, { status: 400 });
        }

        const apiKey = process.env.URLSCAN_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: true, status: 'skipped', screenshotUrl: null });
        }

        // Step 1: Initiate scan
        const scanResponse = await fetch('https://urlscan.io/api/v1/scan/', {
            method: 'POST',
            headers: {
                'API-Key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                visibility: 'public',
            }),
        });

        if (!scanResponse.ok) {
            if (scanResponse.status === 429) {
                return NextResponse.json({ success: true, status: 'error', reason: 'rate_limited', screenshotUrl: null });
            }
            return NextResponse.json({ success: true, status: 'error', reason: 'submit_failed', screenshotUrl: null });
        }

        const scanData = await scanResponse.json();
        const resultUrl = scanData.api;

        // Step 2: Poll for the result (urlscan.io typically takes 10-15s)
        let resultData: any = null;
        const maxAttempts = 5;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 3000));

            const resultResponse = await fetch(resultUrl, {
                method: 'GET',
                headers: { 'API-Key': apiKey },
            });

            if (resultResponse.ok) {
                resultData = await resultResponse.json();
                break;
            }
        }

        if (!resultData) {
            return NextResponse.json({ success: true, status: 'error', reason: 'timeout', screenshotUrl: null });
        }

        const screenshotUrl = resultData.task?.screenshotURL || resultData.screenshot || null;

        return NextResponse.json({
            success: true,
            status: 'ok',
            screenshotUrl,
            country: resultData.page?.country || null,
            ip: resultData.page?.ip || null,
            server: resultData.page?.server || null,
        });
    } catch (error: any) {
        console.error('URLScan error:', error.message);
        return NextResponse.json({ success: true, status: 'error', reason: 'exception', screenshotUrl: null });
    }
}
