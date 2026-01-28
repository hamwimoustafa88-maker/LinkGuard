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

        const apiKey = process.env.UNSHORTEN_API_KEY;
        if (!apiKey) {
            console.error('❌ UNSHORTEN_API_KEY is not set');
            return NextResponse.json(
                { success: false, error: 'خطأ في إعدادات الخادم' },
                { status: 500 }
            );
        }

        // Check if URL is actually shortened
        const shortDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'short.link', 'is.gd', 'buff.ly'];
        const isShortened = shortDomains.some(domain => url.includes(domain));

        if (!isShortened) {
            // Not a shortened URL, return as-is
            console.log('✅ URL is not shortened, returning as-is:', url);
            return NextResponse.json({
                success: true,
                originalUrl: url,
            });
        }

        console.log('🔄 Attempting to unshorten URL:', url);

        // Call Unshorten.me API using correct format: GET with query parameter
        const apiUrl = `https://unshorten.me/api/v2/unshorten?url=${encodeURIComponent(url)}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${apiKey}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Unshorten API error:', response.status, errorText);

            // If unshorten fails, return original URL instead of failing completely
            console.log('⚠️ Falling back to original URL');
            return NextResponse.json({
                success: true,
                originalUrl: url,
                note: 'فشل فك الاختصار، تم استخدام الرابط الأصلي',
            });
        }

        const data = await response.json();
        console.log('✅ Unshorten API response:', data);

        // Extract the unshortened URL from response
        const unshortenedUrl = data.resolved_url || data.url || url;

        console.log('✅ Successfully unshortened:', url, '→', unshortenedUrl);

        return NextResponse.json({
            success: true,
            originalUrl: unshortenedUrl,
        });
    } catch (error: any) {
        console.error('❌ Unshorten error:', error.message);

        // Return success with original URL instead of failing completely
        return NextResponse.json({
            success: true,
            originalUrl: url || 'unknown',
            note: 'حدث خطأ، تم استخدام الرابط الأصلي',
        });
    }
}
