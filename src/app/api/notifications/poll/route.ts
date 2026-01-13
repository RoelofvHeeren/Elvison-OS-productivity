import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Fetch Due Reminders (that haven't been completed)
        const reminders = await prisma.reminder.findMany({
            where: {
                userId,
                completed: false,
                datetime: { lte: now }
            }
        });

        // 2. Fetch Task Counts for Daily Plan (if morning)
        // We just return the stats, client decides whether to show
        const dailyTaskCount = await prisma.task.count({
            where: {
                userId,
                status: 'TODO',
                OR: [
                    { doToday: true },
                    { dueDate: { gte: startOfDay, lte: endOfDay } }
                ]
            }
        });

        // 3. Fetch Tasks Due in next 24 hours (for client to diff)
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tasksDueSoon = await prisma.task.findMany({
            where: {
                userId,
                status: 'TODO',
                dueDate: {
                    gt: now,
                    lte: tomorrow
                }
            },
            select: { id: true, title: true, dueDate: true }
        });

        return NextResponse.json({
            reminders,
            dailyTaskCount,
            tasksDueSoon
        });

    } catch (error) {
        console.error('Poll error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // Mark items as notified/completed
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

    const body = await req.json();
    const { reminderIds } = body;

    if (reminderIds && Array.isArray(reminderIds)) {
        await prisma.reminder.updateMany({
            where: {
                id: { in: reminderIds },
                userId: session.user.id
            },
            data: { completed: true }
        });
    }

    return NextResponse.json({ success: true });
}
