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

    // Monday Start Logic
    // getDay(): Sun=0, Mon=1...Sat=6
    // We want Mon=0, ... Sun=6
    const firstDay = new Date(year, month, 1).getDay();
    const startDay = (firstDay + 6) % 7; // Convert to Mon-start index

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = startDay - 1; i >= 0; i--) {
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

    // Next month padding
    const remaining = 42 - days.length; // 6 rows * 7 cols
    for (let i = 1; i <= remaining; i++) {
        days.push({
            day: i,
            date: new Date(year, month + 1, i),
            currentMonth: false
        });
    }

    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="bg-transparent">
            {/* Scroll Container for Mobile */}
            <div className="overflow-x-auto">
                <div className="min-w-[600px] md:min-w-0">
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
                            const taskCount = dayEvents.filter(e => e.source === 'LOCAL_TASK').length;
                            const eventCount = dayEvents.length - taskCount;

                            return (
                                <div
                                    key={i}
                                    onClick={() => onDateClick(d.date)}
                                    className={`min-h-[80px] p-2 border-r border-b border-white/5 transition-colors hover:bg-white/[0.03] cursor-pointer group ${!d.currentMonth ? 'opacity-30' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`flex items-center justify-center w-7 h-7 text-sm rounded-full transition-all ${isToday ? 'bg-[#139187] text-white shadow-luxury font-bold' : 'text-gray-400 group-hover:text-white'
                                            }`}>
                                            {d.day}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        {eventCount > 0 && (
                                            <div className="px-2 py-1 text-[10px] rounded-full bg-[#139187]/20 text-[#139187] font-medium border border-[#139187]/20 truncate">
                                                {eventCount} event{eventCount > 1 ? 's' : ''}
                                            </div>
                                        )}
                                        {taskCount > 0 && (
                                            <div className="px-2 py-1 text-[10px] rounded-full bg-blue-500/10 text-blue-300 font-medium border border-blue-500/20 truncate">
                                                {taskCount} task{taskCount > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
