import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="space-y-1">
                {label && (
                    <label className="text-sm text-gray-400 block">{label}</label>
                )}
                <input
                    ref={ref}
                    className={`w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#139187] focus:ring-2 focus:ring-[#139187]/20 transition-all placeholder:text-gray-500 ${error ? 'border-red-500' : ''
                        } ${className}`}
                    {...props}
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="space-y-1">
                {label && (
                    <label className="text-sm text-gray-400 block">{label}</label>
                )}
                <textarea
                    ref={ref}
                    className={`w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#139187] focus:ring-2 focus:ring-[#139187]/20 transition-all resize-none placeholder:text-gray-500 ${error ? 'border-red-500' : ''
                        } ${className}`}
                    {...props}
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
        );
    }
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, className = '', ...props }, ref) => {
        return (
            <div className="space-y-1">
                {label && (
                    <label className="text-sm text-gray-400 block">{label}</label>
                )}
                <select
                    ref={ref}
                    className={`w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#139187] focus:ring-2 focus:ring-[#139187]/20 transition-all ${error ? 'border-red-500' : ''
                        } ${className}`}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
        );
    }
);
Select.displayName = 'Select';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, className = '', ...props }, ref) => {
        return (
            <label className="flex items-center gap-3 cursor-pointer group">
                <input
                    ref={ref}
                    type="checkbox"
                    className={`w-5 h-5 bg-gray-900/50 border border-gray-600 rounded text-[#139187] focus:ring-[#139187] focus:ring-2 focus:ring-offset-0 ${className}`}
                    {...props}
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    {label}
                </span>
            </label>
        );
    }
);
Checkbox.displayName = 'Checkbox';

interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
    return (
        <label className="flex items-center gap-3 cursor-pointer">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#139187]' : 'bg-gray-600'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''
                        }`}
                />
            </button>
            <span className="text-sm text-gray-300">{label}</span>
        </label>
    );
}
