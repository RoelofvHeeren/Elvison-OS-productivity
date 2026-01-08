'use client';

import { X, Bell, Moon, Shield, Volume2, Monitor } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useNotifications } from '../../hooks/useNotifications';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { settings, updateNotificationPreferences } = useSettings();
    const { requestPermission, showLocalNotification } = useNotifications();

    if (!isOpen) return null;

    const handleTestNotification = async () => {
        const granted = await requestPermission();
        if (granted) {
            showLocalNotification('Test Notification', {
                body: 'This is a test notification from Elvison OS.',
            });
        } else {
            alert('Notification permission denied. Please enable notifications in your browser settings.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#0F0F11] border border-white/10 shadow-luxury flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 p-4 bg-[#141416]">
                    <h2 className="text-lg font-serif font-bold text-white">Settings</h2>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* General Section */}
                    {/* <section className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            General
                        </h3>
                        <div className="space-y-2">
                             Placeholder for Theme/Display settings 
                             <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                                        <Monitor className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white">Appearance</span>
                                        <span className="text-xs text-gray-500">Dark Mode</span>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-600">Locked</span>
                            </div> 
                        </div>
                    </section> */}

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
                                        <span className="font-medium text-white">Enable Notifications</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">Receive alerts and updates</span>
                                            {/* Status Badge */}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${Notification.permission === 'granted'
                                                    ? 'border-green-500/30 text-green-400 bg-green-500/10'
                                                    : Notification.permission === 'denied'
                                                        ? 'border-red-500/30 text-red-400 bg-red-500/10'
                                                        : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                                                }`}>
                                                {Notification.permission === 'granted' ? 'Active' : Notification.permission === 'denied' ? 'Blocked' : 'Needs Permission'}
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

                                    <button
                                        onClick={handleTestNotification}
                                        className="w-full mt-2 rounded-lg bg-white/5 py-2 text-xs font-medium text-[#139187] hover:bg-white/10 transition-colors"
                                    >
                                        Send Test Notification
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="border-t border-white/10 p-4 bg-[#141416] text-center">
                    <p className="text-[10px] text-gray-600">Elvison OS Settings v1.0</p>
                </div>
            </div>
        </div>
    );
}
