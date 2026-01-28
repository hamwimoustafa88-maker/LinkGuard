export enum ScanStatus {
    IDLE = 'IDLE',
    UNSHORTENING = 'UNSHORTENING',
    SCANNING = 'SCANNING',
    ANALYZING = 'ANALYZING',
    COMPLETE = 'COMPLETE',
    ERROR = 'ERROR',
}

export enum VerdictType {
    SAFE = 'SAFE',
    DANGER = 'DANGER',
    WARNING = 'WARNING',
    UNKNOWN = 'UNKNOWN',
}

export interface VTStats {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
}

export interface PhishingAlert {
    detected: boolean;
    brandName?: string;
    brandNameArabic?: string;
    fakeDomain?: string;
    legitimateDomains?: string[];
    reason?: string;
    severity: 'low' | 'medium' | 'high';
}

export interface ScanResult {
    status: ScanStatus;
    originalUrl?: string;
    unshortenedUrl?: string;
    verdict: VerdictType;
    vtStats?: VTStats;
    screenshotUrl?: string;
    networkInfo?: {
        country?: string;
        ip?: string;
        server?: string;
    };
    phishingAlert?: PhishingAlert;
    vtDetails?: {
        votes?: {
            harmless: number;
            malicious: number;
        };
        scans?: Record<string, {
            category: string;
            result: string;
            method: string;
            engine_name: string;
        }>;
    };
    vtUrlMeta?: {
        title?: string;
        tags?: string[];
        categories?: Record<string, string>;
        reputation?: number;
        times_submitted?: number;
        first_submission_date?: number;
        last_submission_date?: number;
        total_votes?: {
            harmless: number;
            malicious: number;
        };
    };
    scanId?: string;
    error?: string;
}
