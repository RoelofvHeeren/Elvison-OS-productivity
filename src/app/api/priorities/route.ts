import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MOCK_USER_ID = 'user-1';

// GET /api/priorities - Fetch top 3 priorities
export async function GET() {
    try {
        // First, check for user-overridden priorities
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get high-priority tasks with due dates
        const tasks = await prisma.task.findMany({
            where: {
                userId: MOCK_USER_ID,
                status: { not: 'DONE' },
                OR: [
                    { priority: 'HIGH' },
                    { doToday: true },
                    { dueDate: { lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) } },
                ],
            },
            include: {
                project: { select: { id: true, name: true } },
            },
            orderBy: [
                { priority: 'asc' },
                { dueDate: 'asc' },
                { createdAt: 'asc' },
            ],
            take: 3,
        });

        interface TaskWithProject {
            id: string;
            title: string;
            priority: string;
            project: { name: string } | null;
        }

        const priorities = (tasks as unknown as TaskWithProject[]).map((task: TaskWithProject, index: number) => ({
            id: task.id,
            title: task.title,
            priority: task.priority,
            project: task.project?.name || null,
            order: index + 1,
            isAISuggested: true, // All are AI-suggested initially
            isOverridden: false,
        }));

        return NextResponse.json(priorities);
    } catch (error) {
        console.error('Failed to fetch priorities:', error);
        return NextResponse.json({ error: 'Failed to fetch priorities' }, { status: 500 });
    }
}

// PATCH /api/priorities - Override a priority
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, title, priority, project } = body;

        // For now, we'll update the underlying task
        // In a full implementation, you might have a separate UserPriority table
        if (id) {
            await prisma.task.update({
                where: { id },
                data: {
                    ...(title && { title }),
                    ...(priority && { priority }),
                    doToday: true, // Ensure it shows as a priority
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to override priority:', error);
        return NextResponse.json({ error: 'Failed to override priority' }, { status: 500 });
    }
}
