import { useSession } from 'next-auth/react';
import { Bell, Shield, Volume2, Monitor, Copy, Check } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useNotifications } from '../../hooks/useNotifications';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SettingsContentProps {
    onClose?: () => void;
}

export default function SettingsContent({ onClose }: SettingsContentProps) {
    const { settings, updateNotificationPreferences } = useSettings();
    const { requestPermission } = useNotifications();
    const { data: session } = useSession();
    const [widgetToken, setWidgetToken] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState(false);
    const [isLoadingToken, setIsLoadingToken] = useState(false);
    const [reviewDay, setReviewDay] = useState(0);
    const [reviewHour, setReviewHour] = useState(18);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);

    // Fetch settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/user/settings');
                if (res.ok) {
                    const data = await res.json();
                    setReviewDay(data.reviewDayOfWeek);
                    setReviewHour(data.reviewTimeHour);
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const handleSaveSchedule = async () => {
        setIsSavingSchedule(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewDayOfWeek: reviewDay,
                    reviewTimeHour: reviewHour
                })
            });
            if (res.ok) {
                alert('Schedule updated!');
            }
        } catch (error) {
            console.error('Failed to save schedule:', error);
        } finally {
            setIsSavingSchedule(false);
        }
    };

    // Fetch widget token
    useEffect(() => {
        const fetchToken = async () => {
            try {
                const res = await fetch('/api/user/widget-token');
                if (res.ok) {
                    const data = await res.json();
                    setWidgetToken(data.widgetToken);
                }
            } catch (error) {
                console.error('Failed to fetch widget token:', error);
            }
        };
        fetchToken();
    }, []);

    const handleCopyId = () => {
        if (!widgetToken) return;
        navigator.clipboard.writeText(widgetToken);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    const handleResetToken = async () => {
        if (!confirm('This will invalidate your current widget. You will need to download and install the new script. Continue?')) {
            return;
        }
        setIsLoadingToken(true);
        try {
            const res = await fetch('/api/user/widget-token', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setWidgetToken(data.widgetToken);
                alert('Token reset! Please download the new script below.');
            }
        } catch (error) {
            console.error('Failed to reset token:', error);
        } finally {
            setIsLoadingToken(false);
        }
    };

    const handleTestNotification = async (type: string) => {
        const granted = await requestPermission();
        if (!granted) {
            alert('Notification permission denied!');
            return;
        }

        try {
            // Get the service worker registration and subscription
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                alert('No push subscription found. Please enable notifications first.');
                return;
            }

            // Fetch real notification content from API
            const previewRes = await fetch(`/api/notifications/preview?type=${type}`);
            if (!previewRes.ok) {
                throw new Error('Failed to generate notification preview');
            }
            const notification = await previewRes.json();

            // Send to existing working endpoint
            const res = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription.toJSON(), // Convert to plain object
                    notification
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            console.log('Test notification sent:', data);
        } catch (error) {
            console.error('Failed to trigger test notification:', error);
            alert('Failed to send test notification. Check console for details.');
        }
    };

    const handleResetSubscriptions = async () => {
        if (!confirm('This will delete all push subscriptions. You will need to re-enable notifications. Continue?')) {
            return;
        }
        try {
            // Call the unsubscribe endpoint to delete the subscription
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                const res = await fetch('/api/notifications/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
                await subscription.unsubscribe();
            }

            alert('Subscriptions cleared! Please re-enable notifications to create a fresh subscription.');
        } catch (error) {
            console.error('Failed to reset subscriptions:', error);
            alert('Failed to reset. Check console for details.');
        }
    };

    return (
        <div className="space-y-6">

            {/* General Section */}
            <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    General
                </h3>
                <div className="space-y-2">
                    <Link
                        href="/settings/appearance"
                        onClick={onClose}
                        className="w-full flex items-center justify-between rounded-xl bg-white/5 p-3 hover:bg-white/10 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                                <Monitor className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Appearance</span>
                                <span className="text-xs text-gray-500">Customize theme & background</span>
                            </div>
                        </div>
                        <span className="text-xs text-teal-400 font-medium">Open</span>
                    </Link>
                </div>
            </section>

            {/* Weekly Review Schedule */}
            <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Weekly Review Schedule
                </h3>
                <div className="rounded-xl bg-white/5 p-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-white">System Lock</span>
                            <span className="text-xs text-gray-400">Set when the weekly review lock activates</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Day of Week</label>
                            {/* @ts-ignore */}
                            <select
                                value={reviewDay}
                                onChange={(e) => setReviewDay(Number(e.target.value))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg text-sm text-white p-2 focus:border-[#139187] outline-none"
                            >
                                <option value={0}>Sunday</option>
                                <option value={1}>Monday</option>
                                <option value={2}>Tuesday</option>
                                <option value={3}>Wednesday</option>
                                <option value={4}>Thursday</option>
                                <option value={5}>Friday</option>
                                <option value={6}>Saturday</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Time</label>
                            {/* @ts-ignore */}
                            <select
                                value={reviewHour}
                                onChange={(e) => setReviewHour(Number(e.target.value))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg text-sm text-white p-2 focus:border-[#139187] outline-none"
                            >
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <option key={i} value={i}>
                                        {i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveSchedule}
                        disabled={isSavingSchedule}
                        className="w-full rounded-lg bg-[#139187] py-2 text-xs font-semibold text-white hover:bg-[#139187]/80 disabled:opacity-50 transition-colors"
                    >
                        {isSavingSchedule ? 'Saving...' : 'Update Schedule'}
                    </button>
                </div>
            </section>

            {/* Widgets Section */}
            <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Widgets
                </h3>
                <div className="rounded-xl bg-white/5 p-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                            <Monitor className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-white">iOS Widget</span>
                            <span className="text-xs text-gray-400">Using Scriptable App</span>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                    Secret Widget Token
                                </label>
                                <button
                                    onClick={handleResetToken}
                                    disabled={isLoadingToken}
                                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                >
                                    {isLoadingToken ? 'Resetting...' : 'Reset Token'}
                                </button>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 p-2 group">
                                <code className="flex-1 font-mono text-xs text-teal-400 break-all">
                                    {widgetToken ? widgetToken : '••••••••-••••-••••-••••-••••••••••••'}
                                </code>
                                <button
                                    onClick={handleCopyId}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-gray-400 hover:text-teal-400 transition-colors"
                                    title="Copy Token"
                                >
                                    {copiedId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 italic">
                                Keep this secret. This token grants access to your widget data.
                            </p>
                        </div>

                        <div className="space-y-2 text-xs text-gray-300 border-t border-white/5 pt-4">
                            <p>1. Install the <a href="https://scriptable.app" target="_blank" className="text-blue-400 underline" rel="noreferrer">Scriptable App</a> on iOS.</p>
                            <p>2. Download your **personalized script** below.</p>
                            <p>3. Create a new script in Scriptable and paste the code.</p>
                            <p>4. Add the Scriptable widget to your home screen.</p>
                        </div>

                        <a
                            href={widgetToken ? `/api/widgets/script?token=${widgetToken}` : '#'}
                            className={`flex items-center justify-center w-full rounded-lg py-2.5 text-xs font-semibold text-white transition-all shadow-lg active:scale-[0.98] ${widgetToken ? 'bg-[#139187] hover:bg-[#139187]/80' : 'bg-gray-700 cursor-not-allowed'}`}
                            onClick={(e) => !widgetToken && e.preventDefault()}
                        >
                            Download Personalized Script
                        </a>
                    </div>
                </div>
            </section>

            {/* Notifications Section */}
            <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Notifications
                </h3>

                {/* Master Toggle */}
                <div className="rounded-xl bg-white/5 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${settings.notifications.enabled ? 'bg-[#139187]/20 text-[#139187]' : 'bg-gray-800 text-gray-500'}`}>
                                <Bell className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-medium text-white">Enable Notifications</span>
                                    <span className="text-[10px] text-gray-500 font-mono">v1.9</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Receive alerts and updates</span>
                                    {/* Status Badge */}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeof Notification !== 'undefined' && Notification.permission === 'granted'
                                        ? 'border-green-500/30 text-green-400 bg-green-500/10'
                                        : typeof Notification !== 'undefined' && Notification.permission === 'denied'
                                            ? 'border-red-500/30 text-red-400 bg-red-500/10'
                                            : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                                        }`}>
                                        {typeof Notification === 'undefined'
                                            ? 'Unavailable'
                                            : Notification.permission === 'granted'
                                                ? 'Active'
                                                : Notification.permission === 'denied'
                                                    ? 'Blocked'
                                                    : 'Needs Permission'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => updateNotificationPreferences({ enabled: !settings.notifications.enabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#139187] focus:ring-offset-2 focus:ring-offset-black ${settings.notifications.enabled ? 'bg-[#139187]' : 'bg-gray-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.notifications.enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {settings.notifications.enabled && (
                        <div className="pt-4 border-t border-white/5 space-y-3">
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-400 mb-2">Notify me about</p>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-sm text-gray-300">Daily Plan</span>
                                    <button
                                        onClick={() => updateNotificationPreferences({
                                            types: {
                                                ...settings.notifications.types,
                                                dailyPlan: !settings.notifications.types.dailyPlan
                                            }
                                        })}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.notifications.types.dailyPlan ? 'bg-[#139187]' : 'bg-gray-700'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.notifications.types.dailyPlan ? 'translate-x-5' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-sm text-gray-300">Task Due Dates</span>
                                    <button
                                        onClick={() => updateNotificationPreferences({
                                            types: {
                                                ...settings.notifications.types,
                                                taskDue: !settings.notifications.types.taskDue
                                            }
                                        })}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.notifications.types.taskDue ? 'bg-[#139187]' : 'bg-gray-700'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.notifications.types.taskDue ? 'translate-x-5' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-sm text-gray-300">Weekly Review</span>
                                    <button
                                        onClick={() => updateNotificationPreferences({
                                            types: {
                                                ...settings.notifications.types,
                                                weeklyReview: !settings.notifications.types.weeklyReview
                                            }
                                        })}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.notifications.types.weeklyReview ? 'bg-[#139187]' : 'bg-gray-700'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.notifications.types.weeklyReview ? 'translate-x-5' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2 grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleTestNotification('daily_plan')}
                                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs transition-colors"
                                >
                                    <Monitor className="h-3 w-3" />
                                    Test Daily Plan
                                </button>
                                <button
                                    onClick={() => handleTestNotification('task_due')}
                                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs transition-colors"
                                >
                                    <Bell className="h-3 w-3" />
                                    Test Task Due
                                </button>
                                <button
                                    onClick={() => handleTestNotification('weekly_review')}
                                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs transition-colors"
                                >
                                    <Shield className="h-3 w-3" />
                                    Test Weekly Review
                                </button>
                                <button
                                    onClick={() => handleTestNotification('reminder')}
                                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs transition-colors"
                                >
                                    <Volume2 className="h-3 w-3" />
                                    Test Reminder
                                </button>
                            </div>

                            <button
                                onClick={handleResetSubscriptions}
                                className="w-full mt-3 rounded-lg bg-red-500/10 border border-red-500/20 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all cursor-pointer"
                            >
                                Reset Push Subscriptions
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
