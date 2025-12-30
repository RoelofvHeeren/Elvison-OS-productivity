'use client';

import GlassCard from '@/components/ui/GlassCard';

interface Props {
    currentDate: Date;
    events: any[];
    onDateClick: (date: Date) => void;
}

export default function MonthView({ currentDate, events, onDateClick }: Props) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        days.push({
            day: prevMonthDays - i,
            date: new Date(year, month - 1, prevMonthDays - i),
            currentMonth: false
        });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({
            day: i,
            date: new Date(year, month, i),
            currentMonth: true
        });
    }

    // Next month padding to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({
            day: i,
            date: new Date(year, month + 1, i),
            currentMonth: false
        });
    }

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <GlassCard className="!p-0 border-white/10 overflow-hidden bg-black/20">
            <div className="grid grid-cols-7 border-b border-white/10">
                {weekdays.map(day => (
                    <div key={day} className="py-4 text-center text-xs font-bold text-[#139187] uppercase tracking-widest bg-white/[0.02]">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {days.map((d, i) => {
                    const isToday = new Date().toDateString() === d.date.toDateString();
                    const dayEvents = events.filter(e => new Date(e.start).toDateString() === d.date.toDateString());

                    return (
                        <div
                            key={i}
                            onClick={() => onDateClick(d.date)}
                            className={`min-h-[120px] p-2 border-r border-b border-white/5 transition-colors hover:bg-white/[0.03] cursor-pointer group ${!d.currentMonth ? 'opacity-30' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`flex items-center justify-center w-7 h-7 text-sm rounded-full transition-all ${isToday ? 'bg-[#139187] text-white shadow-luxury font-bold' : 'text-gray-400 group-hover:text-white'
                                    }`}>
                                    {d.day}
                                </span>
                            </div>

                            <div className="space-y-1">
                                {dayEvents.slice(0, 3).map((event, idx) => (
                                    <div
                                        key={event.id}
                                        className={`px-1.5 py-0.5 text-[10px] rounded border-l-2 truncate ${event.source === 'LOCAL_TASK'
                                                ? 'bg-blue-500/10 border-blue-500/50 text-blue-200'
                                                : 'bg-[#139187]/10 border-[#139187]/50 text-emerald-200'
                                            }`}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-[10px] text-gray-500 pl-1 font-medium">
                                        + {dayEvents.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </GlassCard>
    );
}
