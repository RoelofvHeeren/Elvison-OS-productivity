import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { auth } from "@/auth"

// GET /api/gratitude - Fetch gratitude entries
export const GET = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const limit = searchParams.get('limit');

    try {
        const entries = await prisma.gratitudeEntry.findMany({
            where: {
                userId: userId,
                ...(date && {
                    date: new Date(date),
                }),
            },
            orderBy: { date: 'desc' },
            take: limit ? parseInt(limit) : undefined,
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error('Failed to fetch gratitude entries:', error);
        return NextResponse.json({ error: 'Failed to fetch gratitude entries' }, { status: 500 });
    }
});

// POST /api/gratitude - Create or update gratitude entry for a date
export const POST = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    try {
        const body = await req.json();
        const { date, entries } = body;

        const entryDate = date ? new Date(date) : new Date();
        entryDate.setHours(0, 0, 0, 0);



        // Upsert the entry for this date
        const gratitudeEntry = await prisma.gratitudeEntry.upsert({
            where: {
                userId_date: {
                    userId: userId,
                    date: entryDate,
                },
            },
            update: {
                entries,
            },
            create: {
                userId: userId,
                date: entryDate,
                entries,
            },
        });

        return NextResponse.json(gratitudeEntry, { status: 201 });
    } catch (error) {
        console.error('Failed to save gratitude entry:', error);
        return NextResponse.json({ error: 'Failed to save gratitude entry' }, { status: 500 });
    }
});
