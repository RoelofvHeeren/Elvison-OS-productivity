import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Mock user ID for now - in production this would come from auth
const MOCK_USER_ID = 'user-1';

// GET /api/tasks - Fetch tasks
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const doToday = searchParams.get('doToday');
    const status = searchParams.get('status');

    try {
        const tasks = await prisma.task.findMany({
            where: {
                userId: MOCK_USER_ID,
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
}

// POST /api/tasks - Create a new task
// POST /api/tasks - Create a new task
export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('[API] Creating task with payload:', JSON.stringify(body, null, 2));

        const { title, priority, dueDate, dueTime, doToday, projectId, subtasks } = body;

        // Ensure user exists (temporary fix for development)
        // In a real app we'd handle this via auth middleware/seed
        const userExists = await prisma.user.findUnique({ where: { id: MOCK_USER_ID } });
        if (!userExists) {
            console.log('[API] Mock user not found, creating...');
            await prisma.user.create({
                data: {
                    id: MOCK_USER_ID,
                    email: 'demo@example.com',
                    name: 'Demo User'
                }
            });
        }

        const task = await prisma.task.create({
            data: {
                userId: MOCK_USER_ID,
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
}
