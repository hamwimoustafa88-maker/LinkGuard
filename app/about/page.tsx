import type { Metadata } from 'next';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { StaticPageShell, Section, LINK_CLASS } from '@/components/StaticPageShell';
import { PLATFORM_URL, REPO_URL, AUTHOR_NAME, AUTHOR_URL } from '@/lib/siteLinks';

export const metadata: Metadata = {
    title: 'من نحن - LinkGuard',
    description: 'تعرّف على LinkGuard: أداة مجانية ومفتوحة المصدر من منصة ScoutHub لفحص الروابط من البرمجيات الخبيثة والتصيد الاحتيالي قبل فتحها.',
    alternates: { canonical: '/about' },
};

export default function AboutPage() {
    return (
        <StaticPageShell title="من نحن" icon={Info}>
            {/* ==================== Arabic ==================== */}
            <div dir="rtl" className="mb-16">
                <Section title="ما هو LinkGuard؟">
                    <p>
                        LinkGuard أداة مجانية ومفتوحة المصدر لفحص الروابط قبل زيارتها. تصلنا جميعاً
                        يومياً روابط عبر واتساب والبريد الإلكتروني ووسائل التواصل، وبعضها يقود إلى
                        صفحات تصيد تسرق كلمات المرور أو إلى ملفات خبيثة. هدف LinkGuard بسيط: أن تعرف
                        خلال ثوانٍ إن كان الرابط آمناً، قبل أن تضغط عليه.
                    </p>
                </Section>

                <Section title="كيف نفحص الرابط؟">
                    <ul className="list-disc pr-6 space-y-1">
                        <li>نفك اختصار الروابط المختصرة ونتتبع سلسلة التحويلات كاملة حتى الوجهة النهائية.</li>
                        <li>نستعلم عن الرابط لدى VirusTotal (أكثر من 70 محرك حماية) وGoogle Safe Browsing وurlscan.io.</li>
                        <li>نقارنه بقواعد بيانات الروابط الخبيثة والتصيد URLhaus وPhishTank، وبسمعة عنوان الخادم لدى AbuseIPDB.</li>
                        <li>نتحقق من عمر النطاق ومن محاولات انتحال أسماء العلامات التجارية المعروفة.</li>
                        <li>نجمع كل ذلك في درجة خطورة واحدة مع الأدلة التي بُنيت عليها، بلغة مفهومة.</li>
                    </ul>
                </Section>

                <Section title="خصوصيتك أولاً">
                    <p>
                        لا نطلب حساباً ولا نجمع بيانات شخصية؛ نرسل الرابط وحده إلى خدمات الفحص،
                        ويبقى سجل فحوصاتك على جهازك. التفاصيل الكاملة في{' '}
                        <Link href="/privacy" className={LINK_CLASS}>سياسة الخصوصية</Link>.
                    </p>
                </Section>

                <Section title="من يقف خلف LinkGuard؟">
                    <p>
                        LinkGuard إحدى مبادرات منصة{' '}
                        <a href={PLATFORM_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>ScoutHub</a>،
                        طوّره{' '}
                        <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>مصطفى الحموي</a>،
                        وشيفرته المصدرية متاحة للجميع على{' '}
                        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>GitHub</a>{' '}
                        بترخيص MIT، ونرحب بالمساهمات والإبلاغ عن الثغرات.
                    </p>
                </Section>

                <Section title="المنصات المتاحة">
                    <p>
                        يعمل LinkGuard من المتصفح مباشرة، ويمكن تثبيته على الشاشة الرئيسية كتطبيق ويب،
                        كما يتوفر تطبيق أندرويد يتيح مشاركة أي رابط إليه لفحصه فوراً ومسح رموز QR بالكاميرا.
                    </p>
                </Section>
            </div>

            {/* ==================== English ==================== */}
            <div dir="ltr" className="border-t border-gray-700 pt-10">
                <Section title="What is LinkGuard?">
                    <p>
                        LinkGuard is a free, open-source tool for checking links before you visit them.
                        We all receive links every day over WhatsApp, email and social media, and some of
                        them lead to phishing pages that steal passwords or to malicious downloads.
                        LinkGuard&apos;s goal is simple: tell you within seconds whether a link is safe,
                        before you click it.
                    </p>
                </Section>

                <Section title="How do we scan a link?">
                    <ul className="list-disc pl-6 space-y-1">
                        <li>We unshorten short links and follow the full redirect chain to the final destination.</li>
                        <li>We query VirusTotal (70+ security engines), Google Safe Browsing and urlscan.io.</li>
                        <li>We check the URLhaus and PhishTank malware/phishing databases, and the hosting server&apos;s reputation on AbuseIPDB.</li>
                        <li>We check the domain&apos;s age and look for impersonation of well-known brands.</li>
                        <li>We combine everything into one risk score, with the evidence behind it, in plain language.</li>
                    </ul>
                </Section>

                <Section title="Privacy first">
                    <p>
                        No account and no personal data: only the link itself is sent to the scanning
                        services, and your scan history stays on your device. See the full{' '}
                        <Link href="/privacy" className={LINK_CLASS}>privacy policy</Link>.
                    </p>
                </Section>

                <Section title="Who is behind LinkGuard?">
                    <p>
                        LinkGuard is an initiative of the{' '}
                        <a href={PLATFORM_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>ScoutHub</a>{' '}
                        platform, built by{' '}
                        <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>{AUTHOR_NAME}</a>.
                        Its source code is public on{' '}
                        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>GitHub</a>{' '}
                        under the MIT licence - contributions and vulnerability reports are welcome.
                    </p>
                </Section>

                <Section title="Where can I use it?">
                    <p>
                        LinkGuard runs straight from the browser and can be installed to your home screen
                        as a web app. An Android app is also available, so you can share any link to it for
                        an instant scan, or scan QR codes with the camera.
                    </p>
                </Section>
            </div>
        </StaticPageShell>
    );
}
