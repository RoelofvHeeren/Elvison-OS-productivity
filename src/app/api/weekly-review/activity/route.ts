import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getWeekStart } from '@/lib/utils';

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

        // Determine the time range (Last 7 days relative to now, or relative to the "review period")
        // Usually weekly review looks at the *past* week.
        const now = new Date();
        const weekStart = getWeekStart(now); // Allows getting the start of current week (Monday or Sunday based on impl)
        // If we want the FULL last week (e.g. if reviewing on Sunday, we want Mon-Sun).
        // Let's grab everything from the last 7 days for simplicity and relevance.

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const tasks = await prisma.task.findMany({
            where: {
                userId: user.id,
                status: 'DONE',
                updatedAt: {
                    gte: sevenDaysAgo
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        const notes = await prisma.knowledgeItem.findMany({
            where: {
                userId: user.id,
                category: 'NOTE',
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ tasks, notes });

    } catch (error) {
        console.error('Error fetching activity:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
