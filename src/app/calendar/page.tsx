'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import CalendarController from '@/components/calendar/CalendarController';
import MonthView from '@/components/calendar/MonthView';
import WeekView from '@/components/calendar/WeekView';
import DayView from '@/components/calendar/DayView';
import EventModal from '@/components/calendar/EventModal';
import { Loader2 } from 'lucide-react';

export type CalendarView = 'day' | 'week' | 'month';

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<CalendarView>('month');
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            // Fetch a wide range for month view, or narrow for day/week
            let start, end;
            if (view === 'month') {
                start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            } else if (view === 'week') {
                start = new Date(currentDate);
                start.setDate(currentDate.getDate() - currentDate.getDay());
                end = new Date(start);
                end.setDate(start.getDate() + 6);
            } else {
                start = new Date(currentDate);
                end = new Date(currentDate);
            }

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            const res = await fetch(`/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
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
    }, [currentDate, view]);

    return (
        <main className="flex-1 p-8 overflow-y-auto min-h-screen bg-black">
            <PageHeader
                title="Calendar"
                description="Manage your time and schedule with precision"
            />

            <CalendarController
                view={view}
                setView={setView}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                onSync={syncCalendar}
                onNewEvent={() => setIsEventModalOpen(true)}
                loading={loading}
            />

            <div className="mt-12 relative min-h-[600px]">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                        <Loader2 className="w-8 h-8 text-[#139187] animate-spin" />
                    </div>
                )}

                {view === 'month' && (
                    <MonthView
                        currentDate={currentDate}
                        events={events}
                        onDateClick={(date: Date) => {
                            setCurrentDate(date);
                            setView('day');
                        }}
                    />
                )}
                {view === 'week' && <WeekView currentDate={currentDate} events={events} />}
                {view === 'day' && <DayView currentDate={currentDate} events={events} />}
            </div>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSuccess={fetchEvents}
                initialDate={currentDate}
            />
        </main>
    );
}
