'use client';

import { Check, Minus, Loader2, Flame } from 'lucide-react';
import CompletionCircle from '@/components/ui/CompletionCircle';
import { InnerCard } from '@/components/ui/GlassCard';

interface Habit {
    id: string;
    name: string;
    color: string;
    streak: number;
    logs: { date: string; completed: boolean }[];
}

interface DayHabitCardProps {
    date: Date;
    habits: Habit[];
    onToggleHabit: (habitId: string, date: string) => void;
    togglingId?: string | null;
    className?: string;
}

function normalizeDate(date: string | Date): string {
    if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        return new Date(date).toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
}

export default function DayHabitCard({
    date,
    habits,
    onToggleHabit,
    togglingId,
    className = '',
}: DayHabitCardProps) {
    const dateStr = date.toISOString().split('T')[0];
    const isToday = new Date().toDateString() === date.toDateString();
    const isFuture = date > new Date();

    const completedCount = habits.filter(h =>
        h.logs.some(l => normalizeDate(l.date) === dateStr && l.completed)
    ).length;
    const totalCount = habits.length;
    const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const formatDate = (d: Date) => {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const dateFormatted = d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).replace(/\//g, '.');
        return { dayName, dateFormatted };
    };

    const { dayName, dateFormatted } = formatDate(date);

    return (
        <InnerCard className={`flex flex-col ${className}`} padding="md">
            {/* Date Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className={`text-lg font-bold ${isToday ? 'text-[#139187]' : 'text-white'}`}>
                        {isToday ? 'Today' : dayName}
                    </h3>
                    <p className="text-xs text-white font-semibold uppercase tracking-wide">{dateFormatted}</p>
                </div>
                {isToday && (
                    <span className="px-2 py-0.5 bg-[#139187] text-white text-xs font-bold rounded-full">
                        TODAY
                    </span>
                )}
            </div>

            {/* Completion Circle */}
            <div className="flex justify-center mb-4">
                <CompletionCircle percentage={percentage} size="lg" />
            </div>

            {/* Habit Count */}
            <p className="text-center text-sm text-white font-semibold mb-4">
                {completedCount}/{totalCount} habits
            </p>

            {/* Habit List */}
            {habits.length === 0 ? (
                <p className="text-center text-sm text-gray-500">No habits</p>
            ) : (
                <div className="space-y-2 flex-1 overflow-y-auto">
                    {habits.map((habit) => {
                        const isCompleted = habit.logs.some(
                            l => normalizeDate(l.date) === dateStr && l.completed
                        );
                        const isToggling = togglingId === habit.id;

                        return (
                            <button
                                key={habit.id}
                                onClick={() => !isFuture && onToggleHabit(habit.id, dateStr)}
                                disabled={isToggling || isFuture}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${isFuture
                                    ? 'bg-black/10 opacity-50 cursor-not-allowed'
                                    : isCompleted
                                        ? 'bg-black/10'
                                        : 'bg-black/20 hover:bg-black/30'
                                    } ${isToggling ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    {isToggling ? (
                                        <div className="w-5 h-5 rounded flex items-center justify-center">
                                            <Loader2 className="w-3 h-3 text-[#139187] animate-spin" />
                                        </div>
                                    ) : isCompleted ? (
                                        <div
                                            className="w-5 h-5 rounded flex items-center justify-center"
                                            style={{ backgroundColor: `${habit.color}30` }}
                                        >
                                            <Check className="w-3 h-3" style={{ color: habit.color }} />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded bg-black/30 flex items-center justify-center">
                                            <Minus className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                    <span className={`text-sm font-bold ${isCompleted ? 'text-gray-400' : 'text-white'}`}>
                                        {habit.name}
                                    </span>
                                </div>
                                <span className="text-xs text-white flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-orange-400" />
                                    {habit.streak}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </InnerCard>
    );
}
