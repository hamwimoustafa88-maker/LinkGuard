// Local heuristic engine for detecting phishing / brand-impersonation attempts.
// Runs entirely client-side (and is safe to run server-side too) — no API keys needed.

import { parse } from 'tldts';
import type { PhishingAlert, EvidenceItem } from '@/types';

interface BrandInfo {
    name: string;
    keywords: string[];
    legitimateDomains: string[];
    arabicName: string;
}

const FAMOUS_BRANDS: BrandInfo[] = [
    { name: 'Facebook', keywords: ['facebook', 'face-book', 'face book', 'fb', 'meta'], legitimateDomains: ['facebook.com', 'fb.com', 'meta.com'], arabicName: 'فيسبوك' },
    { name: 'Google', keywords: ['google', 'gmail'], legitimateDomains: ['google.com', 'gmail.com', 'goo.gl'], arabicName: 'جوجل' },
    { name: 'PayPal', keywords: ['paypal', 'pay-pal'], legitimateDomains: ['paypal.com'], arabicName: 'باي بال' },
    { name: 'Amazon', keywords: ['amazon', 'amzn'], legitimateDomains: ['amazon.com', 'amazon.co.uk', 'amzn.to'], arabicName: 'أمازون' },
    { name: 'Microsoft', keywords: ['microsoft', 'msft', 'outlook', 'hotmail'], legitimateDomains: ['microsoft.com', 'outlook.com', 'hotmail.com', 'live.com'], arabicName: 'مايكروسوفت' },
    { name: 'Apple', keywords: ['apple', 'icloud', 'itunes'], legitimateDomains: ['apple.com', 'icloud.com', 'itunes.com'], arabicName: 'أبل' },
    { name: 'Instagram', keywords: ['instagram', 'insta'], legitimateDomains: ['instagram.com'], arabicName: 'إنستغرام' },
    { name: 'WhatsApp', keywords: ['whatsapp', 'whats-app'], legitimateDomains: ['whatsapp.com', 'wa.me'], arabicName: 'واتساب' },
    { name: 'Netflix', keywords: ['netflix'], legitimateDomains: ['netflix.com'], arabicName: 'نتفليكس' },
    { name: 'TikTok', keywords: ['tiktok', 'tik-tok'], legitimateDomains: ['tiktok.com'], arabicName: 'تيك توك' },
    { name: 'Telegram', keywords: ['telegram'], legitimateDomains: ['telegram.org', 't.me'], arabicName: 'تيليجرام' },
    { name: 'Snapchat', keywords: ['snapchat', 'snap-chat'], legitimateDomains: ['snapchat.com'], arabicName: 'سناب شات' },
    { name: 'X (Twitter)', keywords: ['twitter', 'x.com'], legitimateDomains: ['twitter.com', 'x.com'], arabicName: 'إكس (تويتر)' },
    { name: 'LinkedIn', keywords: ['linkedin', 'linked-in'], legitimateDomains: ['linkedin.com'], arabicName: 'لينكد إن' },
    { name: 'Binance', keywords: ['binance'], legitimateDomains: ['binance.com'], arabicName: 'بينانس' },
    { name: 'DHL', keywords: ['dhl'], legitimateDomains: ['dhl.com'], arabicName: 'دي إتش إل' },
    { name: 'Aramex', keywords: ['aramex'], legitimateDomains: ['aramex.com'], arabicName: 'أرامكس' },
    { name: 'STC', keywords: ['stc', 'stcpay'], legitimateDomains: ['stc.com.sa', 'stcpay.com.sa'], arabicName: 'إس تي سي' },
    { name: 'Absher', keywords: ['absher'], legitimateDomains: ['absher.sa'], arabicName: 'أبشر' },
    { name: 'Visa', keywords: ['visa'], legitimateDomains: ['visa.com'], arabicName: 'فيزا' },
    { name: 'Mastercard', keywords: ['mastercard', 'master-card'], legitimateDomains: ['mastercard.com'], arabicName: 'ماستركارد' },
    { name: 'eBay', keywords: ['ebay'], legitimateDomains: ['ebay.com'], arabicName: 'إيباي' },
    { name: 'Steam', keywords: ['steam', 'steampowered'], legitimateDomains: ['steampowered.com', 'steamcommunity.com'], arabicName: 'ستيم' },
    { name: 'Discord', keywords: ['discord'], legitimateDomains: ['discord.com', 'discord.gg'], arabicName: 'ديسكورد' },
    { name: 'Dropbox', keywords: ['dropbox'], legitimateDomains: ['dropbox.com'], arabicName: 'دروب بوكس' },
];

const SUSPICIOUS_KEYWORDS = [
    'login', 'signin', 'secure', 'update', 'verify', 'account',
    'confirm', 'suspended', 'locked', 'urgent', 'billing',
];

const SUSPICIOUS_TLDS = [
    '.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq',
    '.pw', '.cc', '.ws', '.info', '.biz',
];

function levenshtein(a: string, b: string): number {
    // Every dp[i][j] accessed below is within the (a.length+1) x (b.length+1)
    // grid allocated on the line above, so the non-null assertions are just
    // working around noUncheckedIndexedAccess not tracking loop bounds - not
    // suppressing a real possibility of a hole in the matrix.
    const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i]![0] = i;
    for (let j = 0; j <= b.length; j++) dp[0]![j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i]![j] = Math.min(
                dp[i - 1]![j]! + 1,
                dp[i]![j - 1]! + 1,
                dp[i - 1]![j - 1]! + cost
            );
        }
    }
    return dp[a.length]![b.length]!;
}

function safeUrl(url: string): URL | null {
    try {
        return new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
        return null;
    }
}

function isHomograph(hostname: string): boolean {
    const labels = hostname.split('.');
    if (labels.some(l => l.startsWith('xn--'))) return true;
    return /[^\x00-\x7F]/.test(hostname);
}

function findSubdomainSpoof(hostname: string, registrableDomain: string | null): BrandInfo | null {
    if (!registrableDomain) return null;
    // registrable domain is NOT itself a legit brand domain, but a brand's
    // legit domain appears as a *subdomain* label chain, e.g. paypal.com.evil.tk
    for (const brand of FAMOUS_BRANDS) {
        for (const legit of brand.legitimateDomains) {
            if (hostname !== legit && !hostname.endsWith(`.${legit}`) && hostname.includes(legit)) {
                return brand;
            }
        }
    }
    return null;
}

function findTyposquat(registrableDomainLabel: string): { brand: BrandInfo; distance: number } | null {
    let best: { brand: BrandInfo; distance: number } | null = null;
    for (const brand of FAMOUS_BRANDS) {
        for (const legit of brand.legitimateDomains) {
            const legitLabel = legit.split('.')[0] ?? legit;
            if (legitLabel.length < 4) continue; // avoid noisy short-label false positives
            if (registrableDomainLabel === legitLabel) continue;
            const distance = levenshtein(registrableDomainLabel, legitLabel);
            if (distance >= 1 && distance <= 2) {
                if (!best || distance < best.distance) {
                    best = { brand, distance };
                }
            }
        }
    }
    return best;
}

export function analyzeBrandMismatch(url: string): PhishingAlert {
    try {
        const urlObj = safeUrl(url);
        if (!urlObj) return { detected: false, severity: 'low' };

        const hostname = urlObj.hostname.toLowerCase();
        const fullUrl = url.toLowerCase();
        const parsed = parse(hostname);
        const registrableDomain = parsed.domain;
        const registrableLabel = registrableDomain ? (registrableDomain.split('.')[0] ?? hostname) : hostname;

        const hasSuspiciousKeyword = SUSPICIOUS_KEYWORDS.some(kw => fullUrl.includes(kw));
        const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(tld => hostname.endsWith(tld));
        const hasDashes = hostname.includes('-');
        const homograph = isHomograph(hostname);

        if (homograph) {
            return {
                detected: true,
                fakeDomain: hostname,
                reason: 'النطاق يستخدم أحرفاً مشابهة بصرياً (Punycode/Homograph) لخداع المستخدم',
                severity: 'high',
            };
        }

        // Subdomain spoofing: brand's legit domain embedded as a subdomain label
        const spoofedBrand = findSubdomainSpoof(hostname, registrableDomain);
        if (spoofedBrand) {
            return {
                detected: true,
                brandName: spoofedBrand.name,
                brandNameArabic: spoofedBrand.arabicName,
                fakeDomain: hostname,
                legitimateDomains: spoofedBrand.legitimateDomains,
                reason: `يحاول الرابط إيهامك بأنه تابع لـ ${spoofedBrand.arabicName} عبر وضع نطاقها كنطاق فرعي مزيف`,
                severity: 'high',
            };
        }

        // Typosquatting: registrable domain is 1-2 edits away from a legit brand domain
        const typo = findTyposquat(registrableLabel);
        if (typo) {
            return {
                detected: true,
                brandName: typo.brand.name,
                brandNameArabic: typo.brand.arabicName,
                fakeDomain: hostname,
                legitimateDomains: typo.brand.legitimateDomains,
                reason: `النطاق يشبه بشدة نطاق ${typo.brand.arabicName} الرسمي (تلاعب بالأحرف - Typosquatting)`,
                severity: 'high',
            };
        }

        // Brand keyword present but not on a legitimate domain
        for (const brand of FAMOUS_BRANDS) {
            const containsBrandKeyword = brand.keywords.some(keyword =>
                hostname.includes(keyword) || fullUrl.includes(keyword)
            );
            if (!containsBrandKeyword) continue;

            const isLegitimate = brand.legitimateDomains.some(domain =>
                hostname === domain || hostname.endsWith(`.${domain}`)
            );
            if (isLegitimate) continue;

            let severity: 'low' | 'medium' | 'high' = 'medium';
            if ((hasSuspiciousKeyword && hasDashes) || (hasSuspiciousKeyword && hasSuspiciousTLD)) {
                severity = 'high';
            } else if (hasSuspiciousKeyword || hasDashes || hasSuspiciousTLD) {
                severity = 'medium';
            } else {
                severity = 'low';
            }

            let reason = 'يحتوي الرابط على اسم العلامة التجارية';
            if (hasDashes) reason += '، ويستخدم شرطات في النطاق';
            if (hasSuspiciousTLD) reason += '، ويستخدم امتداد نطاق مشبوه';
            if (hasSuspiciousKeyword) reason += '، ويحتوي على كلمات تصيد احتيالي';

            return {
                detected: true,
                brandName: brand.name,
                brandNameArabic: brand.arabicName,
                fakeDomain: hostname,
                legitimateDomains: brand.legitimateDomains,
                reason,
                severity,
            };
        }

        return { detected: false, severity: 'low' };
    } catch {
        return { detected: false, severity: 'low' };
    }
}

// Evidence-based heuristics for the aggregated scoring engine (utils/scoring.ts).
export function analyzeUrlHeuristics(url: string): EvidenceItem[] {
    const evidence: EvidenceItem[] = [];
    const urlObj = safeUrl(url);
    if (!urlObj) return evidence;

    const hostname = urlObj.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();
    const parsed = parse(hostname);
    const registrableDomain = parsed.domain;
    const registrableLabel = registrableDomain ? (registrableDomain.split('.')[0] ?? hostname) : hostname;

    if (isHomograph(hostname)) {
        evidence.push({
            id: 'homograph',
            source: 'heuristics',
            severity: 'critical',
            points: 40,
            params: { hostname },
        });
    }

    const spoofedBrand = findSubdomainSpoof(hostname, registrableDomain);
    if (spoofedBrand) {
        evidence.push({
            id: 'subdomainSpoof',
            source: 'heuristics',
            severity: 'high',
            points: 35,
            params: { brand: spoofedBrand.name },
        });
    }

    const typo = findTyposquat(registrableLabel);
    if (typo) {
        evidence.push({
            id: 'typosquat',
            source: 'heuristics',
            severity: 'high',
            points: 35,
            params: { brand: typo.brand.name, distance: typo.distance },
        });
    }

    if (!spoofedBrand && !typo) {
        for (const brand of FAMOUS_BRANDS) {
            const containsBrandKeyword = brand.keywords.some(keyword =>
                hostname.includes(keyword) || fullUrl.includes(keyword)
            );
            if (!containsBrandKeyword) continue;
            const isLegitimate = brand.legitimateDomains.some(domain =>
                hostname === domain || hostname.endsWith(`.${domain}`)
            );
            if (isLegitimate) continue;

            evidence.push({
                id: 'brandKeyword',
                source: 'heuristics',
                severity: 'medium',
                points: 25,
                params: { brand: brand.name },
            });
            break;
        }
    }

    if (SUSPICIOUS_TLDS.some(tld => hostname.endsWith(tld))) {
        evidence.push({ id: 'suspiciousTld', source: 'heuristics', severity: 'low', points: 10, params: { hostname } });
    }

    if (SUSPICIOUS_KEYWORDS.some(kw => fullUrl.includes(kw))) {
        evidence.push({ id: 'suspiciousKeyword', source: 'heuristics', severity: 'low', points: 10 });
    }

    return evidence;
}
