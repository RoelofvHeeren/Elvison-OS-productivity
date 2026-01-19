import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        // TODO: Auth - Deterministic User
        const user = await prisma.user.findFirst({
            orderBy: {
                createdAt: 'asc'
            }
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        const reviews = await prisma.weeklyReview.findMany({
            where: {
                userId: user.id
            },
            orderBy: {
                weekStart: 'desc'
            },
            take: 10 // Last 10 reviews
        });

        return NextResponse.json(reviews);

    } catch (error) {
        console.error('Error fetching review history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
