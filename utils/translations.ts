export type Language = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

export const translations = {
    ar: {
        // Meta
        appTitle: 'LinkGuard',
        appSubtitle: 'كاشف الروابط الخبيثة',
        appDescription: 'حماية متقدمة ضد الروابط المشبوهة والبرمجيات الخبيثة',
        
        // Home
        scanPlaceholder: 'ضع الرابط هنا لفحصه...',
        scanButton: 'افحص الآن',
        scanningButton: 'جاري الفحص...',
        scanInfo: 'نقوم بفحص أكثر من 70 قاعدة بيانات للحماية من البرمجيات الخبيثة والتصيد الاحتيالي',
        disclaimerTitle: '⚠️ إخلاء مسؤولية هام',
        disclaimerText: 'فحص الروابط لا يعني الموافقة على محتواها. الدخول إلى أي رابط يكون على مسؤوليتك الخاصة. النتائج تعتمد على قواعد بيانات خارجية وقد لا تكون دقيقة بنسبة 100%.',
        footerCopy: '© 2026 LinkGuard - كاشف الروابط | حماية متقدمة ضد التهديدات الإلكترونية',

        // Status
        statusIdle: '',
        statusUnshortening: 'جاري فك اختصار الرابط...',
        statusScanning: 'الاتصال بقواعد البيانات الأمنية...',
        statusAnalyzing: 'تحليل التهديدات المحتملة...',
        statusComplete: 'اكتمل الفحص',
        statusError: 'حدث خطأ',

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
        threatsDetected: 'تهديدات تم كشفها اليوم',
        shareWhatsApp: 'مشاركة النتيجة عبر واتساب',
        shareTextSafe: '✅ هذا الرابط آمن بنسبة {score}% وفقاً لفحص LinkGuard',
        shareTextDanger: '⛔️ تحذير! هذا الرابط خطير! تم الكشف عنه بواسطة LinkGuard',
    },
    en: {
        // Meta
        appTitle: 'LinkGuard',
        appSubtitle: 'Malicious Link Detector',
        appDescription: 'Advanced protection against suspicious links and malware',
        
        // Home
        scanPlaceholder: 'Paste link here to scan...',
        scanButton: 'Scan Now',
        scanningButton: 'Scanning...',
        scanInfo: 'We scan over 70 databases to protect against malware and phishing',
        disclaimerTitle: '⚠️ Important Disclaimer',
        disclaimerText: 'Scanning links does not imply approval of their content. Accessing any link is at your own risk. Results depend on external databases and may not be 100% accurate.',
        footerCopy: '© 2026 LinkGuard - Link Detector | Advanced protection against cyber threats',

        // Status
        statusIdle: '',
        statusUnshortening: 'Unshortening URL...',
        statusScanning: 'Connecting to security databases...',
        statusAnalyzing: 'Analyzing potential threats...',
        statusComplete: 'Scan Complete',
        statusError: 'An error occurred',

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
        threatsDetected: 'Threats Detected Today',
        shareWhatsApp: 'Share Result on WhatsApp',
        shareTextSafe: '✅ This link is {score}% Safe according to LinkGuard scan',
        shareTextDanger: '⛔️ Warning! This link is dangerous! Detected by LinkGuard',
    }
};
