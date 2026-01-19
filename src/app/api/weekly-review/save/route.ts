import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toZonedTime } from 'date-fns-tz';
import { auth } from '@/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { wins, challenges, insights, weekNotes, aiSummary } = body;

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

        const userTz = user.timezone || 'UTC';
        const now = new Date(); // Server Time (UTC)

        // Convert to User's Local Time to correctly determine "today" in their world
        const zonedNow = toZonedTime(now, userTz);

        // Calculate the Review Week Start (Sunday) relative to User's Time
        // Logic: The review is associated with the week STARTING on the most recent Sunday.
        // If today is Sunday, it's today. If Mon, it's yesterday.
        const day = zonedNow.getDay(); // 0 = Sunday
        const diff = zonedNow.getDate() - day;

        const weekStartLocal = new Date(zonedNow);
        weekStartLocal.setDate(diff);
        weekStartLocal.setHours(0, 0, 0, 0);

        // We store weekStart as a Date object in DB, which Prisma saves as UTC.
        // Even if it maps to midnight Local, it's fine as long as it's CONSISTENT.
        // But `toZonedTime` returns a Date object that effectively holds the local time components.
        // When Prisma saves this, it might treat it as UTC. 
        // To avoid confusion, let's just make sure we save a date that represents that specific day.

        // BETTER APPROACH: 
        // Just use the Date object but set it to noon UTC to avoid date shifting issues when viewing in different TZs.
        // But since we rely on `unique([userId, weekStart])`, we need exact matches.
        // Let's stick to storing it as a Date acting as a "Day Identifier".

        // Construct a clean UTC date for that day to be safe and consistent across the app
        const cleanWeekStart = new Date(Date.UTC(
            weekStartLocal.getFullYear(),
            weekStartLocal.getMonth(),
            weekStartLocal.getDate(),
            12, 0, 0, 0 // Noon UTC to stay safely in that day
        ));

        const review = await prisma.weeklyReview.upsert({
            where: {
                userId_weekStart: {
                    userId: user.id,
                    weekStart: cleanWeekStart
                }
            },
            update: {
                wins,
                challenges,
                insights,
                weekNotes,
                aiSummary,
                completedAt: new Date(), // Update completion time
            },
            create: {
                userId: user.id,
                weekStart: cleanWeekStart,
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
