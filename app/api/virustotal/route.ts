import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'عنوان URL مطلوب' },
                { status: 400 }
            );
        }

        const apiKey = process.env.VIRUSTOTAL_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'خطأ في إعدادات الخادم' },
                { status: 500 }
            );
        }

        // Step 1: Submit URL for scanning
        const formData = new URLSearchParams();
        formData.append('url', url);

        const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
            method: 'POST',
            headers: {
                'x-apikey': apiKey,
            },
            body: formData,
        });

        if (!submitResponse.ok) {
            if (submitResponse.status === 429) {
                return NextResponse.json(
                    { success: false, error: 'خدمة الفحص مشغولة، حاول مرة أخرى' },
                    { status: 429 }
                );
            }
            throw new Error('فشل إرسال URL للفحص');
        }

        const submitData = await submitResponse.json();
        const analysisId = submitData.data.id;

        // Step 2: Strict Polling (Wait until completion or very long timeout)
        let stats = { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
        let details = {};
        let votes = {};
        let isCompleted = false;
        let attempts = 0;
        const maxAttempts = 30; // 30 * 2s = 60s max (Increased for strictness)
        let finalScanId = analysisId; // Default to analysis ID

        // Strict loop: We MUST get a result.
        while (attempts < maxAttempts && !isCompleted) {
            attempts++;
            // Wait 2 seconds between checks
            await new Promise(resolve => setTimeout(resolve, 2000));

            const analysisResponse = await fetch(
                `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
                {
                    headers: {
                        'x-apikey': apiKey,
                    },
                }
            );

            if (!analysisResponse.ok) {
                console.error('VT polling error:', analysisResponse.status);
                continue;
            }

            const analysisData = await analysisResponse.json();
            const attributes = analysisData.data.attributes;
            const status = attributes.status;

            if (status === 'completed') {
                stats = attributes.stats;
                details = attributes.results; // Detailed scan results per engine
                if (analysisData.meta?.url_info?.id) {
                    finalScanId = analysisData.meta.url_info.id;

                    // Fetch full URL object for metadata (Title, Tags, Rep)
                    try {
                        const urlResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${finalScanId}`, {
                            headers: { 'x-apikey': apiKey }
                        });
                        if (urlResponse.ok) {
                            const urlData = await urlResponse.json();
                            const attr = urlData.data.attributes;

                            // Extract useful meta
                            details = {
                                ...details,
                                ...attr.last_analysis_results // Merge if needed or keep separate
                            };

                            // We will send this as a separate meta object
                            (details as any).meta = {
                                title: attr.title,
                                tags: attr.tags,
                                categories: attr.categories,
                                reputation: attr.reputation,
                                times_submitted: attr.times_submitted,
                                first_submission_date: attr.first_submission_date,
                                last_submission_date: attr.last_submission_date,
                                total_votes: attr.total_votes,
                            };
                        }
                    } catch (e) {
                        console.error('Failed to fetch URL meta:', e);
                    }
                }

                isCompleted = true;
            } else {
                console.log(`Scan status: ${status}, waiting... (${attempts}/${maxAttempts})`);
            }
        }

        if (!isCompleted) {
            // Strict requirement: Do NOT return result unless checked.
            return NextResponse.json(
                { success: false, error: 'انتهت مهلة الفحص قبل الحصول على نتائج مؤكدة. يرجى المحاولة مرة أخرى.' },
                { status: 408 }
            );
        }

        return NextResponse.json({
            success: true,
            stats: {
                malicious: stats.malicious || 0,
                suspicious: stats.suspicious || 0,
                harmless: stats.harmless || 0,
                undetected: stats.undetected || 0,
            },
            details: details, // This is the raw results map
            vtUrlMeta: (details as any).meta, // The new rich metadata
            scanId: finalScanId || analysisId
        });
    } catch (error) {
        console.error('VirusTotal error:', error);
        return NextResponse.json(
            { success: false, error: 'فشل فحص الرابط' },
            { status: 500 }
        );
    }
}
