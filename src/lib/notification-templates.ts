
import { prisma } from './prisma';

type NotificationType = 'daily_plan' | 'task_due' | 'weekly_review' | 'reminder';

interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    actions?: Array<{ action: string; title: string }>;
}

export async function generateNotificationPayload(type: NotificationType, userId: string): Promise<NotificationPayload | null> {
    switch (type) {
        case 'daily_plan':
            return getDailyPlanNotification(userId);
        case 'task_due':
            return getTaskDueNotification(userId);
        case 'weekly_review':
            return getWeeklyReviewNotification();
        case 'reminder':
            return getReminderNotification(userId);
        default:
            return null;
    }
}

async function getDailyPlanNotification(userId: string): Promise<NotificationPayload> {
    // Check if user has tasks for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const tasksToday = await prisma.task.count({
        where: {
            userId,
            doToday: true,
            status: { not: 'DONE' } // Only count active tasks
        }
    });

    if (tasksToday === 0) {
        return {
            title: "Daily Plan Not Set",
            body: "No tasks scheduled for today. Tap to plan your day.",
            data: { url: '/tasks' },
            actions: [
                { action: 'plan', title: 'Plan Day' }
            ]
        };
    } else {
        return {
            title: "Daily Plan Ready",
            body: `${tasksToday} task${tasksToday > 1 ? 's' : ''} scheduled for today.`,
            data: { url: '/tasks' }
        };
    }
}

async function getTaskDueNotification(userId: string): Promise<NotificationPayload> {
    // Find a task due soon (simulated for test)
    const task = await prisma.task.findFirst({
        where: { userId, status: { not: 'DONE' }, dueDate: { not: null } },
        orderBy: { dueDate: 'asc' }
    });

    if (task) {
        return {
            title: "Task Due Soon",
            body: `"${task.title}" is approaching its due date.`,
            data: { url: '/tasks' }
        };
    } else {
        return {
            title: "Task Due Soon",
            body: "A task requires completion before its deadline.",
            data: { url: '/tasks' }
        };
    }
}

function getWeeklyReviewNotification(): NotificationPayload {
    return {
        title: "Weekly Review Pending",
        body: "Time to review this week's progress and insights.",
        data: { url: '/weekly-review' },
        actions: [
            { action: 'review', title: 'Start Review' }
        ]
    };
}

async function getReminderNotification(userId: string): Promise<NotificationPayload> {
    return {
        title: "Reminder",
        body: "You have a scheduled reminder.",
        data: { url: '/calendar' }
    };
}
