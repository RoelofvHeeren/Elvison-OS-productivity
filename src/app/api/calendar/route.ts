import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MOCK_USER_ID = 'user-1';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    try {
        const events = await prisma.calendarEvent.findMany({
            where: {
                userId: MOCK_USER_ID,
                ...(start && end && {
                    start: {
                        gte: new Date(start),
                        lte: new Date(end),
                    },
                }),
            },
            orderBy: { start: 'asc' },
        });

        // Also fetch tasks as events
        const tasks = await prisma.task.findMany({
            where: {
                userId: MOCK_USER_ID,
                dueDate: { not: null },
                ...(start && end && {
                    dueDate: {
                        gte: new Date(start),
                        lte: new Date(end),
                    },
                }),
            },
        });

        const taskEvents = tasks.map(task => ({
            id: `task-${task.id}`,
            title: `📌 ${task.title}`,
            start: task.dueDate,
            end: new Date(task.dueDate!.getTime() + 30 * 60000),
            allDay: false,
            source: 'LOCAL_TASK',
            status: task.status,
        }));

        return NextResponse.json([...events, ...taskEvents]);
    } catch (error) {
        console.error('Failed to fetch calendar events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}
