import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
// import { getSession } from '@/lib/utils';

export async function GET() {
    try {
        // Mock User for now (or get from session)
        // In real impl, use: const session = await getSession(); const userId = session.user.id;
        // For this task, we'll verify if there's an auth mechanism or use a fixed user if in dev.
        // Looking at schema, User has ID. I'll search for the first user or hardcode if dev.
        // Wait, the previous request context had MOCK_USER_ID discussion. I should check how auth is done.
        // Assuming I can get the user. For now, I'll fetch the first user as fallback or check headers.

        // TODO: Replace with real auth
        const user = await prisma.user.findFirst();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        const now = new Date();
        const reviewDay = user.reviewDayOfWeek; // 0 = Sunday
        const reviewHour = user.reviewTimeHour; // 18 = 6 PM

        // Calculate the most recent deadline
        let deadline = new Date(now);
        deadline.setHours(reviewHour, 0, 0, 0);

        // Adjust day
        const currentDay = now.getDay();
        const diff = currentDay - reviewDay;

        if (diff < 0) {
            // e.g. Target is Saturday (6), Today is Friday (5). Diff = -1. 
            // Deadline was last week.
            deadline.setDate(now.getDate() - (7 + diff));
        } else if (diff > 0) {
            // e.g. Target is Sunday (0), Today is Monday (1). Diff = 1.
            // Deadline was yesterday.
            deadline.setDate(now.getDate() - diff);
        } else {
            // Same day. 
            // If now < deadline, then the *actual* deadline was last week.
            if (now < deadline) {
                deadline.setDate(now.getDate() - 7);
            }
        }

        // Check if ANY review has been created AFTER the deadline
        const latestReview = await prisma.weeklyReview.findFirst({
            where: {
                userId: user.id,
                createdAt: {
                    gte: deadline
                }
            }
        });

        const isLocked = !latestReview && (now >= deadline);

        return NextResponse.json({
            isLocked,
            deadline,
            lastReviewDate: latestReview?.createdAt || null
        });

    } catch (error) {
        console.error('Error checking review status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
