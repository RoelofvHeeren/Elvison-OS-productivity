import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MOCK_USER_ID = 'user-1';

// GET /api/gratitude - Fetch gratitude entries
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const limit = searchParams.get('limit');

    try {
        const entries = await prisma.gratitudeEntry.findMany({
            where: {
                userId: MOCK_USER_ID,
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
}

// POST /api/gratitude - Create or update gratitude entry for a date
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, entries } = body;

        const entryDate = date ? new Date(date) : new Date();
        entryDate.setHours(0, 0, 0, 0);

        // Ensure user exists (temporary fix for development)
        const userExists = await prisma.user.findUnique({ where: { id: MOCK_USER_ID } });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    id: MOCK_USER_ID,
                    email: 'demo@example.com',
                    name: 'Demo User'
                }
            });
        }

        // Upsert the entry for this date
        const gratitudeEntry = await prisma.gratitudeEntry.upsert({
            where: {
                userId_date: {
                    userId: MOCK_USER_ID,
                    date: entryDate,
                },
            },
            update: {
                entries,
            },
            create: {
                userId: MOCK_USER_ID,
                date: entryDate,
                entries,
            },
        });

        return NextResponse.json(gratitudeEntry, { status: 201 });
    } catch (error) {
        console.error('Failed to save gratitude entry:', error);
        return NextResponse.json({ error: 'Failed to save gratitude entry' }, { status: 500 });
    }
}
