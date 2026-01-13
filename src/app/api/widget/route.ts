
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toZonedTime } from 'date-fns-tz';

// Helper to get effective user
async function getUserId() {
    const user = await prisma.user.findFirst();
    if (user) return { id: user.id, timezone: user.timezone || 'UTC' };
    return { id: 'user-1', timezone: 'UTC' }; // Fallback
}

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { id: userId, timezone } = await getUserId();

        // Use user's timezone to determine "now" and "today"
        const now = new Date();
        const zonedNow = toZonedTime(now, timezone);
        const hour = zonedNow.getHours();

        // 1. Greeting
        let greeting = 'Good Evening';
        if (hour < 12) greeting = 'Good Morning';
        else if (hour < 18) greeting = 'Good Afternoon';

        // 2. Task Stats (Today)
        // Calculate start/end of day in USER's timezone
        const startOfDay = new Date(zonedNow);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const tasksToday = await prisma.task.findMany({
            where: {
                userId,
                status: { not: 'DONE' }, // Ensure we only count pending tasks
                OR: [
                    { doToday: true },
                    {
                        dueDate: {
                            gte: startOfDay,
                            lt: endOfDay
                        }
                    }
                ]
            }
        });

        const totalTasks = tasksToday.length;
        const completedTasks = tasksToday.filter(t => t.status === 'DONE').length;
        const remainingTasks = totalTasks - completedTasks;

        // 3. Top Priority
        // Find highest priority TODO task
        const topTask = tasksToday
            .filter(t => t.status !== 'DONE')
            .sort((a, b) => {
                const priorityMap = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                return priorityMap[a.priority] - priorityMap[b.priority];
            })[0];

        // 4. Habit Stats
        // Simple count of active habits vs completed today
        const activeHabits = await prisma.habit.findMany({
            where: { userId, archived: false },
            include: {
                logs: {
                    where: {
                        date: {
                            gte: startOfDay,
                            lt: endOfDay
                        }
                    }
                }
            }
        });

        const totalHabits = activeHabits.length;
        const completedHabits = activeHabits.filter(h => h.logs.length > 0 && h.logs[0].completed).length;

        return NextResponse.json({
            greeting,
            stats: {
                tasks: { total: totalTasks, completed: completedTasks, remaining: remainingTasks },
                habits: { total: totalHabits, completed: completedHabits }
            },
            topTask: topTask ? {
                title: topTask.title,
                priority: topTask.priority
            } : null
        });

    } catch (error) {
        console.error('[Widget API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
