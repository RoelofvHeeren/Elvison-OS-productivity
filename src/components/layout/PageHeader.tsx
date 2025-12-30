import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    children?: ReactNode;
}

export default function PageHeader({
    title,
    description,
    icon: Icon,
    children,
}: PageHeaderProps) {
    return (
        <div className="glass-card p-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-3">
                        {Icon && <Icon className="w-8 h-8 text-[#139187]" />}
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-gray-400 mt-1">{description}</p>
                    )}
                </div>
                {children && <div className="flex items-center gap-3">{children}</div>}
            </div>
        </div>
    );
}
