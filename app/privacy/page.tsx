import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Shield } from 'lucide-react';

export const metadata: Metadata = {
    title: 'سياسة الخصوصية - LinkGuard',
    description: 'سياسة الخصوصية الخاصة بتطبيق LinkGuard - كاشف الروابط الخبيثة',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mb-8">
            <h2 className="text-xl font-bold text-cyber-safe mb-3">{title}</h2>
            <div className="text-gray-300 leading-relaxed space-y-2">{children}</div>
        </section>
    );
}

export default function PrivacyPage() {
    return (
        <main className="min-h-screen relative overflow-hidden bg-cyber-dark text-white p-8">
            <div className="fixed inset-0 bg-linear-to-br from-cyber-dark via-cyber-navy to-cyber-dark -z-10" />
            <div className="fixed inset-0 bg-radial-[at_top] from-cyan-900/20 via-transparent to-transparent -z-10" />

            <div className="max-w-3xl mx-auto">
                <header className="flex items-center justify-between mb-12" dir="rtl">
                    <Link href="/" className="flex items-center gap-2 text-cyber-safe hover:text-cyber-glow transition-colors">
                        <ArrowRight className="w-5 h-5" />
                        <span>العودة للرئيسية</span>
                    </Link>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-cyber-safe flex items-center gap-2 justify-center">
                            <Shield className="w-6 h-6" /> سياسة الخصوصية
                        </h1>
                    </div>
                    <div className="w-24" />
                </header>

                {/* ==================== Arabic ==================== */}
                <div dir="rtl" className="mb-16">
                    <p className="text-gray-400 text-sm mb-8">آخر تحديث: 4 سبتمبر 2026</p>

                    <Section title="ما هو LinkGuard؟">
                        <p>
                            LinkGuard أداة مجانية لفحص الروابط قبل زيارتها، للكشف عن البرمجيات
                            الخبيثة ومحاولات التصيد الاحتيالي. لا يتطلب إنشاء حساب، ولا يجمع أي
                            بيانات شخصية عن هويتك.
                        </p>
                    </Section>

                    <Section title="ما الذي نرسله لأطراف ثالثة، ولماذا">
                        <p>
                            عندما تفحص رابطاً، يُرسَل ذلك الرابط فقط (وليس أي معلومة عنك: لا اسمك،
                            لا بريدك، لا موقعك) إلى خدمات أمنية خارجية متخصصة لتقييم سلامته:
                        </p>
                        <ul className="list-disc pr-6 space-y-1">
                            <li><strong>VirusTotal</strong> - فحص الرابط عبر أكثر من 70 محرك حماية</li>
                            <li><strong>Google Safe Browsing</strong> - التحقق من قوائم Google للروابط الخطرة</li>
                            <li><strong>urlscan.io</strong> - أخذ لقطة شاشة ومعاينة تقنية للموقع</li>
                            <li><strong>URLhaus</strong> و<strong>PhishTank</strong> (abuse.ch) - قواعد بيانات روابط البرمجيات الخبيثة والتصيد</li>
                            <li><strong>AbuseIPDB</strong> - سمعة عنوان IP الخاص بالخادم المستضيف للموقع</li>
                            <li><strong>RDAP (rdap.org)</strong> - عمر تسجيل النطاق</li>
                            <li><strong>unshorten.me</strong> - احتياطي فقط، في حال تعذّر حل الرابط المختصر مباشرة</li>
                        </ul>
                        <p className="mt-3 font-bold text-cyber-warning">
                            ⚠️ تنويه مهم: نتائج urlscan.io تُنشَر بوضعية عامة (public) - أي رابط
                            تفحصه يصبح قابلاً للبحث والعرض من أي شخص على urlscan.io. لا تفحص
                            روابط خاصة أو حساسة (مثل روابط إعادة تعيين كلمة مرور شخصية) عبر
                            LinkGuard.
                        </p>
                    </Section>

                    <Section title="ما نخزّنه على جهازك فقط">
                        <p>
                            سجل الفحوصات السابقة ولغة الواجهة المفضّلة لديك يُخزَّنان محلياً على
                            جهازك فقط (Local Storage في المتصفح، أو داخل تطبيق الأندرويد) - لا
                            يصلان لأي خادم، ويمكنك مسحهما في أي وقت من داخل التطبيق.
                        </p>
                    </Section>

                    <Section title="أذونات تطبيق الأندرويد">
                        <ul className="list-disc pr-6 space-y-1">
                            <li><strong>الكاميرا</strong> - لمسح رموز QR فقط لاستخراج الرابط منها قبل فحصه؛ لا نلتقط أو نخزّن أي صور</li>
                            <li><strong>الإنترنت / حالة الشبكة</strong> - للتواصل مع خدمات الفحص وعرض حالة الاتصال</li>
                        </ul>
                        <p>لا يطلب التطبيق أي إذن للموقع الجغرافي، جهات الاتصال، أو التخزين.</p>
                    </Section>

                    <Section title="لا إعلانات ولا تتبّع">
                        <p>
                            LinkGuard لا يعرض إعلانات، ولا يستخدم أدوات تحليل سلوك المستخدم
                            (analytics/tracking)، ولا يبيع أو يشارك أي بيانات لأغراض تسويقية.
                        </p>
                    </Section>

                    <Section title="التواصل">
                        <p>
                            لأي استفسار حول هذه السياسة، يمكنك التواصل عبر{' '}
                            <a href="https://github.com/hamwimoustafa88-maker/LinkGuard/issues" target="_blank" rel="noopener noreferrer" className="text-cyber-safe hover:text-cyber-glow underline">
                                صفحة المشروع على GitHub
                            </a>{' '}
                            أو{' '}
                            <a href="https://www.linkedin.com/in/moustafa-hamwi/" target="_blank" rel="noopener noreferrer" className="text-cyber-safe hover:text-cyber-glow underline">
                                LinkedIn
                            </a>.
                        </p>
                    </Section>

                    <Section title="تعديلات على هذه السياسة">
                        <p>قد تُحدَّث هذه الصفحة مستقبلاً؛ سيُذكر تاريخ آخر تحديث دائماً أعلى الصفحة.</p>
                    </Section>
                </div>

                {/* ==================== English ==================== */}
                <div dir="ltr" className="border-t border-gray-700 pt-10">
                    <p className="text-gray-400 text-sm mb-8">Last updated: September 4, 2026</p>

                    <Section title="What is LinkGuard?">
                        <p>
                            LinkGuard is a free tool for scanning links before you visit them, to
                            detect malware and phishing attempts. No account is required, and it
                            does not collect any personal information about your identity.
                        </p>
                    </Section>

                    <Section title="What we send to third parties, and why">
                        <p>
                            When you scan a link, only that link (never anything about you - not
                            your name, email, or location) is sent to specialized third-party
                            security services to assess its safety:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>VirusTotal</strong> - scans the link across 70+ security engines</li>
                            <li><strong>Google Safe Browsing</strong> - checks Google&apos;s lists of dangerous links</li>
                            <li><strong>urlscan.io</strong> - takes a screenshot and technical preview of the site</li>
                            <li><strong>URLhaus</strong> and <strong>PhishTank</strong> (abuse.ch) - malware/phishing link databases</li>
                            <li><strong>AbuseIPDB</strong> - abuse reputation of the site&apos;s hosting IP address</li>
                            <li><strong>RDAP (rdap.org)</strong> - domain registration age</li>
                            <li><strong>unshorten.me</strong> - fallback only, when a shortened link can&apos;t be resolved directly</li>
                        </ul>
                        <p className="mt-3 font-bold text-cyber-warning">
                            ⚠️ Important: urlscan.io results are published with <strong>public</strong>{' '}
                            visibility - any link you scan becomes searchable and viewable by
                            anyone on urlscan.io. Do not scan private or sensitive links (e.g. a
                            personal password-reset link) through LinkGuard.
                        </p>
                    </Section>

                    <Section title="What stays on your device only">
                        <p>
                            Your scan history and preferred UI language are stored locally on your
                            device only (browser Local Storage, or inside the Android app) - never
                            on any server - and you can clear them anytime from within the app.
                        </p>
                    </Section>

                    <Section title="Android app permissions">
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Camera</strong> - only to scan QR codes and extract the link before scanning it; no photos are captured or stored</li>
                            <li><strong>Internet / network state</strong> - to reach the scanning services and show connectivity status</li>
                        </ul>
                        <p>The app requests no location, contacts, or storage permission.</p>
                    </Section>

                    <Section title="No ads, no tracking">
                        <p>
                            LinkGuard shows no ads, uses no user-behavior analytics/tracking tools,
                            and never sells or shares data for marketing purposes.
                        </p>
                    </Section>

                    <Section title="Contact">
                        <p>
                            For any question about this policy, reach out via the{' '}
                            <a href="https://github.com/hamwimoustafa88-maker/LinkGuard/issues" target="_blank" rel="noopener noreferrer" className="text-cyber-safe hover:text-cyber-glow underline">
                                project&apos;s GitHub page
                            </a>{' '}
                            or{' '}
                            <a href="https://www.linkedin.com/in/moustafa-hamwi/" target="_blank" rel="noopener noreferrer" className="text-cyber-safe hover:text-cyber-glow underline">
                                LinkedIn
                            </a>.
                        </p>
                    </Section>

                    <Section title="Changes to this policy">
                        <p>This page may be updated in the future; the last-updated date above will always reflect that.</p>
                    </Section>
                </div>
            </div>
        </main>
    );
}
