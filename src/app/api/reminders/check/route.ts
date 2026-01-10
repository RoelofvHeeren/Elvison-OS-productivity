import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendNotification } from '@/lib/notifications';

// This endpoint checks for due reminders and sends notifications
// Can be called by a cron job or scheduled task
export async function GET() {
    try {
        const now = new Date();

        // Find all reminders that are due (datetime <= now) and not completed
        const dueReminders = await prisma.reminder.findMany({
            where: {
                datetime: { lte: now },
                completed: false
            },
            include: {
                user: {
                    include: {
                        pushSubscriptions: true
                    }
                }
            }
        });

        console.log(`[Reminder Check] Found ${dueReminders.length} due reminders`);

        const results = [];

        for (const reminder of dueReminders) {
            const { user } = reminder;

            if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
                console.log(`[Reminder Check] User ${user.id} has no push subscriptions`);
                // Still mark as completed to avoid repeated checks
                await prisma.reminder.update({
                    where: { id: reminder.id },
                    data: { completed: true }
                });
                results.push({ id: reminder.id, status: 'no_subscription' });
                continue;
            }

            // Prepare notification payload
            const payload = JSON.stringify({
                title: '⏰ Reminder',
                body: reminder.title,
                data: { url: '/calendar' }
            });

            // Send to all user's subscriptions
            let notificationSent = false;
            for (const subscription of user.pushSubscriptions) {
                try {
                    await sendNotification(
                        {
                            endpoint: subscription.endpoint,
                            keys: subscription.keys as { p256dh: string; auth: string }
                        },
                        payload
                    );
                    notificationSent = true;
                    console.log(`[Reminder Check] Sent notification for reminder ${reminder.id} to subscription ${subscription.id}`);
                } catch (error: any) {
                    console.error(`[Reminder Check] Failed to send to subscription ${subscription.id}:`, error.message);

                    // If subscription is expired (410 Gone), remove it
                    if (error.statusCode === 410) {
                        await prisma.pushSubscription.delete({
                            where: { id: subscription.id }
                        });
                        console.log(`[Reminder Check] Removed expired subscription ${subscription.id}`);
                    }
                }
            }

            // Mark reminder as completed
            await prisma.reminder.update({
                where: { id: reminder.id },
                data: { completed: true }
            });

            results.push({
                id: reminder.id,
                title: reminder.title,
                status: notificationSent ? 'sent' : 'failed'
            });
        }

        return NextResponse.json({
            success: true,
            checked: dueReminders.length,
            results
        });
    } catch (error) {
        console.error('[Reminder Check] Error:', error);
        return NextResponse.json({ error: 'Failed to check reminders' }, { status: 500 });
    }
}
