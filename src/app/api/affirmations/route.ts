import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MOCK_USER_ID = 'user-1';

interface Affirmation {
    id: string;
    content: string;
    type: string;
    active: boolean;
}

// GET /api/affirmations - Fetch all affirmations
export async function GET() {
    try {
        const affirmations = await prisma.affirmation.findMany({
            where: {
                userId: MOCK_USER_ID,
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
}

// POST /api/affirmations - Create a new affirmation
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { content, type } = body;

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

        // Get the max order for this type
        const maxOrder = await prisma.affirmation.aggregate({
            where: { userId: MOCK_USER_ID, type: type || 'CORE_IDENTITY' },
            _max: { order: true },
        });

        const affirmation = await prisma.affirmation.create({
            data: {
                userId: MOCK_USER_ID,
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
}
