'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Flame, Check, Minus, Loader2 } from 'lucide-react';

interface Habit {
    id: string;
    name: string;
    color: string;
    streak: number;
    logs: { date: string; completed: boolean }[];
}

// Normalize date to YYYY-MM-DD format for consistent comparison
function normalizeDate(date: string | Date): string {
    if (typeof date === 'string') {
        // If already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
        // Otherwise parse and convert
        return new Date(date).toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
}

export default function HabitSnapshot() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchHabits();
    }, []);

    const fetchHabits = async () => {
        try {
            const res = await fetch('/api/habits');
            if (res.ok) {
                const data = await res.json();
                setHabits(data);
            }
        } catch (error) {
            console.error('Failed to fetch habits:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleHabit = async (habitId: string) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const isCompleted = habit.logs.some(l => normalizeDate(l.date) === today && l.completed);
        setTogglingId(habitId);

        // Optimistic update
        setHabits(habits.map(h => {
            if (h.id !== habitId) return h;
            const newLogs = isCompleted
                ? h.logs.filter(l => normalizeDate(l.date) !== today)
                : [...h.logs, { date: today, completed: true }];
            return {
                ...h,
                logs: newLogs,
                streak: isCompleted ? h.streak - 1 : h.streak + 1,
            };
        }));

        try {
            if (isCompleted) {
                await fetch(`/api/habits/${habitId}/log?date=${today}`, {
                    method: 'DELETE',
                });
            } else {
                await fetch(`/api/habits/${habitId}/log`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: today }),
                });
            }
        } catch (error) {
            console.error('Failed to toggle habit:', error);
            // Revert on error
            fetchHabits();
        } finally {
            setTogglingId(null);
        }
    };

    const getCompletedToday = (habit: Habit) =>
        habit.logs.some(l => normalizeDate(l.date) === today && l.completed);

    const completedCount = habits.filter(getCompletedToday).length;
    const totalCount = habits.length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (loading) {
        return (
            <GlassCard>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#139187] animate-spin" />
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Flame className="w-6 h-6 text-[#139187]" />
                    <h2 className="text-lg font-bold text-white">Habits</h2>
                </div>
                <span className="text-sm text-[#139187] font-medium">
                    {completionPercentage}%
                </span>
            </div>

            {habits.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">No habits yet</p>
                    <p className="text-xs text-gray-500 mt-1">Add habits in the Habits section</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {habits.map((habit) => {
                        const completed = getCompletedToday(habit);
                        const isToggling = togglingId === habit.id;
                        return (
                            <button
                                key={habit.id}
                                onClick={() => toggleHabit(habit.id)}
                                disabled={isToggling}
                                className={`w-full flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/5 rounded px-2 transition-colors ${isToggling ? 'opacity-50' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {isToggling ? (
                                        <div className="w-5 h-5 rounded flex items-center justify-center">
                                            <Loader2 className="w-3 h-3 text-[#139187] animate-spin" />
                                        </div>
                                    ) : completed ? (
                                        <div
                                            className="w-5 h-5 rounded flex items-center justify-center"
                                            style={{ backgroundColor: `${habit.color}30` }}
                                        >
                                            <Check className="w-3 h-3" style={{ color: habit.color }} />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded bg-black/30 flex items-center justify-center">
                                            <Minus className="w-3 h-3 text-gray-500" />
                                        </div>
                                    )}
                                    <span className={`text-sm ${completed ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {habit.name}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-orange-400" />
                                    {habit.streak}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </GlassCard>
    );
}
