
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to get effective user
async function getUserId() {
    const user = await prisma.user.findFirst();
    if (user) return user.id;
    return 'user-1'; // Fallback
}

export async function GET() {
    try {
        const userId = await getUserId();
        const now = new Date();
        const hour = now.getHours();

        // 1. Greeting
        let greeting = 'Good Evening';
        if (hour < 12) greeting = 'Good Morning';
        else if (hour < 18) greeting = 'Good Afternoon';

        // 2. Task Stats (Today)
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const tasksToday = await prisma.task.findMany({
            where: {
                userId,
                OR: [
                    { doToday: true },
                    { dueDate: { gte: startOfDay, lt: endOfDay } }
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
                    where: { date: startOfDay }
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
