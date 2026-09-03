import type { LucideIcon } from 'lucide-react';

interface InfoRowProps {
    icon: LucideIcon;
    label: string;
    value: string;
}

export default function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
    return (
        <div className="flex items-center gap-4 p-4 bg-cyber-navy/50 rounded-xl">
            <Icon className="w-6 h-6 text-cyber-glow" />
            <div className="flex-1">
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-white font-mono" dir="ltr">{value}</p>
            </div>
        </div>
    );
}
