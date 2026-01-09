import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { auth } from "@/auth"

interface Affirmation {
    id: string;
    content: string;
    type: string;
    active: boolean;
}

// GET /api/affirmations - Fetch all affirmations
export const GET = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    try {
        const affirmations = await prisma.affirmation.findMany({
            where: {
                userId: userId,
            },
            orderBy: [{ type: 'asc' }, { order: 'asc' }],
        });

        // Group by type
        const grouped = {
            coreIdentity: affirmations.filter((a: Affirmation) => a.type === 'CORE_IDENTITY'),
            shortTerm: affirmations.filter((a: Affirmation) => a.type === 'SHORT_TERM'),
        };

        return NextResponse.json(grouped);
    } catch (error) {
        console.error('Failed to fetch affirmations:', error);
        return NextResponse.json({ error: 'Failed to fetch affirmations' }, { status: 500 });
    }
});

// POST /api/affirmations - Create a new affirmation
export const POST = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    try {
        const body = await req.json();
        const { content, type } = body;



        // Get the max order for this type
        const maxOrder = await prisma.affirmation.aggregate({
            where: { userId: userId, type: type || 'CORE_IDENTITY' },
            _max: { order: true },
        });

        const affirmation = await prisma.affirmation.create({
            data: {
                userId: userId,
                content,
                type: type || 'CORE_IDENTITY',
                order: (maxOrder._max.order || 0) + 1,
            },
        });

        return NextResponse.json(affirmation, { status: 201 });
    } catch (error) {
        console.error('Failed to create affirmation:', error);
        return NextResponse.json({ error: 'Failed to create affirmation' }, { status: 500 });
    }
});
