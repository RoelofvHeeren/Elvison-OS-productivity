'use client';

import { useEffect, useRef } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useNotifications } from '../../hooks/useNotifications';

// Check interval in milliseconds (e.g., every minute)
const CHECK_INTERVAL = 60 * 1000;

export default function NotificationScheduler() {
    const { settings } = useSettings();
    const { showLocalNotification } = useNotifications();
    const lastCheckRef = useRef<number>(0);

    // Poll every minute
    useEffect(() => {
        if (!settings.notifications.enabled) return;

        const checkServer = async () => {
            // throttle checks to once per minute max
            if (Date.now() - lastCheckRef.current < 50000) return;
            lastCheckRef.current = Date.now();

            try {
                const res = await fetch('/api/notifications/poll');
                if (!res.ok) return;
                const data = await res.json();

                // 1. Handle Reminders
                if (data.reminders && data.reminders.length > 0) {
                    const completedIds = [];
                    for (const reminder of data.reminders) {
                        await showLocalNotification('🔔 Reminder', {
                            body: reminder.title,
                            tag: `reminder-${reminder.id}`,
                            data: { url: '/calendar' }
                        });
                        completedIds.push(reminder.id);
                    }

                    // Mark as seen
                    if (completedIds.length > 0) {
                        await fetch('/api/notifications/poll', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ reminderIds: completedIds })
                        });
                    }
                }

                // 2. Handle Daily Plan (8 AM Check)
                if (settings.notifications.types.dailyPlan) {
                    const now = new Date();
                    const hours = now.getHours();
                    const dateKey = now.toDateString();
                    const lastSent = localStorage.getItem('lastDailyPlanNotificationDate');

                    if (hours === 8 && lastSent !== dateKey && data.dailyTaskCount > 0) {
                        await showLocalNotification('Daily Plan', {
                            body: `Good morning! You have ${data.dailyTaskCount} tasks scheduled for today.`,
                            tag: 'daily-plan',
                            data: { url: '/' }
                        });
                        localStorage.setItem('lastDailyPlanNotificationDate', dateKey);
                    }
                }

                // 3. Handle Weekly Review (Sunday 6 PM Check)
                // Note: Logic for day/time preference should be handled here if flexible
                if (settings.notifications.types.weeklyReview) {
                    const now = new Date();
                    const day = now.getDay(); // 0 = Sunday
                    const hours = now.getHours();
                    const dateKey = now.toDateString();
                    const lastSent = localStorage.getItem('lastWeeklyReviewNotificationDate');

                    // Default Sunday 6PM (18:00)
                    // TODO: Use user preferences from settings if available in context
                    if (day === 0 && hours === 18 && lastSent !== dateKey) {
                        await showLocalNotification('Weekly Review', {
                            body: "The week is over. Take a moment to review your progress.",
                            tag: 'weekly-review',
                            data: { url: '/weekly-review' }
                        });
                        localStorage.setItem('lastWeeklyReviewNotificationDate', dateKey);
                    }
                }

                // 4. Handle Tasks Due Soon (24h alert)
                if (settings.notifications.types.taskDue && data.tasksDueSoon) {
                    const notifiedTasks = JSON.parse(localStorage.getItem('notifiedTaskIds') || '[]');
                    const newNotifiedIds = [...notifiedTasks];
                    let hasUpdates = false;

                    for (const task of data.tasksDueSoon) {
                        if (newNotifiedIds.includes(task.id)) continue;

                        await showLocalNotification('⏰ Task Due Tomorrow', {
                            body: `"${task.title}" is due in 24 hours.`,
                            tag: `task-due-${task.id}`,
                            data: { url: '/tasks' }
                        });
                        newNotifiedIds.push(task.id);
                        hasUpdates = true;
                    }

                    if (hasUpdates) {
                        localStorage.setItem('notifiedTaskIds', JSON.stringify(newNotifiedIds));
                    }
                }

            } catch (e) {
                console.error('[Scheduler] Poll failed:', e);
            }
        };

        checkServer(); // Initial check
        const interval = setInterval(checkServer, 60 * 1000); // Poll every minute
        return () => clearInterval(interval);

    }, [settings.notifications]);

    return null;
}
