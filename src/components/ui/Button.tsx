import { ReactNode, ButtonHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    children?: ReactNode;
    loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        'bg-gradient-to-r from-[#139187] to-[#0d6b63] text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5',
    secondary:
        'bg-black/20 hover:bg-white/5 text-gray-300 border border-white/10',
    accent:
        'bg-[#139187]/20 hover:bg-[#139187]/30 text-[#139187] border border-[#139187]/30',
    danger:
        'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
    ghost: 'hover:bg-white/5 text-gray-400',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 rounded-xl',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    children,
    loading = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <button
            className={`
        inline-flex items-center justify-center gap-2 
        transition-all duration-300 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
            disabled={isDisabled}
            {...props}
        >
            {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
                </>
            )}
        </button>
    );
}

// Icon-only button variant
export function IconButton({
    icon: Icon,
    className = '',
    ...props
}: Omit<ButtonProps, 'children'> & { icon: LucideIcon }) {
    return (
        <button
            className={`p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors ${className}`}
            {...props}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}
