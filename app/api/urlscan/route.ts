import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    let url = '';

    try {
        const body = await request.json();
        url = body.url;

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'عنوان URL مطلوب' },
                { status: 400 }
            );
        }

        const apiKey = process.env.URLSCAN_API_KEY;
        if (!apiKey) {
            console.error('❌ URLSCAN_API_KEY is not set');
            return NextResponse.json(
                { success: false, error: 'خطأ في إعدادات الخادم' },
                { status: 500 }
            );
        }

        console.log('🔍 Starting URLScan for:', url);

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
            const errorText = await scanResponse.text();
            console.error('❌ URLScan initiate error:', scanResponse.status, errorText);

            if (scanResponse.status === 429) {
                return NextResponse.json(
                    { success: true, screenshotUrl: null, note: 'خدمة المعاينة مشغولة' },
                    { status: 200 }
                );
            }

            // Return success but without screenshot
            return NextResponse.json({
                success: true,
                screenshotUrl: null,
                note: 'لم يتم إنشاء معاينة',
            });
        }

        const scanData = await scanResponse.json();
        console.log('✅ URLScan initiated:', scanData.uuid);

        const resultUrl = scanData.api;

        // Step 2: Wait for scan to complete (URLScan.io typically takes 10-15 seconds)
        console.log('⏳ Waiting for scan to complete (15 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Step 3: Get scan results
        const resultResponse = await fetch(resultUrl, {
            method: 'GET',
            headers: {
                'API-Key': apiKey,
            },
        });

        if (!resultResponse.ok) {
            console.log('⚠️ Scan still processing or failed');
            // Scan might still be processing
            return NextResponse.json({
                success: true,
                screenshotUrl: null,
                note: 'الفحص قيد المعالجة',
            });
        }

        const resultData = await resultResponse.json();
        console.log('✅ URLScan completed successfully');

        // Extract screenshot and network info
        const screenshotUrl = resultData.task?.screenshotURL ||
            resultData.screenshot ||
            null;

        return NextResponse.json({
            success: true,
            screenshotUrl: screenshotUrl,
            country: resultData.page?.country || null,
            ip: resultData.page?.ip || null,
            server: resultData.page?.server || null,
        });
    } catch (error: any) {
        console.error('❌ URLScan error:', error.message);

        // Return success but without screenshot to not break the scan flow
        return NextResponse.json({
            success: true,
            screenshotUrl: null,
            note: 'لم يتم إنشاء معاينة',
        });
    }
}
