type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
    status: StatusType;
    label: string;
    showDot?: boolean;
}

const statusClasses: Record<StatusType, { text: string; dot: string }> = {
    success: { text: 'text-green-400', dot: 'bg-green-400' },
    warning: { text: 'text-orange-400', dot: 'bg-orange-400' },
    error: { text: 'text-red-400', dot: 'bg-red-400' },
    info: { text: 'text-[var(--accent-primary)]', dot: 'bg-[var(--accent-primary)]' },
    default: { text: 'text-gray-400', dot: 'bg-gray-400' },
};

export default function StatusBadge({
    status,
    label,
    showDot = true,
}: StatusBadgeProps) {
    const { text, dot } = statusClasses[status];

    return (
        <span className={`inline-flex items-center gap-2 text-sm font-medium ${text}`}>
            {showDot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
            {label}
        </span>
    );
}

// Map common task/project statuses to badge types
export function getStatusType(status: string): StatusType {
    const statusMap: Record<string, StatusType> = {
        // Task statuses
        TODO: 'default',
        IN_PROGRESS: 'info',
        BLOCKED: 'warning',
        DONE: 'success',
        // Project statuses
        ACTIVE: 'info',
        PAUSED: 'warning',
        COMPLETED: 'success',
        // Generic
        FAILED: 'error',
        PARTIAL: 'warning',
        RUNNING: 'info',
    };

    return statusMap[status] || 'default';
}
