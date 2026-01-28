// Brand matcher utility for detecting phishing attempts
// Detects when URLs impersonate famous brands

interface BrandInfo {
    name: string;
    keywords: string[];
    legitimateDomains: string[];
    arabicName: string;
}

const FAMOUS_BRANDS: BrandInfo[] = [
    {
        name: 'Facebook',
        keywords: ['facebook', 'face-book', 'face book', 'fb', 'meta'],
        legitimateDomains: ['facebook.com', 'fb.com', 'meta.com'],
        arabicName: 'فيسبوك',
    },
    {
        name: 'Google',
        keywords: ['google', 'gmail'],
        legitimateDomains: ['google.com', 'gmail.com', 'goo.gl'],
        arabicName: 'جوجل',
    },
    {
        name: 'PayPal',
        keywords: ['paypal', 'pay-pal'],
        legitimateDomains: ['paypal.com'],
        arabicName: 'باي بال',
    },
    {
        name: 'Amazon',
        keywords: ['amazon', 'amzn'],
        legitimateDomains: ['amazon.com', 'amazon.co.uk', 'amzn.to'],
        arabicName: 'أمازون',
    },
    {
        name: 'Microsoft',
        keywords: ['microsoft', 'msft', 'outlook', 'hotmail'],
        legitimateDomains: ['microsoft.com', 'outlook.com', 'hotmail.com', 'live.com'],
        arabicName: 'مايكروسوفت',
    },
    {
        name: 'Apple',
        keywords: ['apple', 'icloud', 'itunes'],
        legitimateDomains: ['apple.com', 'icloud.com', 'itunes.com'],
        arabicName: 'أبل',
    },
    {
        name: 'Instagram',
        keywords: ['instagram', 'insta'],
        legitimateDomains: ['instagram.com'],
        arabicName: 'إنستغرام',
    },
    {
        name: 'WhatsApp',
        keywords: ['whatsapp', 'whats-app'],
        legitimateDomains: ['whatsapp.com', 'wa.me'],
        arabicName: 'واتساب',
    },
];

const SUSPICIOUS_KEYWORDS = [
    'login', 'signin', 'secure', 'update', 'verify', 'account',
    'confirm', 'suspended', 'locked', 'urgent', 'billing'
];

const SUSPICIOUS_TLDS = [
    '.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq',
    '.pw', '.cc', '.ws', '.info', '.biz'
];

export interface PhishingAlert {
    detected: boolean;
    brandName?: string;
    brandNameArabic?: string;
    fakeDomain?: string;
    legitimateDomains?: string[];
    reason?: string;
    severity: 'low' | 'medium' | 'high';
}

export function analyzeBrandMismatch(url: string): PhishingAlert {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        const hostname = urlObj.hostname.toLowerCase();
        const fullUrl = url.toLowerCase();

        // Check each famous brand
        for (const brand of FAMOUS_BRANDS) {
            // Check if URL contains brand keywords
            const containsBrandKeyword = brand.keywords.some(keyword =>
                hostname.includes(keyword) || fullUrl.includes(keyword)
            );

            if (!containsBrandKeyword) continue;

            // Check if it's a legitimate domain
            const isLegitimate = brand.legitimateDomains.some(domain =>
                hostname === domain || hostname.endsWith(`.${domain}`)
            );

            if (isLegitimate) continue;

            // Brand keyword found but domain is not legitimate - potential phishing

            // Calculate severity
            let severity: 'low' | 'medium' | 'high' = 'medium';

            // High severity if contains suspicious keywords
            const hasSuspiciousKeyword = SUSPICIOUS_KEYWORDS.some(kw => fullUrl.includes(kw));

            // High severity if uses suspicious TLD
            const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(tld => hostname.endsWith(tld));

            // High severity if domain contains dashes (common phishing technique)
            const hasDashes = hostname.includes('-');

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

        // No brand impersonation detected
        return {
            detected: false,
            severity: 'low',
        };
    } catch (error) {
        // Invalid URL
        return {
            detected: false,
            severity: 'low',
        };
    }
}

// Test cases
export function testBrandMatcher() {
    const testCases = [
        'face-book-login.xyz',
        'facebook-verify.net',
        'paypal-secure.tk',
        'www.facebook.com',
        'www.google.com',
        'google-update-secure.xyz',
    ];

    console.log('🧪 Testing Brand Matcher:');
    testCases.forEach(url => {
        const result = analyzeBrandMismatch(url);
        console.log(`\n${url}:`);
        console.log(`  Detected: ${result.detected}`);
        if (result.detected) {
            console.log(`  Brand: ${result.brandName}`);
            console.log(`  Severity: ${result.severity}`);
            console.log(`  Reason: ${result.reason}`);
        }
    });
}
