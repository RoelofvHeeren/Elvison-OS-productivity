import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { wins, challenges, insights, weekNotes, aiSummary } = body;

        // TODO: Auth
        const user = await prisma.user.findFirst();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        // Determine Week Start (e.g., most recent Sunday)
        // Ideally the frontend sends the weekStart, or we calculate it.
        // Let's calculate the "Review Week Start" (Sunday).
        // If today is Sunday, it's today. If Monday, it's yesterday.
        // Usually review is for the week ending today (if Sunday).

        const now = new Date();
        const day = now.getDay(); // 0 = Sunday
        const diff = now.getDate() - day; // adjust when day is sunday (0), diff is 0 so date is today.

        // Use Noon to avoid timezone edge cases (UTC vs Local)
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(12, 0, 0, 0);

        const review = await prisma.weeklyReview.create({
            data: {
                userId: user.id,
                weekStart: weekStart, // rough estimation
                wins,
                challenges,
                insights,
                weekNotes,
                aiSummary,
                completedAt: new Date(),
            }
        });

        return NextResponse.json(review);

    } catch (error) {
        console.error('Error saving weekly review:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
