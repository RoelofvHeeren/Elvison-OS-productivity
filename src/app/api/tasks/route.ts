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
    const date = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const scope = searchParams.get('scope');

    try {
        let whereClause: any = {
            userId: userId,
            ...(status && { status: status as any }),
        };

        if (scope === 'today' && from && to) {
            whereClause.OR = [
                { doToday: true },
                {
                    dueDate: {
                        gte: new Date(from),
                        lte: new Date(to),
                    }
                }
            ];
            // Fix: Explicitly exclude completed tasks for the dashboard view
            // unless the user specifically asked for 'DONE' status (which dashboard doesn't)
            if (status !== 'DONE') {
                whereClause.status = { not: 'DONE' };
            }
        } else {
            if (doToday === 'true') whereClause.doToday = true;

            if (from && to) {
                whereClause.dueDate = {
                    gte: new Date(from),
                    lte: new Date(to),
                };
            } else if (date) {
                whereClause.dueDate = {
                    gte: new Date(`${date}T00:00:00.000Z`),
                    lt: new Date(`${date}T23:59:59.999Z`),
                };
            }
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
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

        // Default logic: If dueDate is set but dueTime is NOT, default to 09:00:00
        let finalDueTime: Date | null = null;
        if (dueDate) {
            if (dueTime) {
                finalDueTime = new Date(`1970-01-01T${dueTime}:00`);
            } else {
                // User didn't pick a time, default to 09:00 AM
                finalDueTime = new Date(`1970-01-01T09:00:00`);
            }
        }

        const task = await prisma.task.create({
            data: {
                userId: userId,
                title,
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                dueTime: finalDueTime,
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

        // --- IMMEDIATE GOOGLE CALENDAR SYNC ---
        if (task.dueDate) {
            try {
                // Dynamically import to avoid circular dep issues if any, though standard import is fine usually
                const { setGoogleCredentials } = await import('@/lib/calendar');
                const calendar = await setGoogleCredentials(userId);

                if (calendar) {
                    // Construct Start Time
                    const eventDate = new Date(task.dueDate);
                    // If we have a time, set it. Otherwise rely on the 09:00 default we just enforced.
                    if (task.dueTime) {
                        eventDate.setHours(task.dueTime.getHours(), task.dueTime.getMinutes(), 0, 0);
                    } else {
                        eventDate.setHours(9, 0, 0, 0);
                    }

                    const googleEvent = await calendar.events.insert({
                        calendarId: 'primary',
                        requestBody: {
                            summary: `Task: ${task.title}`,
                            description: `Scheduled from Elvison OS`,
                            start: { dateTime: eventDate.toISOString() },
                            end: { dateTime: new Date(eventDate.getTime() + 30 * 60000).toISOString() }, // 30 min duration
                        },
                    });

                    if (googleEvent.data.id) {
                        await prisma.task.update({
                            where: { id: task.id },
                            data: { calendarEventId: googleEvent.data.id },
                        });
                        console.log(`[API] Synced task ${task.id} to GCal: ${googleEvent.data.id}`);
                    }
                }
            } catch (syncError) {
                console.error('[API] Failed to sync new task to Google Calendar:', syncError);
                // Don't fail the request, just log it. The background sync can catch it later.
            }
        }
        // --------------------------------------

        console.log('[API] Task created successfully:', task.id);
        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('Failed to create task:', error);
        return NextResponse.json({ error: 'Failed to create task', details: String(error) }, { status: 500 });
    }
});
