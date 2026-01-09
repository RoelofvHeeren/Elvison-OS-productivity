import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from "@/auth";

// GET /api/tasks - Fetch tasks
export const GET = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    const { searchParams } = new URL(req.url);
    const doToday = searchParams.get('doToday');
    const status = searchParams.get('status');

    try {
        const tasks = await prisma.task.findMany({
            where: {
                userId: userId,
                ...(doToday === 'true' && { doToday: true }),
                ...(status && { status: status as any }),
            },
            include: {
                project: {
                    select: { id: true, name: true },
                },
                subtasks: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: [
                { priority: 'asc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' },
            ],
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
});

// POST /api/tasks - Create a new task
export const POST = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    try {
        const body = await req.json();
        console.log('[API] Creating task with payload:', JSON.stringify(body, null, 2));

        const { title, priority, dueDate, dueTime, doToday, projectId, subtasks } = body;

        const task = await prisma.task.create({
            data: {
                userId: userId,
                title,
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                dueTime: dueTime ? new Date(`1970-01-01T${dueTime}:00`) : null,
                doToday: doToday || false,
                projectId: projectId || null,
                subtasks: subtasks?.length > 0 ? {
                    create: subtasks.map((s: { title: string }, i: number) => ({
                        title: s.title,
                        order: i,
                    })),
                } : undefined,
            },
            include: {
                project: { select: { id: true, name: true } },
                subtasks: { orderBy: { order: 'asc' } },
            },
        });

        console.log('[API] Task created successfully:', task.id);
        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('Failed to create task:', error);
        return NextResponse.json({ error: 'Failed to create task', details: String(error) }, { status: 500 });
    }
});
