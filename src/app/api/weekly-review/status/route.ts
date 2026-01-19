import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { auth } from '@/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        const now = new Date(); // Server time (UTC usually)
        const userTz = user.timezone || 'UTC';

        // Convert Server Time -> User Local Time
        const zonedNow = toZonedTime(now, userTz);

        const reviewDay = user.reviewDayOfWeek; // 0 = Sunday
        const reviewHour = user.reviewTimeHour; // 18 = 6 PM

        // Calculate the most recent deadline in User Local Time
        let localDeadline = new Date(zonedNow);
        localDeadline.setHours(reviewHour, 0, 0, 0);

        // Adjust day based on Local Time
        const currentDay = zonedNow.getDay();
        const diff = currentDay - reviewDay;

        if (diff < 0) {
            localDeadline.setDate(zonedNow.getDate() - (7 + diff));
        } else if (diff > 0) {
            localDeadline.setDate(zonedNow.getDate() - diff);
        } else {
            if (zonedNow < localDeadline) {
                localDeadline.setDate(zonedNow.getDate() - 7);
            }
        }

        // Convert Local Deadline -> UTC for DB Query
        const utcDeadline = fromZonedTime(localDeadline, userTz);

        // Check if ANY review has been created AFTER the deadline
        const latestReview = await prisma.weeklyReview.findFirst({
            where: {
                userId: user.id,
                createdAt: {
                    gte: utcDeadline
                }
            }
        });

        const isLocked = !latestReview && (now >= utcDeadline);

        return NextResponse.json({
            isLocked,
            deadline: utcDeadline,
            lastReviewDate: latestReview?.createdAt || null
        });

    } catch (error) {
        console.error('Error checking review status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
