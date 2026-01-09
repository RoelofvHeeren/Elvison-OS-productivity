import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendNotification } from '@/lib/notifications';

interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    actions?: Array<{ action: string; title: string }>;
}

async function generatePayload(type: string, userId: string): Promise<NotificationPayload | null> {
    switch (type) {
        case 'daily_plan':
            const tasksToday = await prisma.task.count({
                where: { userId, doToday: true, status: { not: 'DONE' } }
            });
            if (tasksToday === 0) {
                return {
                    title: "Daily Plan Not Set",
                    body: "No tasks scheduled for today. Tap to plan your day.",
                    data: { url: '/tasks' }
                };
            } else {
                return {
                    title: "Daily Plan Ready",
                    body: `${tasksToday} task${tasksToday > 1 ? 's' : ''} scheduled for today.`,
                    data: { url: '/tasks' }
                };
            }

        case 'task_due':
            const task = await prisma.task.findFirst({
                where: { userId, status: { not: 'DONE' }, dueDate: { not: null } },
                orderBy: { dueDate: 'asc' }
            });
            return {
                title: "Task Due Soon",
                body: task ? `"${task.title}" is approaching its due date.` : "A task requires completion before its deadline.",
                data: { url: '/tasks' }
            };

        case 'weekly_review':
            return {
                title: "Weekly Review Pending",
                body: "Time to review this week's progress and insights.",
                data: { url: '/weekly-review' }
            };

        case 'reminder':
            return {
                title: "Reminder",
                body: "You have a scheduled reminder.",
                data: { url: '/calendar' }
            };

        default:
            return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { type } = await request.json();

        const user = await prisma.user.findFirst();
        if (!user) {
            return NextResponse.json({ error: 'No user found' }, { status: 404 });
        }

        const payload = await generatePayload(type, user.id);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
        }

        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId: user.id }
        });

        if (subscriptions.length === 0) {
            return NextResponse.json({ error: 'No push subscriptions found' }, { status: 404 });
        }

        let sentCount = 0;
        for (const sub of subscriptions) {
            try {
                const subscriptionObject = {
                    endpoint: sub.endpoint,
                    keys: sub.keys as any
                };
                const success = await sendNotification(subscriptionObject, JSON.stringify(payload));
                if (success) sentCount++;
            } catch (e) {
                console.error('Failed to send to sub', sub.id, e);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${type} notification to ${sentCount} devices`,
            payload
        });

    } catch (error) {
        console.error('Test Trigger Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
    }
}
