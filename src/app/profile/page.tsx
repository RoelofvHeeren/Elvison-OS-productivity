'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import {
    User,
    Flame,
    TrendingUp,
    Calendar,
    LogOut,
    Loader2,
    Mail,
} from 'lucide-react';

interface ProfileStats {
    user: {
        name: string;
        email: string;
        timezone: string;
    };
    habitStreak: number;
    weeklyTaskCompletion: number | null;
    monthlyTaskCompletion: number | null;
    weeklyTasksCompleted: number;
    weeklyTasksTotal: number;
    monthlyTasksCompleted: number;
    monthlyTasksTotal: number;
    hasData: boolean;
}

export default function ProfilePage() {
    const [stats, setStats] = useState<ProfileStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    const [updatingTimezone, setUpdatingTimezone] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/profile/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch profile stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTimezone = e.target.value;
        setUpdatingTimezone(true);
        try {
            const res = await fetch('/api/user/timezone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timezone: newTimezone }),
            });

            if (res.ok) {
                setStats(prev => prev ? {
                    ...prev,
                    user: { ...prev.user, timezone: newTimezone }
                } : null);
            }
        } catch (error) {
            console.error('Failed to update timezone:', error);
        } finally {
            setUpdatingTimezone(false);
        }
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        await signOut({ callbackUrl: '/login' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-[#139187]" />
            </div>
        );
    }

    // Get all supported timezones
    const supportedTimezones = Intl.supportedValuesOf('timeZone');

    return (
        <div className="space-y-6">
            <PageHeader
                title="Profile"
                description="Your stats and account settings"
            />

            {/* User Info Card */}
            <GlassCard className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#139187] to-[#0d6b64] flex items-center justify-center">
                            <User className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {stats?.user.name || 'User'}
                            </h2>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Mail className="h-4 w-4" />
                                <span>{stats?.user.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                            <Calendar className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-400 font-medium mb-1">Timezone</label>
                            <div className="relative">
                                <select
                                    value={stats?.user.timezone || 'UTC'}
                                    onChange={handleTimezoneChange}
                                    disabled={updatingTimezone}
                                    className="appearance-none bg-transparent text-sm text-white font-medium focus:outline-none cursor-pointer pr-6 min-w-[200px]"
                                >
                                    {supportedTimezones.map(tz => (
                                        <option key={tz} value={tz} className="bg-[#1a1a1a] text-white">
                                            {tz.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                {updatingTimezone && (
                                    <div className="absolute right-0 top-0 bottom-0 flex items-center">
                                        <Loader2 className="h-3 w-3 animate-spin text-[#139187]" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Habit Streak */}
                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <Flame className="h-5 w-5 text-orange-400" />
                        </div>
                        <span className="text-gray-400 font-medium">Habit Streak</span>
                    </div>
                    {stats?.hasData ? (
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white">
                                {stats.habitStreak}
                            </span>
                            <span className="text-gray-500">days</span>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">
                            Complete habits to start your streak!
                        </p>
                    )}
                </GlassCard>

                {/* Weekly Completion */}
                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-[#139187]/20 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-[#139187]" />
                        </div>
                        <span className="text-gray-400 font-medium">Weekly Completion</span>
                    </div>
                    {stats?.weeklyTaskCompletion !== null && stats?.weeklyTaskCompletion !== undefined ? (
                        <>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-bold text-white">
                                    {stats?.weeklyTaskCompletion ?? 0}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#139187] to-[#17b5a8] rounded-full transition-all duration-500"
                                    style={{ width: `${stats?.weeklyTaskCompletion ?? 0}%` }}
                                />
                            </div>
                            <p className="text-gray-500 text-sm mt-2">
                                {stats?.weeklyTasksCompleted ?? 0} of {stats?.weeklyTasksTotal ?? 0} tasks (last 7 days)
                            </p>
                        </>
                    ) : (
                        <p className="text-gray-500 text-sm">
                            Stats will populate as you complete tasks with due dates.
                        </p>
                    )}
                </GlassCard>

                {/* Monthly Completion */}
                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-purple-400" />
                        </div>
                        <span className="text-gray-400 font-medium">Monthly Completion</span>
                    </div>
                    {stats?.monthlyTaskCompletion !== null && stats?.monthlyTaskCompletion !== undefined ? (
                        <>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-bold text-white">
                                    {stats?.monthlyTaskCompletion ?? 0}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                                    style={{ width: `${stats?.monthlyTaskCompletion ?? 0}%` }}
                                />
                            </div>
                            <p className="text-gray-500 text-sm mt-2">
                                {stats?.monthlyTasksCompleted ?? 0} of {stats?.monthlyTasksTotal ?? 0} tasks (last 30 days)
                            </p>
                        </>
                    ) : (
                        <p className="text-gray-500 text-sm">
                            Stats will populate as you complete tasks with due dates.
                        </p>
                    )}
                </GlassCard>
            </div>

            {/* New User Message */}
            {!stats?.hasData && (
                <GlassCard className="p-6 border border-[#139187]/30">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-[#139187]/20 flex items-center justify-center shrink-0">
                            <TrendingUp className="h-5 w-5 text-[#139187]" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium mb-1">Welcome to Elvison!</h3>
                            <p className="text-gray-400 text-sm">
                                Your statistics will populate as you complete tasks and build habits.
                                Start by creating your first habit or task to see your progress here.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Logout Button */}
            <GlassCard className="p-6">
                <Button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                >
                    {loggingOut ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Logging out...
                        </>
                    ) : (
                        <>
                            <LogOut className="h-4 w-4 mr-2" />
                            Log Out
                        </>
                    )}
                </Button>
            </GlassCard>
        </div>
    );
}
