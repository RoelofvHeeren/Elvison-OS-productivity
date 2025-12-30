import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export default function GlassCard({
    children,
    className = '',
    padding = 'md',
}: GlassCardProps) {
    return (
        <div
            className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl ${paddingClasses[padding]} ${className}`}
        >
            {children}
        </div>
    );
}

// Inner card variant for nested elements
export function InnerCard({
    children,
    className = '',
    padding = 'md',
}: GlassCardProps) {
    return (
        <div
            className={`bg-black/20 rounded-lg border border-white/10 ${paddingClasses[padding]} ${className}`}
        >
            {children}
        </div>
    );
}
