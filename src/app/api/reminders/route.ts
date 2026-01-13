import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export const POST = auth(async (req) => {
    if (!req.auth?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, datetime } = body;

        if (!title || !datetime) {
            return NextResponse.json({ error: 'Title and datetime required' }, { status: 400 });
        }

        console.log('[API] Creating reminder:', { title, datetime, parsed: new Date(datetime) });

        const reminder = await prisma.reminder.create({
            data: {
                userId: req.auth.user.id,
                title,
                datetime: new Date(datetime),
                type: 'CUSTOM'
            }
        });
        console.log('[API] Reminder created:', reminder);

        return NextResponse.json(reminder, { status: 201 });
    } catch (error) {
        console.error('Failed to create reminder:', error);
        return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
    }
});

export const GET = auth(async (req) => {
    if (!req.auth?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const reminders = await prisma.reminder.findMany({
            where: { userId: req.auth.user.id, completed: false },
            orderBy: { datetime: 'asc' }
        });

        return NextResponse.json(reminders);
    } catch (error) {
        console.error('Failed to fetch reminders:', error);
        return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
    }
});
