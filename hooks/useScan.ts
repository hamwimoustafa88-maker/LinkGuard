'use client';

import { useState } from 'react';
import { ScanStatus, VerdictType, type ScanResult } from '@/types';
import type { ErrorCode } from '@/types/api';
import { runScan, postJson } from '@/lib/scan';
import { appendHistory } from '@/utils/history';
import { useLanguage } from '@/components/LanguageContext';
import type { TranslationKey } from '@/utils/translations';

const ERROR_CODE_TO_TRANSLATION_KEY: Record<ErrorCode, TranslationKey> = {
    missing_url: 'errorMissingUrl',
    ssrf_blocked: 'errorSsrfBlocked',
    rate_limited: 'errorRateLimited',
    resolve_failed: 'errorResolveFailed',
    internal: 'errorInternal',
};

/** Thin React wrapper around lib/scan's runScan: owns the ScanResult state,
 * supplies the live progress callback, and records history on completion. */
export function useScan() {
    const { t } = useLanguage();
    const [scanResult, setScanResult] = useState<ScanResult>({
        status: ScanStatus.IDLE,
        verdict: VerdictType.UNKNOWN,
    });

    const scan = async (url: string) => {
        const result = await runScan(url, {
            post: postJson,
            fallbackErrorMessage: t('statusError'),
            translateError: (code) => t(ERROR_CODE_TO_TRANSLATION_KEY[code]),
            onProgress: (partial) => setScanResult((prev) => ({ ...prev, ...partial })),
        });

        setScanResult(result);

        if (result.status === ScanStatus.COMPLETE && result.riskScore) {
            appendHistory({
                url,
                finalUrl: result.unshortenedUrl || url,
                verdict: result.riskScore.verdict,
                score: result.riskScore.score,
                timestamp: Date.now(),
            });
        }
    };

    return { scanResult, scan };
}
