'use client';

import { useEffect, useRef } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useNotifications } from '../../hooks/useNotifications';

// Check interval in milliseconds (e.g., every minute)
const CHECK_INTERVAL = 60 * 1000;

export default function NotificationScheduler() {
    const { settings } = useSettings();
    const { showLocalNotification } = useNotifications();
    const lastCheckRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!settings.notifications.enabled) return;

        // Perform immediate check on mount
        checkNotifications();

        const intervalId = setInterval(() => {
            checkNotifications();
        }, CHECK_INTERVAL);

        return () => clearInterval(intervalId);
    }, [settings.notifications]);

    const checkNotifications = async () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // 1. Daily Plan Notification (e.g., at 8:00 AM)
        if (settings.notifications.types.dailyPlan) {
            const lastDailyPlanDate = localStorage.getItem('lastDailyPlanNotificationDate');
            const todayStr = now.toDateString();

            // Send if not sent today and it's after 8 AM
            if (lastDailyPlanDate !== todayStr && currentHour >= 8) {
                // Determine message based on tasks (mock logic for now, ideally fetch actual task count)
                // For MVP, we'll use a generic message or try to peek at tasks if possible.
                // Since this component might not have direct access to task state without context/props,
                // we'll fetch from API or use a generic "Check your plan".

                // Let's assume we can fetch task count or just show the prompt.
                await showLocalNotification('Daily Plan', {
                    body: "Good morning! It's time to plan your day. Check your tasks for today.",
                    tag: 'daily-plan',
                    data: { url: '/' }
                });

                localStorage.setItem('lastDailyPlanNotificationDate', todayStr);
            }
        }

        // 2. Weekly Review Notification (e.g., Sunday at 6 PM)
        if (settings.notifications.types.weeklyReview) {
            const lastWeeklyReviewDate = localStorage.getItem('lastWeeklyReviewNotificationDate');
            const todayStr = now.toDateString();

            // Send if it's Sunday (0) and after 6 PM (18)
            if (currentDay === 0 && currentHour >= 18 && lastWeeklyReviewDate !== todayStr) {
                await showLocalNotification('Weekly Review', {
                    body: "The week is over. Take a moment to review your progress.",
                    tag: 'weekly-review',
                    data: { url: '/weekly-review' }
                });
                localStorage.setItem('lastWeeklyReviewNotificationDate', todayStr);
            }
        }

        // 3. Task Due Date Notification
        // This is more complex as it requires checking all tasks continuously.
        // For efficiency, we should fetch tasks and find near-due ones.
        if (settings.notifications.types.taskDue) {
            // We'll implement a lightweight check here. 
            // Ideally, this should use a proper task context or API.
            // For now, let's verify if we can fetch tasks.
            try {
                // Fetch tasks from API to avoid context dependency loops if placed in layout
                // NOTE: This might be heavy if done every minute. 
                // Optimization: fetch only if last check was > 15 mins ago?
                // Let's rely on cached swr or just fetch.
                const res = await fetch('/api/tasks');
                if (res.ok) {
                    const tasks = await res.json();

                    // Filter for due date logic: 24h before
                    // Loop tasks and check if due time is within [now + 23.5h, now + 24.5h] to avoid double send?
                    // Better: check if due in < 24h AND not yet notified.

                    const notifiedTasks = JSON.parse(localStorage.getItem('notifiedTaskIds') || '[]');
                    const newNotifiedIds = [...notifiedTasks];
                    let hasUpdates = false;

                    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

                    for (const task of tasks) {
                        if (!task.dueDate) continue;
                        if (task.completed) continue;
                        if (newNotifiedIds.includes(task.id)) continue;

                        const dueDate = new Date(task.dueDate);

                        // Check if due within next 24 hours
                        const diffMs = dueDate.getTime() - now.getTime();
                        const isDueSoon = diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;

                        if (isDueSoon) {
                            await showLocalNotification('Task Due Soon', {
                                body: `Task "${task.title}" is due in less than 24 hours.`,
                                tag: `task-due-${task.id}`,
                                data: { url: '/tasks' }
                            });
                            newNotifiedIds.push(task.id);
                            hasUpdates = true;
                        }
                    }

                    if (hasUpdates) {
                        localStorage.setItem('notifiedTaskIds', JSON.stringify(newNotifiedIds));
                    }
                }
            } catch (error) {
                // console.error("Failed to check tasks for notifications", error);
            }
        }
    };

    return null; // Renderless component
}
