'use client';

import { useState, useEffect } from 'react';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';
import { Calendar as CalendarIcon, RefreshCw, ExternalLink, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import EventModal from '@/components/calendar/EventModal';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    source: string;
}

export default function CalendarWidget() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSynced, setIsSynced] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);

    const fetchEvents = async () => {
        try {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);

            const res = await fetch(`/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data);

                // Check if we have any Google events to confirm sync works
                setIsSynced(data.some((e: any) => e.source === 'GOOGLE'));
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    const syncCalendar = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/calendar/sync', { method: 'POST' });
            if (res.ok) {
                await fetchEvents();
            } else if (res.status === 401) {
                // Not connected, redirect to auth
                window.location.href = '/api/auth/google';
            }
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return (
        <GlassCard>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-[#139187]" />
                    <h3 className="font-semibold text-white">Today's Schedule</h3>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsEventModalOpen(true)}
                        className="p-1.5 hover:bg-white/5 rounded transition-colors text-gray-400 hover:text-[#139187]"
                        title="Quick Add Event"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={syncCalendar}
                        disabled={loading}
                        className={`p-1.5 hover:bg-white/5 rounded transition-colors ${loading ? 'animate-spin text-gray-500' : 'text-gray-400 hover:text-white'}`}
                        title="Sync with Google Calendar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {loading && events.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-sm">Loading schedule...</div>
                ) : events.length > 0 ? (
                    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).map((event) => (
                        <div key={event.id} className="flex gap-3 text-sm">
                            <div className="w-12 text-gray-500 font-mono text-xs pt-0.5">
                                {event.allDay ? 'All Day' : new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className={`flex-1 p-2 rounded border-l-2 ${event.source === 'LOCAL_TASK'
                                ? 'bg-blue-500/5 border-blue-500/50 text-blue-100'
                                : 'bg-[#139187]/5 border-[#139187]/50 text-emerald-100'
                                }`}>
                                {event.title}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-6 text-center">
                        <p className="text-gray-400 text-sm mb-3">No events scheduled for today</p>
                        {!isSynced && (
                            <Button size="sm" variant="secondary" icon={ExternalLink} onClick={syncCalendar}>
                                Connect Google Calendar
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSuccess={fetchEvents}
            />
        </GlassCard >
    );
}
