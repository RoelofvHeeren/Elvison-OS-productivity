'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/FormElements';
import {
    Flame,
    Plus,
    Check,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Trash2,
} from 'lucide-react';

interface Habit {
    id: string;
    name: string;
    color: string;
    streak: number;
    completionRate: number;
    logs: { date: string; completed: boolean }[];
}

function getWeekDays(weekOffset: number = 0) {
    const days = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + (weekOffset * 7));

    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        days.push({
            date: date.toISOString().split('T')[0],
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: date.getDate(),
            isToday: date.toDateString() === today.toDateString(),
            isFuture: date > today,
        });
    }
    return days;
}

function getWeekLabel(weekOffset: number, weekDays: { dayNum: number }[]) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) + (weekOffset * 7));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const monthStart = startDate.toLocaleDateString('en-US', { month: 'short' });
    const monthEnd = endDate.toLocaleDateString('en-US', { month: 'short' });

    return monthStart === monthEnd
        ? `${weekDays[0].dayNum} - ${weekDays[6].dayNum} ${monthStart}`
        : `${weekDays[0].dayNum} ${monthStart} - ${weekDays[6].dayNum} ${monthEnd}`;
}

export default function HabitsPage() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitColor, setNewHabitColor] = useState('#139187');

    const weekDays = getWeekDays(weekOffset);
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

    const toggleHabit = async (habitId: string, date: string, isFuture: boolean) => {
        if (isFuture) return; // Block future dates

        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const isCompleted = habit.logs.some(l => l.date === date && l.completed);

        // Optimistic update
        setHabits(habits.map(h => {
            if (h.id !== habitId) return h;
            const newLogs = isCompleted
                ? h.logs.filter(l => l.date !== date)
                : [...h.logs, { date, completed: true }];
            return { ...h, logs: newLogs };
        }));

        try {
            if (isCompleted) {
                await fetch(`/api/habits/${habitId}/log?date=${date}`, { method: 'DELETE' });
            } else {
                await fetch(`/api/habits/${habitId}/log`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date }),
                });
            }
        } catch (error) {
            console.error('Failed to toggle habit:', error);
            fetchHabits();
        }
    };

    const deleteHabit = async (id: string) => {
        if (!confirm('Are you sure you want to delete this habit? All logs will be lost.')) return;

        // Optimistic update
        const originalHabits = [...habits];
        setHabits(habits.filter(h => h.id !== id));

        try {
            const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
        } catch (error) {
            console.error('Failed to delete habit:', error);
            setHabits(originalHabits);
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createHabit = async () => {
        if (!newHabitName.trim() || isSubmitting) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/habits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newHabitName.trim(),
                    color: newHabitColor,
                }),
            });

            if (res.ok) {
                const newHabit = await res.json();
                setHabits([...habits, newHabit]);
                setNewHabitName('');
                setNewHabitColor('#139187');
                setIsFormOpen(false);
            } else {
                const data = await res.json();
                setError(data.error || data.details || 'Failed to create habit');
            }
        } catch (error) {
            console.error('Failed to create habit:', error);
            setError('Connection error. Please check if the database is running.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <PageHeader
                    title="Habits"
                    description="Build consistency through daily practice"
                    icon={Flame}
                />
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#139187] animate-spin" />
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Habits"
                description="Build consistency through daily practice"
                icon={Flame}
            >
                <Button icon={Plus} onClick={() => setIsFormOpen(true)}>
                    New Habit
                </Button>
            </PageHeader>

            {/* Weekly Overview */}
            <GlassCard>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">
                        {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : getWeekLabel(weekOffset, weekDays)}
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setWeekOffset(weekOffset - 1)}
                            className="p-1 hover:bg-white/5 rounded"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-400" />
                        </button>
                        <span className="text-sm text-gray-400">
                            {getWeekLabel(weekOffset, weekDays)}
                        </span>
                        <button
                            onClick={() => setWeekOffset(Math.min(0, weekOffset + 1))}
                            disabled={weekOffset >= 0}
                            className="p-1 hover:bg-white/5 rounded disabled:opacity-30"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="text-left py-2 pr-4 text-xs text-gray-500 uppercase tracking-wider">
                                    Habit
                                </th>
                                {weekDays.map((day) => (
                                    <th
                                        key={day.date}
                                        className={`text-center px-2 py-2 text-xs ${day.isToday ? 'text-[#139187]' : day.isFuture ? 'text-gray-600' : 'text-gray-500'
                                            }`}
                                    >
                                        <div>{day.dayName}</div>
                                        <div
                                            className={`mt-1 ${day.isToday
                                                ? 'w-6 h-6 rounded-full bg-[#139187]/20 flex items-center justify-center mx-auto'
                                                : ''
                                                }`}
                                        >
                                            {day.dayNum}
                                        </div>
                                    </th>
                                ))}
                                <th className="text-center px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
                                    <Flame className="w-4 h-4 inline" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {habits.map((habit) => (
                                <tr key={habit.id} className="border-t border-white/5">
                                    <td className="py-3 pr-4">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: habit.color }}
                                            />
                                            <span className="text-sm text-white">{habit.name}</span>
                                        </div>
                                    </td>
                                    {weekDays.map((day) => {
                                        const log = habit.logs.find((l) => l.date === day.date);
                                        const completed = log?.completed || false;
                                        return (
                                            <td key={day.date} className="text-center px-2 py-3">
                                                <button
                                                    onClick={() => toggleHabit(habit.id, day.date, day.isFuture)}
                                                    disabled={day.isFuture}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${completed
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : day.isFuture
                                                            ? 'bg-black/10 text-gray-700 cursor-not-allowed'
                                                            : 'bg-black/20 text-gray-600 hover:bg-white/5'
                                                        }`}
                                                >
                                                    {completed ? (
                                                        <Check className="w-4 h-4" />
                                                    ) : (
                                                        <X className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </td>
                                        );
                                    })}
                                    <td className="text-center px-4 py-3">
                                        <span className="text-sm font-bold text-orange-400">
                                            {habit.streak}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Habit Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {habits.map((habit) => (
                    <InnerCard key={habit.id}>
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: habit.color }}
                                />
                                <h4 className="font-medium text-white">{habit.name}</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-orange-400">
                                    <Flame className="w-4 h-4" />
                                    <span className="font-bold">{habit.streak}</span>
                                </div>
                                <button
                                    onClick={() => deleteHabit(habit.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                    title="Delete Habit"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* 30-day Mini Grid */}
                        <div className="grid grid-cols-10 gap-1 mb-3">
                            {Array.from({ length: 30 }).map((_, i) => {
                                const checkDate = new Date();
                                checkDate.setDate(checkDate.getDate() - (29 - i));
                                const dateStr = checkDate.toISOString().split('T')[0];
                                const log = habit.logs.find(l => l.date === dateStr);
                                return (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 rounded-sm ${log?.completed ? 'bg-green-500/60' : 'bg-black/30'
                                            }`}
                                        title={dateStr}
                                    />
                                );
                            })}
                        </div>

                        {/* Completion Rate */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">30-day rate</span>
                            <span className="text-white font-medium">
                                {habit.completionRate}%
                            </span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-1.5 mt-1">
                            <div
                                className="h-1.5 rounded-full"
                                style={{
                                    width: `${habit.completionRate}%`,
                                    backgroundColor: habit.color,
                                }}
                            />
                        </div>
                    </InnerCard>
                ))}
            </div>

            {/* New Habit Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title="New Habit"
                description="Add a new habit to track daily"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={createHabit} loading={isSubmitting} disabled={!newHabitName.trim()}>
                            Create Habit
                        </Button>
                    </>
                }
            >
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mb-4">
                        {error}
                    </div>
                )}
                <div className="space-y-4">
                    <Input
                        label="Habit Name"
                        placeholder="e.g., Morning Meditation"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                    />
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">Color</label>
                        <div className="flex gap-2">
                            {['#139187', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#22c55e'].map(
                                (color) => (
                                    <button
                                        key={color}
                                        onClick={() => setNewHabitColor(color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-colors ${newHabitColor === color
                                            ? 'border-white'
                                            : 'border-transparent hover:border-white/50'
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                )
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            <p className="text-xs text-gray-500 text-center">
                No AI coaching or motivational messaging. Just track and build consistency.
            </p>
        </>
    );
}
