
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendNotification } from '@/lib/notifications';

// Prevent caching
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // Security: Check for a CRON_SECRET if you want to protect this in prod
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new NextResponse('Unauthorized', { status: 401 });
    // }

    console.log('[Cron] Check initiated at', new Date().toISOString());
    const results = {
        remindersSent: 0,
        dailySent: 0,
        weeklySent: 0,
        deadlineSent: 0,
        errors: [] as string[]
    };

    try {
        const now = new Date();

        // ========================
        // 1. Process Reminders
        // ========================
        const reminders = await prisma.reminder.findMany({
            where: {
                completed: false,
                datetime: { lte: now }
            },
            include: {
                user: { include: { pushSubscriptions: true } }
            }
        });

        console.log(`[Cron] Found ${reminders.length} pending reminders. Query time: ${now.toISOString()}`);

        for (const reminder of reminders) {
            console.log(`[Cron] Processing reminder ${reminder.id} for user ${reminder.userId}. Title: "${reminder.title}", Subs: ${reminder.user.pushSubscriptions.length}`);

            let sent = false;
            for (const sub of reminder.user.pushSubscriptions) {
                try {
                    console.log(`[Cron] Attempting push to sub ${sub.id.substring(0, 8)}...`);
                    await sendNotification(sub, JSON.stringify({
                        title: '🔔 Reminder',
                        body: reminder.title,
                        data: { url: '/calendar' }
                    }));
                    console.log(`[Cron] Push success for sub ${sub.id}`);
                    sent = true;
                } catch (e: any) {
                    console.error(`[Cron] Remind Error (User ${reminder.userId}, Sub ${sub.id}):`, e);
                    if (e.statusCode === 410) {
                        // Cleanup invalid sub
                        console.log(`[Cron] Deleting expired subscription ${sub.id}`);
                        await prisma.pushSubscription.delete({ where: { id: sub.id } });
                    }
                }
            }

            // Only mark complete if we attempted sending or if user has no subs (to prevent stuck reminders)
            // Actually, if user has NO subs, we should mark as complete otherwise it loops forever.
            if (sent || reminder.user.pushSubscriptions.length === 0) {
                console.log(`[Cron] Marking reminder ${reminder.id} as completed.`);
                await prisma.reminder.update({
                    where: { id: reminder.id },
                    data: { completed: true }
                });
                results.remindersSent++;
            } else {
                console.log(`[Cron] Failed to send reminder ${reminder.id} (no successful pushes). NOT marking complete.`);
            }
        }

        // ========================
        // 2. Process Daily/Weekly/Deadlines (HOURLY CHECK)
        // ========================
        // We only run this logic if it's top of the hour (minute 0) to avoid spam/load
        // Note: Cron runs every minute. 
        if (now.getMinutes() === 0) {
            console.log('[Cron] Running Hourly Checks (Daily/Weekly/Deadlines)...');

            // Fetch users with active subscriptions
            const users = await prisma.user.findMany({
                include: { pushSubscriptions: true }
            });

            for (const user of users) {
                if (!user.pushSubscriptions.length) continue;

                const userTimezone = user.timezone || 'UTC';
                const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
                const userHour = userTime.getHours();
                const userDay = userTime.getDay(); // 0 = Sunday

                // --- DAILY BRIEFING (8:00 AM Local) ---
                if (userHour === 8) {
                    const tasks = await prisma.task.findMany({
                        where: { userId: user.id, status: 'TODO', doToday: true }
                    });
                    if (tasks.length > 0) {
                        for (const sub of user.pushSubscriptions) {
                            await sendNotification(sub, JSON.stringify({
                                title: `☀️ Good Morning!`, // Simple title to avoid length issues
                                body: `You have ${tasks.length} tasks planned for today.`,
                                data: { url: '/tasks' }
                            })).catch(e => console.error('[Cron] Daily Briefing Error:', e));
                        }
                        results.dailySent++;
                    }
                }

                // --- WEEKLY REVIEW (Sunday 6:00 PM Local) ---
                if (userDay === 0 && userHour === 18) {
                    for (const sub of user.pushSubscriptions) {
                        await sendNotification(sub, JSON.stringify({
                            title: '📅 Weekly Review Time',
                            body: 'Take 10 minutes to review your wins and plan next week.',
                            data: { url: '/weekly-review' }
                        })).catch(e => console.error('[Cron] Weekly Review Error:', e));
                    }
                    results.weeklySent++;
                }
            }

            // --- DEADLINE MONITOR (24h Warning) ---
            const startWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const endWindow = new Date(startWindow.getTime() + 60 * 60 * 1000); // 1 hour window

            const dueTasks = await prisma.task.findMany({
                where: {
                    status: 'TODO',
                    dueDate: { gte: startWindow, lt: endWindow }
                },
                include: { user: { include: { pushSubscriptions: true } } }
            });

            for (const task of dueTasks) {
                for (const sub of task.user.pushSubscriptions) {
                    await sendNotification(sub, JSON.stringify({
                        title: '⏰ Task Due Tomorrow',
                        body: `"${task.title}" is due in 24 hours.`,
                        data: { url: '/tasks' }
                    })).catch(e => console.error('[Cron] Deadline Error:', e));
                }
                results.deadlineSent++;
            }
        }

        return NextResponse.json({ success: true, processed: results });
    } catch (error: any) {
        console.error('[Cron] Fatal Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
