'use client';

interface CompletionCircleProps {
    percentage: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showLabel?: boolean;
    strokeWidth?: number;
    className?: string;
}

const sizeConfig = {
    sm: { dimension: 48, fontSize: 'text-xs', stroke: 3 },
    md: { dimension: 72, fontSize: 'text-sm', stroke: 4 },
    lg: { dimension: 96, fontSize: 'text-lg', stroke: 5 },
    xl: { dimension: 120, fontSize: 'text-2xl', stroke: 6 },
};

export default function CompletionCircle({
    percentage,
    size = 'md',
    showLabel = true,
    strokeWidth,
    className = '',
}: CompletionCircleProps) {
    const config = sizeConfig[size];
    const actualStrokeWidth = strokeWidth ?? config.stroke;
    const radius = (config.dimension - actualStrokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
    const center = config.dimension / 2;

    return (
        <div
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ width: config.dimension, height: config.dimension }}
        >
            <svg
                width={config.dimension}
                height={config.dimension}
                className="transform -rotate-90"
            >
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id={`gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#139187" />
                        <stop offset="100%" stopColor="#0d6b63" />
                    </linearGradient>
                </defs>

                {/* Background Circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={actualStrokeWidth}
                />

                {/* Progress Circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={`url(#gradient-${size})`}
                    strokeWidth={actualStrokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                />
            </svg>

            {/* Percentage Label */}
            {showLabel && (
                <span
                    className={`absolute ${config.fontSize} font-bold text-white`}
                >
                    {Math.round(percentage)}%
                </span>
            )}
        </div>
    );
}

// Compact variant for day columns
export function CompletionCircleCompact({
    percentage,
    size = 40,
    className = '',
}: {
    percentage: number;
    size?: number;
    className?: string;
}) {
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
    const center = size / 2;

    return (
        <div
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                <defs>
                    <linearGradient id="gradient-compact" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#139187" />
                        <stop offset="100%" stopColor="#0d6b63" />
                    </linearGradient>
                </defs>

                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                />

                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="url(#gradient-compact)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                />
            </svg>

            <span className="absolute text-[10px] font-semibold text-white">
                {Math.round(percentage)}
            </span>
        </div>
    );
}
