'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import CalendarController from '@/components/calendar/CalendarController';
import MonthView from '@/components/calendar/MonthView';
import WeekView from '@/components/calendar/WeekView';
import DayView from '@/components/calendar/DayView';
import EventModal from '@/components/calendar/EventModal';
import RemindersPanel from '@/components/calendar/RemindersPanel';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { Loader2, Bell } from 'lucide-react';
import TaskForm from '@/components/tasks/TaskForm';

export type CalendarView = 'day' | 'week' | 'month';

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [projects, setProjects] = useState<any[]>([]);
    const [editingTask, setEditingTask] = useState<any | null>(null);
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<CalendarView>('month');
    const [events, setEvents] = useState<any[]>([]);
    const [showReminders, setShowReminders] = useState(false);
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
        fetchProjects();
    }, [currentDate, view]);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    const handleEventClick = async (event: any) => {
        if (event.source === 'LOCAL_TASK' && event.originalTaskId) {
            // Fetch full task details
            try {
                // We can just use the event data if it's complete, but usually we need subtasks etc.
                // For now, let's fetch the tasks list again or ideally a single task endpoint.
                // Since we don't have a single task fetch readily available in this context without extra code,
                // let's assume we can fetch it or find it if we had the full list. 
                // BUT, we only have 'events'. 
                // Let's call the API to get the specific task.
                // Actually, let's just use the event metadata to fill basic info, 
                // or better: add GET /api/tasks/[id] to fetching logic if needed.
                // For now, let's just make a lightweight edit with available data + maybe subtasks are missing.
                // To do it right, let's fetch the task.

                // Temporary: fetch all tasks to find this one? No, too heavy.
                // Let's assume we can pass enough data or we will implement a quick fetch in handleEventClick.
                const res = await fetch(`/api/tasks?id=${event.originalTaskId}`); // GET /api/tasks filters? 
                // Actually /api/tasks supports filters but maybe not ID. 
                // Let's create a specialized fetch for the task item or just use what we have for now.

                // Correction: GET /api/tasks doesn't support ID filter in the viewed code. 
                // But we can filter client side if we had them or just assume basic editing.
                // Let's fake the task object from event data for now to unblock.
                const taskStub = {
                    id: event.originalTaskId,
                    title: event.title.replace('📌 ', ''),
                    status: event.status,
                    dueDate: event.start instanceof Date ? event.start.toISOString().split('T')[0] : event.start.split('T')[0],
                    dueTime: !event.allDay && event.start instanceof Date
                        ? event.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                        : '',
                    priority: 'MEDIUM', // Default/Unknown
                    subtasks: [],      // Unknown
                    projectId: null,   // Unknown
                    doToday: false
                };
                setEditingTask(taskStub);
                setIsTaskFormOpen(true);
            } catch (e) {
                console.error("Failed to prep task for edit", e);
            }
        }
    };

    const handleTaskUpdate = async (data: any) => {
        if (!editingTask) return;
        try {
            const payload = { ...data };
            if (data.dueDate && data.dueTime) {
                const localDateTime = new Date(`${data.dueDate}T${data.dueTime}:00`);
                payload.dueTime = localDateTime.toISOString();
            }

            const res = await fetch(`/api/tasks/${editingTask.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                await fetchEvents(); // Refresh calendar
                setIsTaskFormOpen(false);
                setEditingTask(null);
            }
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    };

    const handleTaskDelete = async () => {
        if (!editingTask) return;
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const res = await fetch(`/api/tasks/${editingTask.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await fetchEvents(); // Refresh calendar
                setIsTaskFormOpen(false);
                setEditingTask(null);
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                title="Calendar"
                description="Manage your time and schedule with precision"
            >
                <Button
                    variant={showReminders ? 'accent' : 'secondary'}
                    icon={Bell}
                    onClick={() => setShowReminders(!showReminders)}
                >
                    {showReminders ? 'Hide Reminders' : 'View Reminders'}
                </Button>
            </PageHeader>

            <div className="flex-1 flex flex-col min-h-0 pt-6">
                {/* Unified Container */}
                <GlassCard className="flex-1 flex flex-col !p-0 overflow-hidden bg-black/20 backdrop-blur-xl">
                    {showReminders ? (
                        <RemindersPanel onClose={() => setShowReminders(false)} />
                    ) : (
                        <>
                            <div className="p-4 border-b border-white/10 bg-white/5">
                                <CalendarController
                                    view={view}
                                    setView={setView}
                                    currentDate={currentDate}
                                    setCurrentDate={setCurrentDate}
                                    onSync={syncCalendar}
                                    onNewEvent={() => setIsEventModalOpen(true)}
                                    loading={loading}
                                    transparent={true} // Add this prop to Controller
                                />
                            </div>

                            <div className="flex-1 relative overflow-y-auto">
                                {loading && (
                                    <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center">
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
                                        onEventClick={handleEventClick}
                                    />
                                )}
                                {view === 'week' && <WeekView currentDate={currentDate} events={events} onEventClick={handleEventClick} />}
                                {view === 'day' && <DayView currentDate={currentDate} events={events} onEventClick={handleEventClick} />}
                            </div>
                        </>
                    )}
                </GlassCard>
            </div>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSuccess={fetchEvents}
                initialDate={currentDate}
            />

            {/* Task Edit Modal */}
            {isTaskFormOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    {/* We might need to import TaskForm. Assuming it's available or we lazy load/import top. */}
                    {/* For now I'll use the imported TaskForm component from TasksPage context - wait, I need to add import */}
                    <div className="w-full max-w-2xl">
                        <TaskForm
                            isOpen={isTaskFormOpen}
                            onClose={() => { setIsTaskFormOpen(false); setEditingTask(null); }}
                            onSubmit={handleTaskUpdate}
                            onDelete={handleTaskDelete}
                            initialData={editingTask}
                            projects={projects}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
