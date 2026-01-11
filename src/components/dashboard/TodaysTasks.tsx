'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { CheckSquare, Circle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
    dueTime: string | null;
    project: { id: string; name: string } | null;
}

export default function TodaysTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const todayStr = new Date().toLocaleDateString('en-CA');
            const res = await fetch(`/api/tasks?date=${todayStr}`);
            if (res.ok) {
                const data = await res.json();
                // Sort: Pending first, then Completed
                const sortedTasks = data.sort((a: Task, b: Task) => {
                    if (a.status === 'DONE' && b.status !== 'DONE') return 1;
                    if (a.status !== 'DONE' && b.status === 'DONE') return -1;
                    return 0;
                });
                setTasks(sortedTasks);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = async (id: string, currentStatus: string) => {
        setTogglingId(id);
        const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';

        // Optimistic update
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, status: newStatus as Task['status'] } : task
        ));

        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                // Revert on failure
                setTasks(tasks.map(task =>
                    task.id === id ? { ...task, status: currentStatus as Task['status'] } : task
                ));
            }
        } catch (error) {
            console.error('Failed to toggle task:', error);
            // Revert on error
            setTasks(tasks.map(task =>
                task.id === id ? { ...task, status: currentStatus as Task['status'] } : task
            ));
        } finally {
            setTogglingId(null);
        }
    };

    const completedCount = tasks.filter(t => t.status === 'DONE').length;
    const totalCount = tasks.length;

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
                    <CheckSquare className="w-6 h-6 text-[#139187]" />
                    <h2 className="text-xl font-bold text-white">Today&apos;s Tasks</h2>
                </div>
                <span className="text-sm text-gray-400">
                    {completedCount}/{totalCount} completed
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-black/30 rounded-full h-2 mb-4">
                <div
                    className="bg-gradient-to-r from-[#139187] to-[#0d6b63] h-2 rounded-full transition-all duration-500"
                    style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                />
            </div>

            {tasks.length === 0 ? (
                <div className="text-center py-6">
                    <p className="text-gray-400">No tasks for today</p>
                    <p className="text-xs text-gray-500 mt-1">Add tasks in the Task Manager</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <button
                            key={task.id}
                            onClick={() => toggleTask(task.id, task.status)}
                            disabled={togglingId === task.id}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${task.status === 'DONE'
                                ? 'bg-black/10 opacity-60'
                                : 'bg-black/20 hover:bg-black/30'
                                } ${togglingId === task.id ? 'opacity-50' : ''}`}
                        >
                            {/* Status Icon */}
                            {togglingId === task.id ? (
                                <Loader2 className="w-5 h-5 text-[#139187] animate-spin shrink-0" />
                            ) : task.status === 'DONE' ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                            ) : task.status === 'IN_PROGRESS' ? (
                                <Circle className="w-5 h-5 text-[#139187] fill-[#139187]/30 shrink-0" />
                            ) : (
                                <Circle className="w-5 h-5 text-gray-500 shrink-0" />
                            )}

                            {/* Task Info */}
                            <div className="flex-1 min-w-0">
                                <p
                                    className={`font-medium ${task.status === 'DONE' ? 'text-gray-500 line-through' : 'text-white'
                                        }`}
                                >
                                    {task.title}
                                </p>
                                {task.project && (
                                    <p className="text-xs text-gray-500">{task.project.name}</p>
                                )}
                            </div>

                            {/* Due Time */}
                            {task.dueTime && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    {new Date(task.dueTime).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                    })}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </GlassCard>
    );
}
