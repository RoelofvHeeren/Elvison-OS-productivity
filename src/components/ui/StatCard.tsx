import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    variant?: 'default' | 'money';
}

export default function StatCard({
    label,
    value,
    icon: Icon,
    variant = 'default',
}: StatCardProps) {
    if (variant === 'money') {
        return (
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
                {Icon && <Icon className="w-5 h-5 text-yellow-400 mb-2" />}
                <p className="text-2xl font-bold text-yellow-300">{value}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
            </div>
        );
    }

    return (
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            {Icon && <Icon className="w-5 h-5 text-[#139187] mb-2" />}
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-white/70 uppercase tracking-wider">{label}</p>
        </div>
    );
}
