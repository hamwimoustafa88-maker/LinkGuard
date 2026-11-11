import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';

/** Shared chrome for the static, bilingual content pages (/about, /terms):
 * background, back-to-home link and page title. Server component - these
 * pages ship no JS of their own. */
export function StaticPageShell({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen relative overflow-hidden bg-cyber-dark text-white p-8">
            <div className="fixed inset-0 bg-linear-to-br from-cyber-dark via-cyber-navy to-cyber-dark -z-10" />
            <div className="fixed inset-0 bg-radial-[at_top] from-cyan-900/20 via-transparent to-transparent -z-10" />

            <div className="max-w-3xl mx-auto">
                <header className="flex items-center justify-between mb-12" dir="rtl">
                    <Link href="/" className="flex min-h-11 items-center gap-2 text-cyber-safe hover:text-cyber-glow transition-colors">
                        <ArrowRight className="w-5 h-5" />
                        <span>العودة للرئيسية</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-cyber-safe flex items-center gap-2 justify-center">
                        <Icon className="w-6 h-6" aria-hidden="true" /> {title}
                    </h1>
                    <div className="w-24" />
                </header>
                {children}
            </div>
        </main>
    );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mb-8">
            <h2 className="text-xl font-bold text-cyber-safe mb-3">{title}</h2>
            <div className="text-gray-300 leading-relaxed space-y-2">{children}</div>
        </section>
    );
}

export const LINK_CLASS = 'text-cyber-safe hover:text-cyber-glow underline';
