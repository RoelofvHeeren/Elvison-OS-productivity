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
            className={`bg-[var(--glass-base)] backdrop-filter backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-2xl ${paddingClasses[padding]} ${className}`}
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
            className={`bg-black/40 backdrop-blur-sm rounded-lg border border-[var(--glass-border)] ${paddingClasses[padding]} ${className}`}
        >
            {children}
        </div>
    );
}
