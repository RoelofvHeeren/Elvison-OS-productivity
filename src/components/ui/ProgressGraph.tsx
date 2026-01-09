'use client';

interface DataPoint {
    label: string;
    value: number;
}

interface ProgressGraphProps {
    data: DataPoint[];
    height?: number;
    className?: string;
    showLabels?: boolean;
}

export default function ProgressGraph({
    data,
    height = 120,
    className = '',
    showLabels = true,
}: ProgressGraphProps) {
    if (data.length === 0) return null;

    const maxValue = 100;
    const padding = { top: 10, right: 10, bottom: showLabels ? 24 : 10, left: 10 };
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = 100; // Percentage-based for responsiveness

    // Generate path points
    const points = data.map((point, index) => {
        const x = (index / (data.length - 1)) * chartWidth;
        const y = chartHeight - (point.value / maxValue) * chartHeight;
        return { x, y, ...point };
    });

    // Create smooth curve path (using quadratic bezier for smoothness)
    const linePath = points.reduce((path, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;

        const prev = points[index - 1];
        const cpX = (prev.x + point.x) / 2;
        return `${path} Q ${prev.x + (cpX - prev.x) * 0.5} ${prev.y}, ${cpX} ${(prev.y + point.y) / 2} T ${point.x} ${point.y}`;
    }, '');

    // Create area path (same as line but closed at bottom)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L 0 ${chartHeight} Z`;

    return (
        <div className={`w-full ${className}`}>
            <svg
                viewBox={`0 0 ${chartWidth} ${height}`}
                preserveAspectRatio="none"
                className="w-full"
                style={{ height }}
            >
                <defs>
                    {/* Area Gradient */}
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#139187" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#139187" stopOpacity="0.05" />
                    </linearGradient>

                    {/* Line Gradient */}
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0d6b63" />
                        <stop offset="50%" stopColor="#139187" />
                        <stop offset="100%" stopColor="#0d6b63" />
                    </linearGradient>
                </defs>

                {/* Grid Lines (subtle) */}
                <g opacity="0.1">
                    {[25, 50, 75].map((percent) => {
                        const y = padding.top + chartHeight - (percent / maxValue) * chartHeight;
                        return (
                            <line
                                key={percent}
                                x1={0}
                                y1={y}
                                x2={chartWidth}
                                y2={y}
                                stroke="white"
                                strokeWidth="0.5"
                                strokeDasharray="2,2"
                            />
                        );
                    })}
                </g>

                {/* Area Fill */}
                <path
                    d={areaPath}
                    fill="url(#areaGradient)"
                    transform={`translate(0, ${padding.top})`}
                />

                {/* Line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform={`translate(0, ${padding.top})`}
                />

                {/* Data Points */}
                {points.map((point, index) => (
                    <circle
                        key={index}
                        cx={point.x}
                        cy={point.y + padding.top}
                        r="3"
                        fill="#139187"
                        stroke="#0d6b63"
                        strokeWidth="1"
                    />
                ))}
            </svg>

            {/* X-axis Labels */}
            {showLabels && (
                <div className="flex justify-between px-1 -mt-5">
                    {data.map((point, index) => (
                        <span
                            key={index}
                            className="text-[10px] text-gray-500"
                        >
                            {point.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
