'use client';

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import CompletionCircle from '@/components/ui/CompletionCircle';
import { InnerCard } from '@/components/ui/GlassCard';

interface Task {
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
    project?: { id: string; name: string } | null;
}

interface DayTaskCardProps {
    date: Date;
    tasks: Task[];
    onToggleTask: (id: string) => void;
    togglingId?: string | null;
    className?: string;
}

export default function DayTaskCard({
    date,
    tasks,
    onToggleTask,
    togglingId,
    className = '',
}: DayTaskCardProps) {
    const completedCount = tasks.filter(t => t.status === 'DONE').length;
    const totalCount = tasks.length;
    const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const isToday = new Date().toDateString() === date.toDateString();

    const formatDate = (d: Date) => {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).replace(/\//g, '.');
        return { dayName, dateStr };
    };

    const { dayName, dateStr } = formatDate(date);

    return (
        <InnerCard className={`flex flex-col ${className}`} padding="md">
            {/* Date Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className={`text-lg font-semibold ${isToday ? 'text-[#139187]' : 'text-white'}`}>
                        {isToday ? 'Today' : dayName}
                    </h3>
                    <p className="text-xs text-gray-500">{dateStr}</p>
                </div>
                {isToday && (
                    <span className="px-2 py-0.5 bg-[#139187]/20 text-[#139187] text-xs rounded-full">
                        Today
                    </span>
                )}
            </div>

            {/* Completion Circle */}
            <div className="flex justify-center mb-4">
                <CompletionCircle percentage={percentage} size="lg" />
            </div>

            {/* Task Count */}
            <p className="text-center text-sm text-gray-400 mb-4">
                {completedCount}/{totalCount} tasks
            </p>

            {/* Task List */}
            {tasks.length === 0 ? (
                <p className="text-center text-sm text-gray-500">No tasks</p>
            ) : (
                <div className="space-y-2 flex-1 overflow-y-auto">
                    {tasks.map((task) => {
                        const isCompleted = task.status === 'DONE';
                        const isToggling = togglingId === task.id;

                        return (
                            <button
                                key={task.id}
                                onClick={() => onToggleTask(task.id)}
                                disabled={isToggling}
                                className={`w-full flex items-center gap-2 p-3 rounded-lg text-left transition-colors ${isCompleted
                                        ? 'bg-black/10'
                                        : 'bg-black/20 hover:bg-black/30'
                                    } ${isToggling ? 'opacity-50' : ''}`}
                            >
                                {isToggling ? (
                                    <Loader2 className="w-5 h-5 text-[#139187] animate-spin shrink-0" />
                                ) : isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-400 shrink-0" />
                                )}
                                <span
                                    className={`text-sm font-medium truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-white'
                                        }`}
                                >
                                    {task.title}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </InnerCard>
    );
}
