'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { CompletionCircleCompact } from '@/components/ui/CompletionCircle';
import ProgressGraph from '@/components/ui/ProgressGraph';
import DayTaskCard from './DayTaskCard';

interface Task {
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
    dueDate?: string | null;
    doToday: boolean;
    project?: { id: string; name: string } | null;
}

interface TaskWeeklyOverviewProps {
    tasks: Task[];
    weekOffset: number;
    onWeekChange: (offset: number) => void;
    onToggleTask: (id: string) => void;
    togglingId?: string | null;
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

export default function TaskWeeklyOverview({
    tasks,
    weekOffset,
    onWeekChange,
    onToggleTask,
    togglingId,
}: TaskWeeklyOverviewProps) {
    const weekDays = getWeekDays(weekOffset);

    // Get tasks for each day
    const getTasksForDay = (dateStr: string) => {
        return tasks.filter((task) => {
            // Tasks with dueDate matching this day
            if (task.dueDate && task.dueDate.startsWith(dateStr)) return true;
            // "Do Today" tasks for today only
            const today = new Date().toISOString().split('T')[0];
            if (task.doToday && dateStr === today) return true;
            return false;
        });
    };

    // Calculate completion percentages for graph
    const graphData = weekDays.map((day) => {
        const dayTasks = getTasksForDay(day.dateStr);
        const completed = dayTasks.filter(t => t.status === 'DONE').length;
        const total = dayTasks.length;
        return {
            label: day.dayName,
            value: total > 0 ? (completed / total) * 100 : 0,
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
                        const dayTasks = getTasksForDay(day.dateStr);
                        const completed = dayTasks.filter(t => t.status === 'DONE').length;
                        const total = dayTasks.length;
                        const percentage = total > 0 ? (completed / total) * 100 : 0;

                        return (
                            <div key={day.dateStr} className="flex flex-col items-center">
                                <span className={`text-xs mb-1 font-bold uppercase tracking-wide ${day.isToday ? 'text-[#139187]' : 'text-white'}`}>
                                    {day.dayName}
                                </span>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${day.isToday ? 'bg-[#139187]/20 text-[#139187]' : 'text-white'
                                    }`}>
                                    {day.dayNum}
                                </div>
                                <CompletionCircleCompact percentage={percentage} size={36} />
                                <span className="text-[10px] text-white font-semibold mt-1">
                                    {completed}/{total}
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
                    <DayTaskCard
                        key={day.dateStr}
                        date={day.date}
                        tasks={getTasksForDay(day.dateStr)}
                        onToggleTask={onToggleTask}
                        togglingId={togglingId}
                    />
                ))}
            </div>
        </div>
    );
}
