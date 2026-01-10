'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Loader2, Clock, Calendar } from 'lucide-react';
import { InnerCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

interface Reminder {
    id: string;
    title: string;
    datetime: string;
    type: string;
    completed: boolean;
}

interface RemindersPanelProps {
    onClose: () => void;
}

export default function RemindersPanel({ onClose }: RemindersPanelProps) {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDatetime, setNewDatetime] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchReminders();
    }, []);

    const fetchReminders = async () => {
        try {
            const res = await fetch('/api/reminders');
            if (res.ok) {
                const data = await res.json();
                setReminders(data);
            }
        } catch (error) {
            console.error('Failed to fetch reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    const createReminder = async () => {
        if (!newTitle.trim() || !newDatetime) return;
        setCreating(true);
        try {
            const res = await fetch('/api/reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    datetime: new Date(newDatetime).toISOString()
                }),
            });
            if (res.ok) {
                const reminder = await res.json();
                setReminders([...reminders, reminder].sort((a, b) =>
                    new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
                ));
                setIsAdding(false);
                setNewTitle('');
                setNewDatetime('');
            }
        } catch (error) {
            console.error('Failed to create reminder:', error);
        } finally {
            setCreating(false);
        }
    };

    const markComplete = async (id: string) => {
        try {
            const res = await fetch(`/api/reminders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: true }),
            });
            if (res.ok) {
                setReminders(reminders.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error('Failed to complete reminder:', error);
        }
    };

    const deleteReminder = async (id: string) => {
        try {
            const res = await fetch(`/api/reminders/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setReminders(reminders.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete reminder:', error);
        }
    };

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        const timeStr = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        if (isToday) return `Today at ${timeStr}`;
        if (isTomorrow) return `Tomorrow at ${timeStr}`;

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const isOverdue = (datetime: string) => {
        return new Date(datetime) < new Date();
    };

    const isUpcoming = (datetime: string) => {
        const reminderTime = new Date(datetime);
        const now = new Date();
        const hourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        return reminderTime > now && reminderTime <= hourFromNow;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#139187] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#139187]" />
                    <h3 className="text-lg font-medium text-white">Reminders</h3>
                    <span className="text-sm text-gray-500">({reminders.length})</span>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsAdding(!isAdding)}
                    >
                        {isAdding ? 'Cancel' : 'Add Reminder'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>

            {isAdding && (
                <InnerCard className="p-4 mb-4 border-white/20">
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Title</label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="What to remind you about?"
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#139187] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">When</label>
                            <input
                                type="datetime-local"
                                value={newDatetime}
                                onChange={(e) => setNewDatetime(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#139187] outline-none"
                            />
                        </div>
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={createReminder}
                            disabled={!newTitle.trim() || !newDatetime || creating}
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Reminder'}
                        </Button>
                    </div>
                </InnerCard>
            )}

            {reminders.length === 0 && !isAdding ? (
                <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No active reminders</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Use the widget or button above to set one
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {reminders.map((reminder) => (
                        <InnerCard
                            key={reminder.id}
                            className={`p-4 ${isOverdue(reminder.datetime) ? 'border-red-500/30' : isUpcoming(reminder.datetime) ? 'border-yellow-500/30' : ''}`}
                            padding="none"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-white truncate">
                                        {reminder.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock className={`w-3 h-3 ${isOverdue(reminder.datetime) ? 'text-red-400' : isUpcoming(reminder.datetime) ? 'text-yellow-400' : 'text-gray-500'}`} />
                                        <span className={`text-sm ${isOverdue(reminder.datetime) ? 'text-red-400' : isUpcoming(reminder.datetime) ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            {formatDateTime(reminder.datetime)}
                                        </span>
                                        {isOverdue(reminder.datetime) && (
                                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                                Overdue
                                            </span>
                                        )}
                                        {isUpcoming(reminder.datetime) && !isOverdue(reminder.datetime) && (
                                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                                Soon
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => markComplete(reminder.id)}
                                        className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                        title="Mark complete"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteReminder(reminder.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </InnerCard>
                    ))}
                </div>
            )}
        </div>
    );
}
