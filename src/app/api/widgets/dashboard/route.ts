import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MOCK_USER_ID = 'user-1';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('key');
    const headerSecret = request.headers.get('x-widget-secret');

    const VALID_SECRET = process.env.WIDGET_SECRET || 'elvison-widget-secret';

    if (secret !== VALID_SECRET && headerSecret !== VALID_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch remaining (incomplete) tasks for today
        const todayTasks = await prisma.task.findMany({
            where: {
                userId: MOCK_USER_ID,
                status: { not: 'DONE' },
                doToday: true
            },
            select: {
                id: true,
                title: true,
                priority: true,
                dueDate: true,
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' }
            ],
            take: 5 // Limit for widget display
        });

        // Count remaining tasks
        const remainingTasksCount = await prisma.task.count({
            where: {
                userId: MOCK_USER_ID,
                status: { not: 'DONE' },
                doToday: true
            }
        });

        // Fetch Habits Progress
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

        const data = {
            stats: {
                tasksRemaining: remainingTasksCount,
                habitsCompleted: completedHabitsCount,
                habitsTotal: totalHabitsCount,
            },
            tasks: todayTasks.map(t => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                dueTime: t.dueDate ? new Date(t.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null
            })),
            updatedAt: new Date().toISOString()
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch widget data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
