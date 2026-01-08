'use client';

import { ChevronLeft, ChevronRight, RefreshCw, Calendar as CalendarIcon, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { CalendarView } from '@/app/calendar/page';

interface Props {
    view: CalendarView;
    setView: (view: CalendarView) => void;
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    onSync: () => void;
    onNewEvent: () => void;
    loading: boolean;
    transparent?: boolean;
}

export default function CalendarController({ view, setView, currentDate, setCurrentDate, onSync, onNewEvent, loading, transparent }: Props) {
    // ... handlers ...
    const handlePrev = () => {
        const next = new Date(currentDate);
        if (view === 'month') next.setMonth(currentDate.getMonth() - 1);
        else if (view === 'week') next.setDate(currentDate.getDate() - 7);
        else next.setDate(currentDate.getDate() - 1);
        setCurrentDate(next);
    };

    const handleNext = () => {
        const next = new Date(currentDate);
        if (view === 'month') next.setMonth(currentDate.getMonth() + 1);
        else if (view === 'week') next.setDate(currentDate.getDate() + 7);
        else next.setDate(currentDate.getDate() + 1);
        setCurrentDate(next);
    };

    const formatDateRange = () => {
        if (view === 'month') {
            return currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
        }
        if (view === 'day') {
            return currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        }
        // Week view range
        const start = new Date(currentDate);
        start.setDate(currentDate.getDate() - currentDate.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    const Container = transparent ? 'div' : GlassCard;
    const containerProps = transparent ? { className: "!p-0 border-none bg-transparent w-full" } : { className: "!p-4 bg-white/5 border-white/10" };

    return (
        <Container {...containerProps}>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Navigation */}
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>
                        Today
                    </Button>
                    <div className="flex border border-white/10 rounded-lg bg-black/20 overflow-hidden">
                        <button onClick={handlePrev} className="p-2 hover:bg-white/5 transition-colors border-r border-white/10">
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <button onClick={handleNext} className="p-2 hover:bg-white/5 transition-colors">
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <h2 className="text-xl font-bold text-white min-w-[200px] px-4">
                        {formatDateRange()}
                    </h2>
                </div>

                {/* View Switcher & Sync */}
                <div className="flex items-center gap-4">
                    <Button
                        size="sm"
                        variant="primary"
                        icon={Plus}
                        onClick={onNewEvent}
                        className="shadow-luxury"
                    >
                        New Event
                    </Button>

                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                        {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 capitalize ${view === v
                                    ? 'bg-[#139187] text-white shadow-luxury'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={onSync}
                        disabled={loading}
                        className={`p-2 bg-white/5 rounded-xl border border-white/10 transition-all hover:border-[#139187]/50 ${loading ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw className="w-5 h-5 text-[#139187]" />
                    </button>
                </div>
            </div>
        </Container>
    );
}
