import type { TFunction } from '@/components/LanguageContext';

interface VerificationStepsProps {
    t: TFunction;
}

export default function VerificationSteps({ t }: VerificationStepsProps) {
    const steps = [
        { id: 1, label: t('stepUnshorten'), status: 'done' },
        { id: 2, label: t('stepVirusScan'), status: 'done' },
        { id: 3, label: t('stepAnalyze'), status: 'done' },
        { id: 4, label: t('stepResult'), status: 'done' },
    ];

    return (
        <div className="flex items-center justify-between mb-8 relative px-4">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 -z-10 rounded-full" />

            {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center bg-cyber-dark p-2 rounded-xl border border-cyber-safe/20">
                    <div className="w-10 h-10 rounded-full bg-cyber-safe flex items-center justify-center text-cyber-dark font-bold mb-2 shadow-[0_0_15px_rgba(0,255,136,0.5)]">
                        ✓
                    </div>
                    <span className="text-sm font-bold text-cyber-safe">{step.label}</span>
                </div>
            ))}
        </div>
    );
}
