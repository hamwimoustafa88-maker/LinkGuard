import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet, cacheKey } from '@/lib/server/cache';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ success: false, error: 'عنوان URL مطلوب' }, { status: 400 });
        }

        const key = cacheKey('virustotal', url);
        const cached = cacheGet<Record<string, unknown>>(key);
        if (cached) {
            return NextResponse.json(cached);
        }

        const apiKey = process.env.VIRUSTOTAL_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: true, status: 'skipped' });
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
                return NextResponse.json({ success: true, status: 'error', reason: 'rate_limited' });
            }
            return NextResponse.json({ success: true, status: 'error', reason: 'submit_failed' });
        }

        const submitData = await submitResponse.json();
        const analysisId = submitData.data.id;

        // Step 2: Poll for completion with a bounded, soft timeout — a timeout no
        // longer fails the whole scan, it just means this source contributes nothing.
        let stats = { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
        let details: any = {};
        let isCompleted = false;
        let attempts = 0;
        const maxAttempts = 12; // 12 * 2s = 24s max
        let finalScanId = analysisId;

        while (attempts < maxAttempts && !isCompleted) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));

            const analysisResponse = await fetch(
                `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
                { headers: { 'x-apikey': apiKey } }
            );

            if (!analysisResponse.ok) {
                continue;
            }

            const analysisData = await analysisResponse.json();
            const attributes = analysisData.data.attributes;

            if (attributes.status === 'completed') {
                stats = attributes.stats;
                details = attributes.results;
                if (analysisData.meta?.url_info?.id) {
                    finalScanId = analysisData.meta.url_info.id;

                    try {
                        const urlResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${finalScanId}`, {
                            headers: { 'x-apikey': apiKey },
                        });
                        if (urlResponse.ok) {
                            const urlData = await urlResponse.json();
                            const attr = urlData.data.attributes;

                            details = {
                                ...details,
                                ...attr.last_analysis_results,
                            };

                            details.meta = {
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
                    } catch {
                        // metadata is a nice-to-have; ignore failures
                    }
                }

                isCompleted = true;
            }
        }

        if (!isCompleted) {
            return NextResponse.json({ success: true, status: 'error', reason: 'timeout' });
        }

        const result = {
            success: true,
            status: 'ok',
            stats: {
                malicious: stats.malicious || 0,
                suspicious: stats.suspicious || 0,
                harmless: stats.harmless || 0,
                undetected: stats.undetected || 0,
            },
            details,
            vtUrlMeta: details.meta,
            scanId: finalScanId || analysisId,
        };

        cacheSet(key, result);
        return NextResponse.json(result);
    } catch (error) {
        console.error('VirusTotal error:', error);
        return NextResponse.json({ success: true, status: 'error', reason: 'exception' });
    }
}
