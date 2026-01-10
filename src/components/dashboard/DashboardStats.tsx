'use client';

import { useState, useEffect } from 'react';
import StatCard from '@/components/ui/StatCard';
import { CheckCircle2, Flame, Loader2 } from 'lucide-react';

export default function DashboardStats() {
    const [stats, setStats] = useState({ tasksToday: 0, habitStreak: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                    setError(false);
                } else {
                    setError(true);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        // Refresh every minute to keep counts accurate
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-lg p-4 border border-white/10 h-[100px] flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-[#139187] animate-spin" />
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-white/10 h-[100px] flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-[#139187] animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative mb-6">
            {error && (
                <div className="absolute -top-6 right-0 text-[10px] text-red-500/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Offline Mode
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                <StatCard label="Tasks Today" value={stats.tasksToday} icon={CheckCircle2} />
                <StatCard label="Habit Streak" value={stats.habitStreak} icon={Flame} />
            </div>
        </div>
    );
}
