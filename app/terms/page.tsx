import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { StaticPageShell, Section, LINK_CLASS } from '@/components/StaticPageShell';
import { REPO_URL } from '@/lib/siteLinks';

export const metadata: Metadata = {
    title: 'شروط الاستخدام - LinkGuard',
    description: 'شروط استخدام LinkGuard - كاشف الروابط الخبيثة والتصيد الاحتيالي.',
    alternates: { canonical: '/terms' },
};

export default function TermsPage() {
    return (
        <StaticPageShell title="شروط الاستخدام" icon={FileText}>
            {/* ==================== Arabic ==================== */}
            <div dir="rtl" className="mb-16">
                <p className="text-gray-400 text-sm mb-8">آخر تحديث: 11 نوفمبر 2026</p>

                <Section title="قبول الشروط">
                    <p>باستخدامك LinkGuard (الموقع أو تطبيق الأندرويد) فإنك توافق على هذه الشروط. إن لم توافق عليها، يُرجى عدم استخدام الخدمة.</p>
                </Section>

                <Section title="طبيعة الخدمة">
                    <p>
                        LinkGuard خدمة مجانية تقدّم تقييماً آلياً لسلامة الروابط اعتماداً على خدمات أمنية خارجية.
                        النتائج إرشادية فقط و&quot;كما هي&quot; دون أي ضمان صريح أو ضمني بدقتها أو اكتمالها، فقد يُصنَّف
                        رابط خطير على أنه آمن أو العكس.
                    </p>
                </Section>

                <Section title="الاستخدام المقبول">
                    <ul className="list-disc pr-6 space-y-1">
                        <li>استخدم الخدمة لفحص الروابط التي تصلك أو التي تملك سبباً مشروعاً لفحصها.</li>
                        <li>لا تستخدمها لإرسال طلبات آلية بكميات كبيرة أو لتجاوز حدود الاستخدام أو لإرهاق الخدمة.</li>
                        <li>لا تفحص روابط خاصة أو حساسة (مثل روابط إعادة تعيين كلمة المرور)، لأن نتائج urlscan.io عامة.</li>
                    </ul>
                </Section>

                <Section title="حدود المسؤولية">
                    <p>
                        قرار فتح أي رابط يعود إليك وحدك. لا يتحمّل LinkGuard ولا القائمون عليه أي مسؤولية عن أضرار
                        ناتجة عن زيارة رابط أو الاعتماد على نتيجة فحص.
                    </p>
                </Section>

                <Section title="خدمات الأطراف الثالثة والخصوصية">
                    <p>
                        يعتمد الفحص على خدمات خارجية تخضع لشروطها وسياساتها الخاصة. تعرّف على ما نرسله ولماذا في{' '}
                        <Link href="/privacy" className={LINK_CLASS}>سياسة الخصوصية</Link>.
                    </p>
                </Section>

                <Section title="الشيفرة المصدرية">
                    <p>
                        شيفرة LinkGuard المصدرية منشورة على{' '}
                        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>GitHub</a>{' '}
                        بترخيص MIT، ويحكم ذلك الترخيص استخدامك للشيفرة نفسها.
                    </p>
                </Section>

                <Section title="تعديل الشروط">
                    <p>قد نحدّث هذه الشروط من وقت لآخر، وسيُذكر تاريخ آخر تحديث دائماً أعلى الصفحة.</p>
                </Section>
            </div>

            {/* ==================== English ==================== */}
            <div dir="ltr" className="border-t border-gray-700 pt-10">
                <p className="text-gray-400 text-sm mb-8">Last updated: November 11, 2026</p>

                <Section title="Acceptance of these terms">
                    <p>By using LinkGuard (the website or the Android app) you agree to these terms. If you do not agree, please do not use the service.</p>
                </Section>

                <Section title="What the service is">
                    <p>
                        LinkGuard is a free service that gives an automated safety assessment of links based on
                        external security services. Results are for guidance only and are provided &quot;as is&quot;,
                        without any express or implied warranty of accuracy or completeness - a dangerous link may
                        be rated safe, or the reverse.
                    </p>
                </Section>

                <Section title="Acceptable use">
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Use the service to check links you received or have a legitimate reason to check.</li>
                        <li>Do not send automated bulk requests, circumvent usage limits, or overload the service.</li>
                        <li>Do not scan private or sensitive links (such as password-reset links): urlscan.io results are public.</li>
                    </ul>
                </Section>

                <Section title="Limitation of liability">
                    <p>
                        The decision to open any link is yours alone. LinkGuard and its maintainers accept no liability
                        for any damage resulting from visiting a link or relying on a scan result.
                    </p>
                </Section>

                <Section title="Third-party services and privacy">
                    <p>
                        Scanning relies on external services governed by their own terms and policies. See what we send
                        and why in the <Link href="/privacy" className={LINK_CLASS}>privacy policy</Link>.
                    </p>
                </Section>

                <Section title="Source code">
                    <p>
                        LinkGuard&apos;s source code is published on{' '}
                        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>GitHub</a>{' '}
                        under the MIT licence, which governs your use of the code itself.
                    </p>
                </Section>

                <Section title="Changes to these terms">
                    <p>We may update these terms from time to time; the last-updated date is always shown at the top of this page.</p>
                </Section>
            </div>
        </StaticPageShell>
    );
}
