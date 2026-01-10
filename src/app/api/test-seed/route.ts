import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export const GET = auth(async (req) => {
    // In a real scenario we'd check auth, but for this test helper
    // we'll just use the first user or the authenticated user
    let userId = req.auth?.user?.id;

    if (!userId) {
        // Fallback for testing if not logged in (dev only)
        const user = await prisma.user.findFirst();
        userId = user?.id;
    }

    if (!userId) {
        return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    try {
        // 1. Create a future reminder
        const reminder = await prisma.reminder.create({
            data: {
                userId,
                title: 'Test Reminder via Seed',
                datetime: new Date(Date.now() + 3600000), // 1 hour from now
                type: 'CUSTOM',
                completed: false
            }
        });

        // 2. Create a note
        const note = await prisma.knowledgeItem.create({
            data: {
                userId,
                title: 'Test Note via Seed',
                content: 'This is a test note created to verify the Notes tab implementation.',
                category: 'NOTE',
                tags: ['test', 'verification']
            }
        });

        return NextResponse.json({ success: true, reminder, note });
    } catch (error) {
        console.error('Seed failed:', error);
        return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
    }
});
