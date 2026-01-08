import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MOCK_USER_ID = 'user-1';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('key');
    const headerSecret = request.headers.get('x-widget-secret');

    // Simple security: Check against an env var or a hardcoded fallback
    const VALID_SECRET = process.env.WIDGET_SECRET || 'elvison-widget-secret';

    if (secret !== VALID_SECRET && headerSecret !== VALID_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Fetch Goals Count
        const goalsCount = await prisma.goal.count({
            where: { userId: MOCK_USER_ID }
        });

        // 2. Fetch Tasks Stats
        const pendingTasksCount = await prisma.task.count({
            where: {
                userId: MOCK_USER_ID,
                status: { not: 'DONE' }
            }
        });

        const todayTasksCount = await prisma.task.count({
            where: {
                userId: MOCK_USER_ID,
                status: { not: 'DONE' },
                doToday: true
            }
        });

        // 3. Fetch Habits Progress
        const activeHabits = await prisma.habit.findMany({
            where: {
                userId: MOCK_USER_ID,
                archived: false
            },
            include: {
                logs: {
                    where: {
                        date: today
                    }
                }
            }
        });

        const completedHabitsCount = activeHabits.filter(h => h.logs.length > 0 && h.logs[0].completed).length;
        const totalHabitsCount = activeHabits.length;

        // 4. Construct Response
        const data = {
            greeting: `Good ${getTimeOfDay(new Date().getHours())}`,
            stats: {
                goals: goalsCount,
                tasksPending: pendingTasksCount,
                tasksToday: todayTasksCount,
                habitsCompleted: completedHabitsCount,
                habitsTotal: totalHabitsCount,
                habitsProgress: totalHabitsCount > 0 ? Math.round((completedHabitsCount / totalHabitsCount) * 100) : 0
            },
            updatedAt: new Date().toISOString()
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch widget data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function getTimeOfDay(hour: number): string {
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
}
