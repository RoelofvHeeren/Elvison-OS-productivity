
import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { sendNotification } from './notifications';

let isSchedulerRunning = false;

export function initScheduler() {
    if (isSchedulerRunning) return;
    isSchedulerRunning = true;

    console.log('[Scheduler] Initializing automated workflows...');

    // ============================================
    // 1. DAILY MORNING BRIEFING (8:00 AM)
    // ============================================
    cron.schedule('0 8 * * *', async () => {
        console.log('[Scheduler] Running Daily Briefing...');
        try {
            const users = await prisma.user.findMany({
                include: { pushSubscriptions: true }
            });

            for (const user of users) {
                if (!user.pushSubscriptions.length) continue;

                // Get tasks for today
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const tasks = await prisma.task.findMany({
                    where: {
                        userId: user.id,
                        status: 'TODO',
                        OR: [
                            { doToday: true },
                            { dueDate: { gte: today, lt: tomorrow } }
                        ]
                    },
                    orderBy: { priority: 'asc' } // HIGH first (enum order)
                });

                let title = '';
                let body = '';

                if (tasks.length > 0) {
                    const topTask = tasks[0];
                    title = `☀️ Good Morning! You have ${tasks.length} tasks today.`;
                    body = `Top priority: ${topTask.title}. Let's crush it!`;
                } else {
                    title = '☀️ Good Morning!';
                    body = 'Your to-do list is empty. Take a moment to plan your day.';
                }

                // Send to all user devices
                for (const sub of user.pushSubscriptions) {
                    await sendNotification(sub, JSON.stringify({
                        title,
                        body,
                        url: '/'
                    }));
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error in Daily Briefing:', error);
        }
    });

    // ============================================
    // 2. WEEKLY REVIEW REMINDER (Sunday 8:00 PM)
    // ============================================
    cron.schedule('0 20 * * 0', async () => {
        console.log('[Scheduler] Running Weekly Review Reminder...');
        try {
            const users = await prisma.user.findMany({
                include: { pushSubscriptions: true }
            });

            for (const user of users) {
                for (const sub of user.pushSubscriptions) {
                    await sendNotification(sub, JSON.stringify({
                        title: '📅 Weekly Review Time',
                        body: 'The week is over. Take 10 minutes to review your wins and plan for next week.',
                        url: '/weekly-review'
                    }));
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error in Weekly Review:', error);
        }
    });

    // ============================================
    // 3. DEADLINE MONITOR (Every 15 Minutes)
    // ============================================
    cron.schedule('*/15 * * * *', async () => {
        // console.log('[Scheduler] Checking deadlines...');
        try {
            const now = new Date();
            const future = new Date(now.getTime() + 30 * 60000); // 30 mins from now

            // Find tasks due between now and 30 mins
            const tasksDueSoon = await prisma.task.findMany({
                where: {
                    status: 'TODO',
                    dueDate: {
                        gt: now,
                        lte: future
                    }
                    // TODO: Add field to prevent duplicate checks if needed, 
                    // generally fine as window moves.
                },
                include: {
                    user: {
                        include: { pushSubscriptions: true }
                    }
                }
            });

            for (const task of tasksDueSoon) {
                for (const sub of task.user.pushSubscriptions) {
                    await sendNotification(sub, JSON.stringify({
                        title: '⏰ Task Due Soon!',
                        body: `"${task.title}" is due in less than 30 minutes.`,
                        url: '/tasks'
                    }));
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error is Deadline Monitor:', error);
        }
    });
}
