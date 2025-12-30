import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Date utilities
export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function formatDateTime(date: Date | string): string {
    return `${formatDate(date)} at ${formatTime(date)}`;
}

export function isToday(date: Date | string): boolean {
    const d = new Date(date);
    const today = new Date();
    return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
    );
}

export function isSunday(): boolean {
    return new Date().getDay() === 0;
}

export function isMonday(): boolean {
    return new Date().getDay() === 1;
}

export function getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(d.setDate(diff));
}

export function getWeekEnd(date: Date = new Date()): Date {
    const start = getWeekStart(date);
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
}

// Task priorities
export const priorityOrder = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
};

export function sortByPriority<T extends { priority: keyof typeof priorityOrder }>(
    items: T[]
): T[] {
    return [...items].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// Generate unique ID (client-side)
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

// Debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Truncate text
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
}

// Get initials from name
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
