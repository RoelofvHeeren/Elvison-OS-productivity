'use client';

import { useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';

interface Props {
    currentDate: Date;
    events: any[];
    onEventClick: (event: any) => void;
    onEventDrop: (event: any, period: number) => void; // period is the hour
    onSlotClick: (date: Date) => void;
}

export default function DayView({ currentDate, events, onEventClick, onEventDrop, onSlotClick }: Props) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = events.filter(e => new Date(e.start).toDateString() === currentDate.toDateString());

    useEffect(() => {
        // Auto-scroll to current time or 9 AM
        const currentHour = new Date().getHours();
        const targetHour = currentHour > 5 && currentHour < 22 ? currentHour : 9;
        const el = document.getElementById(`day-hour-${targetHour}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentDate]); // Re-run when date changes

    const handleDragStart = (e: React.DragEvent, event: any) => {
        e.dataTransfer.setData('application/json', JSON.stringify(event));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, hour: number) => {
        e.preventDefault();
        const eventData = e.dataTransfer.getData('application/json');
        if (eventData) {
            const event = JSON.parse(eventData);
            onEventDrop(event, hour);
        }
    };

    const handleSlotClick = (hour: number) => {
        const clickDate = new Date(currentDate);
        clickDate.setHours(hour, 0, 0, 0);
        onSlotClick(clickDate);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
                <GlassCard className="!p-0 border-white/10 overflow-hidden bg-black/40 h-full flex flex-col">
                    {/* Header */}
                    <div className="py-4 text-center border-b border-white/10 bg-white/[0.02]">
                        <div className="text-sm font-bold text-[#139187] uppercase tracking-widest mb-1">
                            {currentDate.toLocaleDateString('default', { weekday: 'long' })}
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {currentDate.getDate()} {currentDate.toLocaleDateString('default', { month: 'long' })}
                        </div>
                    </div>

                    {/* Time Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {hours.map(hour => {
                            const hourEvents = events.filter(e => {
                                const start = new Date(e.start);
                                return start.toDateString() === currentDate.toDateString() && start.getHours() === hour;
                            });

                            return (
                                <div
                                    key={hour}
                                    id={`day-hour-${hour}`}
                                    className="flex border-b border-white/[0.03] min-h-[100px]"
                                >
                                    {/* Time Label */}
                                    <div className="w-20 py-2 flex justify-center text-xs text-gray-500 font-mono border-r border-white/10 bg-white/[0.01]">
                                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                                    </div>

                                    {/* Event Slot */}
                                    <div
                                        className="flex-1 p-2 space-y-2 group hover:bg-white/[0.02] transition-colors relative cursor-pointer"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, hour)}
                                        onClick={() => handleSlotClick(hour)}
                                    >
                                        {hourEvents.map(event => (
                                            <div
                                                key={event.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, event)}
                                                onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                                className={`p-3 rounded-lg border-l-4 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer active:opacity-50 ${event.source === 'LOCAL_TASK'
                                                    ? 'bg-blue-500/10 border-blue-500 backdrop-blur-md'
                                                    : 'bg-[#139187]/10 border-[#139187] backdrop-blur-md'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${event.source === 'LOCAL_TASK' ? 'text-blue-200' : 'text-emerald-200'
                                                        }`}>
                                                        {event.source === 'LOCAL_TASK' ? 'Task' : 'Event'}
                                                    </span>
                                                    {!event.allDay && (
                                                        <span className="text-xs text-white/60 font-mono">
                                                            {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-semibold text-white text-sm">
                                                    {event.title}
                                                </div>
                                                {event.description && (
                                                    <div className="text-xs text-white/50 mt-1 line-clamp-2">
                                                        {event.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
            </div>

            <div className="space-y-6">
                <GlassCard className="bg-gradient-to-br from-[#139187]/20 to-transparent border-[#139187]/20">
                    <h4 className="text-sm font-bold text-[#139187] uppercase tracking-wider mb-4">Agenda</h4>
                    <div className="space-y-4">
                        {dayEvents.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">Nothing scheduled</p>
                        ) : (
                            dayEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).map(event => (
                                <div
                                    key={event.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, event)}
                                    className="border-l-2 border-white/10 pl-3 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors active:opacity-50"
                                    onClick={() => onEventClick(event)}
                                >
                                    <div className="text-[10px] text-gray-500 font-mono mb-0.5">
                                        {event.allDay ? 'All Day' : new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-sm text-white font-medium">{event.title}</div>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
