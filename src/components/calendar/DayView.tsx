'use client';

import { useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';

interface Props {
    currentDate: Date;
    events: any[];
    onEventClick: (event: any) => void;
    onEventDrop: (event: any, date: Date, hour: number) => void;
}

export default function DayView({ currentDate, events, onEventClick, onEventDrop }: Props) {
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
    }, []);

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
            onEventDrop(event, currentDate, hour);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
                <GlassCard className="!p-0 border-white/10 overflow-hidden bg-black/40">
                    <div className="overflow-y-auto max-h-[800px] custom-scrollbar">
                        {hours.map(hour => {
                            const hourEvents = dayEvents.filter(e => new Date(e.start).getHours() === hour);

                            return (
                                <div
                                    key={hour}
                                    id={`day-hour-${hour}`}
                                    className="flex border-b border-white/[0.03]"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, hour)}
                                >
                                    <div className="w-20 h-24 flex justify-center text-xs text-gray-400 font-mono pr-4 pt-4 border-r border-white/10 shrink-0 bg-white/[0.02]">
                                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                                    </div>

                                    <div className="flex-1 p-3 space-y-2 group transition-colors hover:bg-white/[0.02]">
                                        {hourEvents.map(event => (
                                            <div
                                                key={event.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, event)}
                                                onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                                className={`p-3 rounded-xl border-l-4 shadow-luxury transition-transform hover:scale-[1.01] cursor-pointer active:opacity-50 ${event.source === 'LOCAL_TASK'
                                                    ? 'bg-blue-500/5 border-blue-500/50 text-blue-100'
                                                    : 'bg-[#139187]/5 border-[#139187]/50 text-emerald-100'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold">{event.title}</span>
                                                    {!event.allDay && (
                                                        <span className="text-[10px] font-mono opacity-60">
                                                            {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {' - '}
                                                            {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs opacity-60">
                                                    {event.source === 'GOOGLE' ? 'Google Calendar' : 'Local Task'}
                                                </div>
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
