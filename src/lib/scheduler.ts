
import cron from 'node-cron';
import { prisma } from '@/lib/db';
import { sendNotification } from './notifications';

let isSchedulerRunning = false;

export function initScheduler() {
    if (isSchedulerRunning) return;
    isSchedulerRunning = true;

    console.log('[Scheduler] Initializing automated workflows with Timezone support...');

    // ============================================
    // 1. TIMEZONE AWARE HOURLY CHECK
    // Runs every hour at minute 0 (e.g., 1:00, 2:00)
    // ============================================
    cron.schedule('0 * * * *', async () => {
        console.log('[Scheduler] Running hourly timezone checks...');
        try {
            const users = await prisma.user.findMany({
                include: { pushSubscriptions: true }
            });

            for (const user of users) {
                if (!user.pushSubscriptions.length) continue;

                const userTimezone = user.timezone || 'UTC';

                // Get user's local time
                const now = new Date();
                const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
                const userHour = userTime.getHours();
                const userDay = userTime.getDay(); // 0 = Sunday

                // --- DAILY BRIEFING (8:00 AM Local Time) ---
                if (userHour === 8) {
                    await sendDailyBriefing(user, userTimezone);
                }

                // --- WEEKLY REVIEW (Sunday 6:00 PM Local Time) ---
                if (userDay === 0 && userHour === 18) {
                    await sendWeeklyReview(user);
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error in hourly checks:', error);
        }
    });

    // ============================================
    // 2. DEADLINE MONITOR (Every Hour)
    // Checks for specific windows (e.g. 24h before)
    // ============================================
    cron.schedule('0 * * * *', async () => {
        try {
            const now = new Date();
            // Window: 24 hours from now (with 1 hour buffer)
            const startWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const endWindow = new Date(startWindow.getTime() + 60 * 60 * 1000); // +1 hour

            const tasksDueIn24h = await prisma.task.findMany({
                where: {
                    status: 'TODO',
                    dueDate: {
                        gte: startWindow,
                        lt: endWindow
                    }
                },
                include: {
                    user: { include: { pushSubscriptions: true } }
                }
            });

            for (const task of tasksDueIn24h) {
                for (const sub of task.user.pushSubscriptions) {
                    await sendNotification(sub, JSON.stringify({
                        title: '⏰ Task Due Tomorrow',
                        body: `"${task.title}" is due in 24 hours.`,
                        data: { url: '/tasks' }
                    }));
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error in Deadline Monitor:', error);
        }
    });

    // ============================================
    // 3. REMINDER MONITOR (Every 5 Minutes)
    // Checks for exact reminder times
    // ============================================
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();

            // Find uncompleted reminders that are due or past due
            const reminders = await prisma.reminder.findMany({
                where: {
                    completed: false,
                    datetime: { lte: now }
                },
                include: {
                    user: { include: { pushSubscriptions: true } }
                }
            });

            for (const reminder of reminders) {
                // Send notification
                for (const sub of reminder.user.pushSubscriptions) {
                    await sendNotification(sub, JSON.stringify({
                        title: '🔔 Reminder',
                        body: reminder.title,
                        data: { url: '/calendar' }
                    }));
                }

                // Mark as completed
                await prisma.reminder.update({
                    where: { id: reminder.id },
                    data: { completed: true }
                });
            }
        } catch (error) {
            console.error('[Scheduler] Error in Reminder Monitor:', error);
        }
    });
}

// Helper: Daily Briefing Logic
async function sendDailyBriefing(user: any, timezone: string) {
    // Get tasks for "today" in user's timezone
    const now = new Date();
    // Create Date objects representing the start and end of user's today in UTC
    // Logic: We want tasks where doToday=true OR dueDate is within user's today

    // Simplified: Just count 'doToday' items + Overdue items
    const tasks = await prisma.task.findMany({
        where: {
            userId: user.id,
            status: 'TODO',
            OR: [
                { doToday: true },
                // Ideally we check dueDate against user's local day, but doToday is the main "Plan" feature
            ]
        }
    });

    let title = '☀️ Good Morning!';
    let body = 'Your to-do list is empty. Take a moment to plan your day.';

    if (tasks.length > 0) {
        title = `☀️ Good Morning! You have ${tasks.length} tasks today.`;
        body = `Time to crush it! 🚀`;
    }

    for (const sub of user.pushSubscriptions) {
        await sendNotification(sub, JSON.stringify({
            title,
            body,
            data: { url: '/tasks' }
        }));
    }
}

// Helper: Weekly Review Logic
async function sendWeeklyReview(user: any) {
    for (const sub of user.pushSubscriptions) {
        await sendNotification(sub, JSON.stringify({
            title: '📅 Weekly Review Time',
            body: 'The week is over. Take 10 minutes to review your wins and plan for next week.',
            data: { url: '/weekly-review' }
        }));
    }
}
