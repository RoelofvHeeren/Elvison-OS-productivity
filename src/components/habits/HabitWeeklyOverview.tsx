'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { CompletionCircleCompact } from '@/components/ui/CompletionCircle';
import ProgressGraph from '@/components/ui/ProgressGraph';
import DayHabitCard from './DayHabitCard';

interface Habit {
    id: string;
    name: string;
    color: string;
    streak: number;
    completionRate: number;
    logs: { date: string; completed: boolean }[];
}

interface HabitWeeklyOverviewProps {
    habits: Habit[];
    weekOffset: number;
    onWeekChange: (offset: number) => void;
    onToggleHabit: (habitId: string, date: string) => void;
    togglingId?: string | null;
}

function normalizeDate(date: string | Date): string {
    if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        return new Date(date).toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
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
            date,
            dateStr: date.toISOString().split('T')[0],
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: date.getDate(),
            isToday: date.toDateString() === today.toDateString(),
            isFuture: date > today,
        });
    }
    return days;
}

function getWeekLabel(weekOffset: number, weekDays: ReturnType<typeof getWeekDays>) {
    const startDate = weekDays[0].date;
    const endDate = weekDays[6].date;

    const monthStart = startDate.toLocaleDateString('en-US', { month: 'short' });
    const monthEnd = endDate.toLocaleDateString('en-US', { month: 'short' });

    return monthStart === monthEnd
        ? `${weekDays[0].dayNum} - ${weekDays[6].dayNum} ${monthStart}`
        : `${weekDays[0].dayNum} ${monthStart} - ${weekDays[6].dayNum} ${monthEnd}`;
}

export default function HabitWeeklyOverview({
    habits,
    weekOffset,
    onWeekChange,
    onToggleHabit,
    togglingId,
}: HabitWeeklyOverviewProps) {
    const weekDays = getWeekDays(weekOffset);

    // Calculate completion for each day
    const getCompletionForDay = (dateStr: string) => {
        const completed = habits.filter(h =>
            h.logs.some(l => normalizeDate(l.date) === dateStr && l.completed)
        ).length;
        return {
            completed,
            total: habits.length,
            percentage: habits.length > 0 ? (completed / habits.length) * 100 : 0,
        };
    };

    // Calculate completion percentages for graph
    const graphData = weekDays.map((day) => {
        const { percentage } = getCompletionForDay(day.dateStr);
        return {
            label: day.dayName,
            value: percentage,
        };
    });

    return (
        <div className="space-y-4">
            {/* Week Navigation & Header */}
            <GlassCard>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">
                        {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : getWeekLabel(weekOffset, weekDays)}
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onWeekChange(weekOffset - 1)}
                            className="p-1 hover:bg-white/5 rounded transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-400" />
                        </button>
                        <span className="text-sm text-gray-400">
                            {getWeekLabel(weekOffset, weekDays)}
                        </span>
                        <button
                            onClick={() => onWeekChange(Math.min(0, weekOffset + 1))}
                            disabled={weekOffset >= 0}
                            className="p-1 hover:bg-white/5 rounded disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Day Summary Grid with Completion Circles */}
                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                        const { completed, total, percentage } = getCompletionForDay(day.dateStr);

                        return (
                            <div key={day.dateStr} className="flex flex-col items-center">
                                <span className={`text-xs mb-1 font-bold uppercase tracking-wide ${day.isToday ? 'text-[#139187]' : 'text-white'}`}>
                                    {day.dayName}
                                </span>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${day.isToday ? 'bg-[#139187]/20 text-[#139187]' : 'text-white'
                                    }`}>
                                    {day.dayNum}
                                </div>
                                <CompletionCircleCompact
                                    percentage={day.isFuture ? 0 : percentage}
                                    size={36}
                                />
                                <span className="text-[10px] text-white font-semibold mt-1">
                                    {day.isFuture ? '-' : `${completed}/${total}`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </GlassCard>

            {/* Progress Graph */}
            <GlassCard>
                <h4 className="text-sm font-medium text-white mb-3">Weekly Completion Trend</h4>
                <ProgressGraph data={graphData} height={100} />
            </GlassCard>

            {/* Day Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {weekDays.map((day) => (
                    <DayHabitCard
                        key={day.dateStr}
                        date={day.date}
                        habits={habits}
                        onToggleHabit={onToggleHabit}
                        togglingId={togglingId}
                    />
                ))}
            </div>
        </div>
    );
}
