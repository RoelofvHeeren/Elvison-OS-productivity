'use client';

import { useState, useEffect } from 'react';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';
import { Target, Star, Edit, Check, X, Loader2 } from 'lucide-react';

interface Priority {
    id: string;
    title: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    project: string | null;
    order: number;
    isAISuggested: boolean;
}

export default function TopPriorities() {
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        fetchPriorities();
    }, []);

    const fetchPriorities = async () => {
        try {
            const res = await fetch('/api/priorities');
            if (res.ok) {
                const data = await res.json();
                setPriorities(data);
            }
        } catch (error) {
            console.error('Failed to fetch priorities:', error);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (priority: Priority) => {
        setEditingId(priority.id);
        setEditValue(priority.title);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const saveEdit = async (id: string) => {
        if (!editValue.trim()) return;

        // Optimistic update
        setPriorities(priorities.map(p =>
            p.id === id ? { ...p, title: editValue, isAISuggested: false } : p
        ));

        try {
            await fetch('/api/priorities', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title: editValue }),
            });
        } catch (error) {
            console.error('Failed to update priority:', error);
            fetchPriorities();
        }

        setEditingId(null);
        setEditValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter') {
            saveEdit(id);
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    };

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
            <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-[#139187]" />
                <h2 className="text-xl font-bold text-[var(--text-main)]">Top 3 Priorities</h2>
            </div>

            {priorities.length === 0 ? (
                <div className="text-center py-6">
                    <p className="text-gray-400">No priorities yet</p>
                    <p className="text-xs text-gray-500 mt-1">Add high-priority tasks to see them here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {priorities.map((task, index) => (
                        <InnerCard key={task.id} padding="sm">
                            <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#139187]/20 text-[#139187] font-bold text-sm shrink-0">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {editingId === task.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, task.id)}
                                                className="flex-1 bg-[var(--glass-base)] border border-[#139187] rounded px-2 py-1 text-[var(--text-main)] text-sm outline-none"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => saveEdit(task.id)}
                                                className="p-1 text-green-400 hover:bg-white/5 rounded"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="p-1 text-red-400 hover:bg-white/5 rounded"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[var(--text-main)] font-medium">{task.title}</p>
                                            {task.project && (
                                                <p className="text-sm text-gray-400">{task.project}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`px-2 py-1 rounded text-xs font-medium ${task.priority === 'HIGH'
                                            ? 'bg-red-500/20 text-red-400'
                                            : task.priority === 'MEDIUM'
                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                            }`}
                                    >
                                        {task.priority}
                                    </div>
                                    {editingId !== task.id && (
                                        <button
                                            onClick={() => startEdit(task)}
                                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-base)] rounded transition-colors"
                                            title="Edit priority"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </InnerCard>
                    ))}
                </div>
            )}

            <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                <Star className="w-3 h-3" />
                AI-suggested based on due dates and priority. Click edit to override.
            </p>
        </GlassCard>
    );
}
