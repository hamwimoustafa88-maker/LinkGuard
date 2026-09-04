export type Language = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

// `ar` is the source of truth for which keys exist; `en` (below) is typed
// against it, so a key present in one language but not the other is a
// build error instead of a key silently falling through to English/Arabic
// at runtime (see components/LanguageContext.tsx's t()).
const ar = {
        // Meta
        appTitle: 'LinkGuard',
        appSubtitle: 'كاشف الروابط الخبيثة',
        appDescription: 'حماية متقدمة ضد الروابط المشبوهة والبرمجيات الخبيثة',

        // Home
        scanPlaceholder: 'ضع الرابط هنا لفحصه...',
        pasteButton: 'لصق الرابط',
        scanButton: 'افحص الآن',
        scanningButton: 'جاري الفحص...',
        scanInfo: 'نقوم بفحص أكثر من 70 قاعدة بيانات للحماية من البرمجيات الخبيثة والتصيد الاحتيالي',
        disclaimerTitle: '⚠️ إخلاء مسؤولية هام',
        disclaimerText: 'فحص الروابط لا يعني الموافقة على محتواها. الدخول إلى أي رابط يكون على مسؤوليتك الخاصة. النتائج تعتمد على قواعد بيانات خارجية وقد لا تكون دقيقة بنسبة 100%.',
        footerCopy: '© 2026 LinkGuard - كاشف الروابط | حماية متقدمة ضد التهديدات الإلكترونية',
        privacyPolicy: 'سياسة الخصوصية',

        // Status
        statusUnshortening: 'جاري فك اختصار الرابط...',
        statusScanning: 'الاتصال بقواعد البيانات الأمنية...',
        statusAnalyzing: 'تحليل التهديدات المحتملة...',
        statusComplete: 'اكتمل الفحص',
        statusError: 'حدث خطأ',

        // API error codes (see types/api.ts's ErrorCode)
        errorMissingUrl: 'عنوان URL مطلوب',
        errorSsrfBlocked: 'تم حظر هذا الرابط لأنه يشير إلى عنوان شبكة داخلي غير آمن',
        errorRateLimited: 'عدد كبير من الطلبات، يرجى المحاولة لاحقاً',
        errorResolveFailed: 'تعذر تتبع التحويلات لهذا الرابط',
        errorInternal: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً',

        // Verdict
        verdictSafe: 'آمن',
        verdictSafeSub: 'لم يتم اكتشاف أي تهديدات',
        verdictWarning: 'تحذير',
        verdictWarningSub: 'تم اكتشاف تهديدات محتملة',
        verdictDanger: 'خطر',
        verdictDangerSub: 'رابط خطير - لا تقم بزيارته',
        verdictUnknown: 'غير معروف',
        verdictUnknownSub: 'لم يتم التحقق من الرابط',

        noRecords: '⚠️ لم يتم العثور على سجلات سابقة لهذا الرابط (0/0)',
        noRecordsSub: 'هذا لا يعني أنه آمن بالضرورة، بل قد يكون جديداً جداً.',
        fullUrl: 'الرابط الكامل:',
        openBrowserling: 'فتح في Browserling (بيئة آمنة)',

        securityGauge: 'نتائج الفحص الأمني',
        threatMeter: 'مزود أمني اكتشف تهديدات',

        statDangerous: 'خطير',
        statSuspicious: 'مشبوه',
        statSafe: 'آمن',
        statUndetected: 'غير مكتشف',

        threatIntel: 'استخبارات التهديدات',
        urlServerInfo: 'معلومات الرابط والخادم',
        pageTitle: 'عنوان الصفحة:',
        communityReputation: 'سمعة المجتمع:',
        country: 'الدولة',
        ipAddress: 'عنوان IP',
        server: 'الخادم',
        vtReport: 'تقرير VirusTotal',
        viewOriginalReport: 'عرض التقرير الأصلي',
        cleanMessage: 'نظيف: لم يبلغ أي محرك فحص عن مشاكل.',
        engineDetailUnavailable: 'رُصدت مؤشرات خطر، لكن تفاصيل محركات الفحص غير متاحة حالياً.',

        // Verification Steps
        stepUnshorten: 'فك الرابط المختصر',
        stepVirusScan: 'فحص الفيروسات',
        stepAnalyze: 'تحليل المحتوى',
        stepResult: 'النتيجة النهائية',

        // Phishing Alert
        phishingTitle: '⚠️ تحذير: انتحال هوية علامة تجارية',
        phishingSubtitle: 'هذا الموقع يحاول انتحال شخصية',
        originalBrand: 'العلامة الأصلية',
        fakeSite: 'الموقع المزيف',
        details: '📋 التفاصيل:',
        legitDomains: 'النطاقات الشرعية:',
        reason: 'السبب:',
        severity: 'مستوى الخطورة:',
        severityHigh: 'عالي',
        severityMedium: 'متوسط',
        severityLow: 'منخفض',
        phishingWarning: '🚨 لا تقم بإدخال أي معلومات شخصية أو بيانات حساسة في هذا الموقع!',

        // Education
        tipsTitle: 'نصائح الأمان السيبراني',
        tipsSubtitle: 'احمِ نفسك من التهديدات الإلكترونية',
        tip1Title: 'لا تثق بالمصادر المجهولة',
        tip1Desc: 'تجنب النقر على الروابط من مصادر غير موثوقة أو رسائل غريبة',
        tip2Title: 'افحص قبل أن تنقر',
        tip2Desc: 'استخدم أدوات الفحص للتحقق من سلامة الروابط قبل زيارتها',
        tip3Title: 'تحقق من HTTPS',
        tip3Desc: 'تأكد أن الموقع يستخدم بروتوكول HTTPS الآمن',
        tip4Title: 'احذر من التصيد الاحتيالي',
        tip4Desc: 'لا تدخل معلوماتك الشخصية على مواقع مشبوهة',

        aboutDev: 'عن المطور',
        checkServices: 'فحص الخدمات',

        // Developer Modal
        devName: 'مصطفى الحموي',
        devTitle: 'Software Developer | International Training Leader in Scouting',
        linkedin: 'LinkedIn Profile',

        // New Features
        poweredByAI: 'مدعوم بالذكاء الاصطناعي',
        shareWhatsApp: 'مشاركة النتيجة عبر واتساب',
        shareTextSafe: '✅ هذا الرابط آمن بنسبة {score}% وفقاً لفحص LinkGuard',
        shareTextDanger: '⛔️ تحذير! هذا الرابط خطير! تم الكشف عنه بواسطة LinkGuard',
        copyUrl: 'نسخ الرابط',
        copiedUrl: 'تم النسخ!',
        goToUrl: 'الذهاب إلى الرابط',
        exportReport: 'تصدير التقرير',
        vendorsFlagged: '{threats} حركات أمنية من أصل {total} اكتشفت تهديداً في هذا الرابط.',
        scanDateTime: 'تاريخ ووقت الفحص',
        newScan: 'فحص جديد',

        // Evidence / risk score
        whyVerdict: 'لماذا هذا الحكم؟',
        riskScoreLabel: 'درجة الخطورة',
        confidenceLabel: 'مستوى الثقة',
        confidenceHigh: 'عالٍ',
        confidenceMedium: 'متوسط',
        confidenceLow: 'منخفض',
        sourcesTitle: 'المصادر المستخدمة',
        sourceOk: 'تم الفحص',
        sourceNoKey: 'مفتاح غير مضبوط',
        sourceError: 'تعذر الفحص',

        // Redirects
        redirectChainTitle: 'سلسلة التحويلات',
        redirectHops: '{count} قفزة',

        // Domain / SSL info
        domainInfoTitle: 'معلومات النطاق والشهادة',
        domainAgeLabel: 'عمر النطاق',
        domainAgeDays: '{days} يوماً',
        registrarLabel: 'جهة التسجيل',
        sslIssuer: 'جهة إصدار شهادة SSL',
        sslValidUntil: 'صالحة حتى',
        sslInvalid: 'شهادة SSL غير صالحة أو منتهية',

        // History
        historyTitle: 'سجل الفحوصات السابقة',
        historyEmpty: 'لا يوجد فحوصات سابقة بعد',
        historyClear: 'مسح السجل',
        historyRescan: 'إعادة الفحص',

        // Evidence items (used with utils/scoring.ts EvidenceItem.id)
        evidence_vtDetections: 'رصد {malicious} محرك كخطير و{suspicious} كمشبوه من أصل {total} محرك فحص',
        evidence_gsbMatch: 'مدرج في قائمة Google Safe Browsing كـ {threat}',
        evidence_urlhausListed: 'مدرج في قاعدة URLhaus كرابط برمجية خبيثة ({threat})',
        evidence_phishtankListed: 'مدرج في قاعدة PhishTank كرابط تصيد احتيالي معروف',
        evidence_ipReputation: 'عنوان IP الخاص بالخادم له سجل إساءة استخدام (نسبة إساءة {score}%)',
        evidence_homograph: 'النطاق {hostname} يستخدم أحرفاً مشابهة بصرياً (Punycode/Homograph) لخداع المستخدم',
        evidence_subdomainSpoof: 'يحاول الرابط انتحال {brand} عبر وضع نطاقها كنطاق فرعي مزيف',
        evidence_typosquat: 'النطاق يشبه بشدة نطاق {brand} الرسمي بفارق أحرف بسيط (Typosquatting)',
        evidence_brandKeyword: 'يحتوي الرابط على اسم {brand} على نطاق غير رسمي',
        evidence_suspiciousTld: 'يستخدم امتداد نطاق مشبوه ({hostname})',
        evidence_suspiciousKeyword: 'يحتوي على كلمات شائعة في محاولات التصيد الاحتيالي',
        evidence_youngDomain: 'النطاق مسجل حديثاً (منذ {days} يوماً فقط)',
        evidence_veryYoungDomain: 'النطاق مسجل حديثاً جداً (منذ {days} يوماً فقط) — علامة خطر شائعة في الروابط الخبيثة',
        evidence_sslInvalid: 'شهادة SSL الخاصة بالموقع غير صالحة أو منتهية أو ذاتية التوقيع',
        evidence_noHttps: 'الرابط لا يستخدم بروتوكول HTTPS الآمن',
        evidence_longRedirectChain: 'سلسلة تحويلات طويلة وغير معتادة ({hops} قفزات)',

        // PWA install prompt
        installTitle: 'ثبّت LinkGuard',
        installDesc: 'افحص الروابط بأي وقت مباشرة من هاتفك، حتى بدون فتح المتصفح',
        installButton: 'تثبيت',
        installLater: 'لاحقاً',
        installIosStep1: 'اضغط زر المشاركة',
        installIosStep2: 'ثم اختر "إضافة إلى الشاشة الرئيسية"',

        // Offline overlay (Android app only - components/OfflineOverlay.tsx)
        offlineTitle: 'لا يوجد اتصال بالإنترنت',
        offlineDesc: 'يحتاج LinkGuard إلى اتصال بالإنترنت للفحص. تحقق من الشبكة وحاول مجدداً.',
        offlineRetry: 'إعادة المحاولة',
} as const;

export type TranslationKey = keyof typeof ar;

const en: Record<TranslationKey, string> = {
        // Meta
        appTitle: 'LinkGuard',
        appSubtitle: 'Malicious Link Detector',
        appDescription: 'Advanced protection against suspicious links and malware',

        // Home
        scanPlaceholder: 'Paste link here to scan...',
        pasteButton: 'Paste link',
        scanButton: 'Scan Now',
        scanningButton: 'Scanning...',
        scanInfo: 'We scan over 70 databases to protect against malware and phishing',
        disclaimerTitle: '⚠️ Important Disclaimer',
        disclaimerText: 'Scanning links does not imply approval of their content. Accessing any link is at your own risk. Results depend on external databases and may not be 100% accurate.',
        footerCopy: '© 2026 LinkGuard - Link Detector | Advanced protection against cyber threats',
        privacyPolicy: 'Privacy Policy',

        // Status
        statusUnshortening: 'Unshortening URL...',
        statusScanning: 'Connecting to security databases...',
        statusAnalyzing: 'Analyzing potential threats...',
        statusComplete: 'Scan Complete',
        statusError: 'An error occurred',

        // API error codes (see types/api.ts's ErrorCode)
        errorMissingUrl: 'A URL is required',
        errorSsrfBlocked: 'This link was blocked because it points to an unsafe internal network address',
        errorRateLimited: 'Too many requests, please try again later',
        errorResolveFailed: 'Could not follow the redirects for this link',
        errorInternal: 'An unexpected error occurred, please try again later',

        // Verdict
        verdictSafe: 'Safe',
        verdictSafeSub: 'No threats detected',
        verdictWarning: 'Warning',
        verdictWarningSub: 'Potential threats detected',
        verdictDanger: 'Danger',
        verdictDangerSub: 'Dangerous link - do not visit',
        verdictUnknown: 'Unknown',
        verdictUnknownSub: 'Link not verified',

        noRecords: '⚠️ No previous records found for this link (0/0)',
        noRecordsSub: 'This does not necessarily mean it is safe; it could be very new.',
        fullUrl: 'Full URL:',
        openBrowserling: 'Open in Browserling (Safe Env)',

        securityGauge: 'Security Scan Results',
        threatMeter: 'Security vendors flagged this',

        statDangerous: 'Dangerous',
        statSuspicious: 'Suspicious',
        statSafe: 'Safe',
        statUndetected: 'Undetected',

        threatIntel: 'Threat Intelligence',
        urlServerInfo: 'URL & Server Info',
        pageTitle: 'Page Title:',
        communityReputation: 'Community Reputation:',
        country: 'Country',
        ipAddress: 'IP Address',
        server: 'Server',
        vtReport: 'VirusTotal Report',
        viewOriginalReport: 'View Original Report',
        cleanMessage: 'Clean: No scanning engine reported issues.',
        engineDetailUnavailable: 'Risk indicators were detected, but per-engine detail is unavailable right now.',

        // Verification Steps
        stepUnshorten: 'Unshorten URL',
        stepVirusScan: 'Virus Scan',
        stepAnalyze: 'Content Analysis',
        stepResult: 'Final Verdict',

        // Phishing Alert
        phishingTitle: '⚠️ Warning: Brand Impersonation',
        phishingSubtitle: 'This site is attempting to impersonate',
        originalBrand: 'Original Brand',
        fakeSite: 'Fake Site',
        details: '📋 Details:',
        legitDomains: 'Legitimate Domains:',
        reason: 'Reason:',
        severity: 'Severity:',
        severityHigh: 'High',
        severityMedium: 'Medium',
        severityLow: 'Low',
        phishingWarning: '🚨 Do not enter any personal information or sensitive data on this site!',

        // Education
        tipsTitle: 'Cybersecurity Tips',
        tipsSubtitle: 'Protect yourself from cyber threats',
        tip1Title: 'Don\'t trust unknown sources',
        tip1Desc: 'Avoid clicking links from untrusted sources or strange messages',
        tip2Title: 'Scan before you click',
        tip2Desc: 'Use scanning tools to verify link safety before visiting',
        tip3Title: 'Check for HTTPS',
        tip3Desc: 'Ensure the site uses the secure HTTPS protocol',
        tip4Title: 'Beware of Phishing',
        tip4Desc: 'Do not enter personal information on suspicious sites',

        aboutDev: 'About Developer',
        checkServices: 'Check Services',

        // Developer Modal
        devName: 'Moustafa Hamwi',
        devTitle: 'Software Developer | International Training Leader in Scouting',
        linkedin: 'LinkedIn Profile',

        // New Features
        poweredByAI: 'Powered by AI',
        shareWhatsApp: 'Share Result on WhatsApp',
        shareTextSafe: '✅ This link is {score}% Safe according to LinkGuard scan',
        shareTextDanger: '⛔️ Warning! This link is dangerous! Detected by LinkGuard',
        copyUrl: 'Copy URL',
        copiedUrl: 'Copied!',
        goToUrl: 'Visit Website',
        exportReport: 'Export Report',
        vendorsFlagged: '{threats} out of {total} security vendors flagged this URL as malicious.',
        scanDateTime: 'Scan Date & Time',
        newScan: 'New Scan',

        // Evidence / risk score
        whyVerdict: 'Why this verdict?',
        riskScoreLabel: 'Risk Score',
        confidenceLabel: 'Confidence',
        confidenceHigh: 'High',
        confidenceMedium: 'Medium',
        confidenceLow: 'Low',
        sourcesTitle: 'Sources Consulted',
        sourceOk: 'Checked',
        sourceNoKey: 'No API key configured',
        sourceError: 'Check failed',

        // Redirects
        redirectChainTitle: 'Redirect Chain',
        redirectHops: '{count} hops',

        // Domain / SSL info
        domainInfoTitle: 'Domain & Certificate Info',
        domainAgeLabel: 'Domain Age',
        domainAgeDays: '{days} days',
        registrarLabel: 'Registrar',
        sslIssuer: 'SSL Certificate Issuer',
        sslValidUntil: 'Valid Until',
        sslInvalid: 'SSL certificate is invalid or expired',

        // History
        historyTitle: 'Scan History',
        historyEmpty: 'No previous scans yet',
        historyClear: 'Clear History',
        historyRescan: 'Rescan',

        // Evidence items (used with utils/scoring.ts EvidenceItem.id)
        evidence_vtDetections: '{malicious} engines flagged this as malicious and {suspicious} as suspicious, out of {total} scanning engines',
        evidence_gsbMatch: 'Listed on Google Safe Browsing as {threat}',
        evidence_urlhausListed: 'Listed in the URLhaus malware database ({threat})',
        evidence_phishtankListed: 'Listed in the PhishTank database as a known phishing link',
        evidence_ipReputation: 'The server IP has an abuse history (abuse confidence {score}%)',
        evidence_homograph: 'The domain {hostname} uses visually similar characters (Punycode/Homograph) to deceive users',
        evidence_subdomainSpoof: 'This link attempts to impersonate {brand} by placing its domain as a fake subdomain',
        evidence_typosquat: 'This domain closely resembles the official {brand} domain with a minor character change (Typosquatting)',
        evidence_brandKeyword: 'The link contains the name {brand} on an unofficial domain',
        evidence_suspiciousTld: 'Uses a suspicious domain extension ({hostname})',
        evidence_suspiciousKeyword: 'Contains words commonly used in phishing attempts',
        evidence_youngDomain: 'The domain was registered recently (only {days} days ago)',
        evidence_veryYoungDomain: 'The domain was registered very recently (only {days} days ago) — a common red flag for malicious links',
        evidence_sslInvalid: 'The site\'s SSL certificate is invalid, expired, or self-signed',
        evidence_noHttps: 'The link does not use secure HTTPS',
        evidence_longRedirectChain: 'Unusually long redirect chain ({hops} hops)',

        // PWA install prompt
        installTitle: 'Install LinkGuard',
        installDesc: 'Scan links anytime straight from your phone, without opening a browser',
        installButton: 'Install',
        installLater: 'Later',
        installIosStep1: 'Tap the Share button',
        installIosStep2: 'Then choose "Add to Home Screen"',

        // Offline overlay (Android app only - components/OfflineOverlay.tsx)
        offlineTitle: 'No Internet Connection',
        offlineDesc: 'LinkGuard needs an internet connection to scan links. Check your network and try again.',
        offlineRetry: 'Retry',
};

export const translations: Record<Language, Record<TranslationKey, string>> = { ar, en };
