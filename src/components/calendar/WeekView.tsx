'use client';

import { useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';

interface Props {
    currentDate: Date;
    events: any[];
    onEventClick: (event: any) => void;
    onEventDrop: (event: any, date: Date, hour: number) => void;
    onSlotClick: (date: Date) => void;
}

export default function WeekView({ currentDate, events, onEventClick, onEventDrop, onSlotClick }: Props) {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    useEffect(() => {
        // Auto-scroll to current time or 9 AM
        const currentHour = new Date().getHours();
        // Priority: Current time -> 9 AM -> 12 AM
        const targetHour = currentHour > 5 && currentHour < 22 ? currentHour : 9;
        const el = document.getElementById(`week-hour-${targetHour}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []);

    const handleDragStart = (e: React.DragEvent, event: any) => {
        e.dataTransfer.setData('application/json', JSON.stringify(event));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, date: Date, hour: number) => {
        e.preventDefault();
        const eventData = e.dataTransfer.getData('application/json');
        if (eventData) {
            const event = JSON.parse(eventData);
            onEventDrop(event, date, hour);
        }
    };

    const handleSlotClick = (date: Date, hour: number) => {
        // Create a new date object with the specific hour
        const clickDate = new Date(date);
        clickDate.setHours(hour, 0, 0, 0);
        onSlotClick(clickDate);
    };

    return (
        <GlassCard className="!p-0 border-white/10 overflow-hidden bg-black/40">
            <div className="flex">
                {/* Time column header */}
                <div className="w-16 border-r border-white/10 bg-white/[0.02]"></div>

                {/* Days header */}
                {weekDays.map(date => {
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                        <div key={date.toISOString()} className="flex-1 py-4 text-center border-r border-white/5 bg-white/[0.02]">
                            <div className="text-xs font-bold text-[#139187] uppercase tracking-widest mb-1">
                                {date.toLocaleDateString('default', { weekday: 'short' })}
                            </div>
                            <div className={`inline-flex items-center justify-center w-8 h-8 text-lg rounded-full transition-all ${isToday ? 'bg-[#139187] text-white shadow-luxury font-bold' : 'text-gray-300'
                                }`}>
                                {date.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="overflow-y-auto max-h-[800px] custom-scrollbar">
                {hours.map(hour => (
                    <div key={hour} id={`week-hour-${hour}`} className="flex border-b border-white/[0.03]">
                        {/* Hour label */}
                        <div className="w-16 h-20 flex justify-center text-[10px] text-gray-500 font-mono pr-2 pt-1 border-r border-white/10 shrink-0">
                            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>

                        {/* Day slots */}
                        {weekDays.map(date => {
                            const hourEvents = events.filter(e => {
                                const start = new Date(e.start);
                                return start.toDateString() === date.toDateString() && start.getHours() === hour;
                            });

                            return (
                                <div
                                    key={date.toISOString()}
                                    className="flex-1 h-20 border-r border-white/[0.03] group transition-colors hover:bg-white/[0.02] p-1 space-y-1 relative cursor-pointer"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, date, hour)}
                                    onClick={() => handleSlotClick(date, hour)}
                                >
                                    {hourEvents.map(event => (
                                        <div
                                            key={event.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, event)}
                                            onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                            className={`p-1.5 rounded border-l-2 text-[10px] leading-tight cursor-pointer shadow-sm hover:shadow-md transition-shadow active:opacity-50 ${event.source === 'LOCAL_TASK'
                                                ? 'bg-blue-500/10 border-blue-500/50 text-blue-200'
                                                : 'bg-[#139187]/10 border-[#139187]/50 text-emerald-200'
                                                }`}
                                        >
                                            <div className="font-bold truncate">
                                                {event.source === 'LOCAL_TASK' ? 'Task' : 'Event'}
                                            </div>
                                            {!event.allDay && (
                                                <div className="opacity-60 text-[8px]">
                                                    {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </GlassCard>
    );
}
