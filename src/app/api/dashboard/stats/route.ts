import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from "@/auth"
import { toZonedTime } from 'date-fns-tz';

export const GET = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    try {
        // Fetch User Preference for Timezone
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { timezone: true }
        });
        const timezone = user?.timezone || 'UTC';

        // Calculate Today in User Timezone
        const now = new Date();
        const zonedNow = toZonedTime(now, timezone);

        const startOfDay = new Date(zonedNow);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        // 1. Get Tasks Today count (Pending Only)
        // Match logic: doToday=true OR dueDate is within Today
        const tasksTodayCount = await prisma.task.count({
            where: {
                userId: userId,
                status: { not: 'DONE' },
                OR: [
                    { doToday: true },
                    {
                        dueDate: {
                            gte: startOfDay,
                            lt: endOfDay
                        }
                    }
                ]
            }
        });

        // 2. Get Habits and calculate streaks
        const habits = await prisma.habit.findMany({
            where: {
                userId: userId,
                archived: false,
            },
            include: {
                logs: {
                    orderBy: { date: 'desc' },
                },
            },
        });

        let maxStreak = 0;
        habits.forEach(habit => {
            let currentStreak = 0;
            // Use same zoned logic for checking logs if possible, 
            // but habit logs are usually just Dates (midnight UTC).
            // We just need to find the log that matches "Today" or "Yesterday"

            // Normalize "Today" to just date part for comparison
            const todayCheck = new Date(zonedNow);
            todayCheck.setHours(0, 0, 0, 0);

            for (let i = 0; i < 365; i++) {
                const checkDate = new Date(todayCheck);
                checkDate.setDate(checkDate.getDate() - i);

                const log = habit.logs.find(l => {
                    const logDate = new Date(l.date); // This assumes parsed as local or UTC correctly
                    // Compare simplified YYYY-MM-DD to span across timezone issues if stored as UTC midnight
                    return logDate.toISOString().split('T')[0] === checkDate.toISOString().split('T')[0]
                        && l.completed;
                });

                if (log) {
                    currentStreak++;
                } else if (i > 0) {
                    break;
                }
            }
            if (currentStreak > maxStreak) maxStreak = currentStreak;
        });

        return NextResponse.json({
            tasksToday: tasksTodayCount,
            habitStreak: maxStreak
        });
    } catch (error) {
        console.error('Failed to fetch dashboard stats. Error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats', details: String(error) }, { status: 500 });
    }
});
