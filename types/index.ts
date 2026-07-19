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

// --- Evidence / scoring engine types ---

export type EvidenceSource =
    | 'virustotal'
    | 'safebrowsing'
    | 'urlhaus'
    | 'phishtank'
    | 'abuseipdb'
    | 'heuristics'
    | 'domainAge'
    | 'ssl'
    | 'redirects'
    | 'urlscan';

export type EvidenceSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface EvidenceItem {
    id: string;
    source: EvidenceSource;
    severity: EvidenceSeverity;
    points: number;
    authoritative?: boolean;
    params?: Record<string, string | number>;
}

export type SourceStatus = 'ok' | 'skipped' | 'error';

export interface SourceOutcome {
    source: string;
    status: SourceStatus;
}

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface AggregatedVerdict {
    score: number;
    verdict: VerdictType;
    confidence: ConfidenceLevel;
    evidence: EvidenceItem[];
    sources: SourceOutcome[];
}

// --- Redirect / domain intelligence types ---

export interface RedirectHop {
    url: string;
    status: number | null;
}

export interface DomainInfo {
    ageDays?: number;
    createdAt?: string;
    registrar?: string;
}

export interface SslInfo {
    issuer?: string;
    validFrom?: string;
    validTo?: string;
    daysUntilExpiry?: number;
    selfSigned?: boolean;
    hostnameMatch?: boolean;
    valid: boolean;
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
    riskScore?: AggregatedVerdict;
    redirectChain?: RedirectHop[];
    domainInfo?: DomainInfo;
    sslInfo?: SslInfo;
}
