import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

// PATCH /api/reminders/[id] - Mark reminder as complete
export const PATCH = auth(async (req, { params }: { params: Promise<{ id: string }> }) => {
    if (!req.auth?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();

        // Verify ownership
        const existing = await prisma.reminder.findFirst({
            where: { id, userId: req.auth.user.id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
        }

        const reminder = await prisma.reminder.update({
            where: { id },
            data: { completed: body.completed ?? true }
        });

        return NextResponse.json(reminder);
    } catch (error) {
        console.error('Failed to update reminder:', error);
        return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
    }
});

// DELETE /api/reminders/[id] - Delete reminder
export const DELETE = auth(async (req, { params }: { params: Promise<{ id: string }> }) => {
    if (!req.auth?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        // Verify ownership
        const existing = await prisma.reminder.findFirst({
            where: { id, userId: req.auth.user.id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
        }

        await prisma.reminder.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete reminder:', error);
        return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
    }
});
