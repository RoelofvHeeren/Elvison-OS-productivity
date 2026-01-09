import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from "@/auth";

// GET /api/profile/stats - Fetch user profile statistics
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        // Fetch user info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Calculate habit streak (longest current streak across all habits)
        const habits = await prisma.habit.findMany({
            where: { userId, archived: false },
            include: {
                logs: {
                    orderBy: { date: 'desc' },
                },
            },
        });

        let maxStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const habit of habits) {
            let streak = 0;
            const sortedLogs = habit.logs
                .filter(log => log.completed)
                .map(log => {
                    const d = new Date(log.date);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime();
                })
                .sort((a, b) => b - a); // Descending order

            if (sortedLogs.length === 0) continue;

            // Check if streak is current (today or yesterday)
            const mostRecent = sortedLogs[0];
            const dayDiff = Math.floor((today.getTime() - mostRecent) / (1000 * 60 * 60 * 24));

            if (dayDiff > 1) continue; // Streak broken

            // Count consecutive days
            let expectedDate = mostRecent;
            for (const logDate of sortedLogs) {
                if (logDate === expectedDate) {
                    streak++;
                    expectedDate -= 1000 * 60 * 60 * 24; // Previous day
                } else if (logDate < expectedDate) {
                    break; // Gap in streak
                }
            }

            maxStreak = Math.max(maxStreak, streak);
        }

        // Calculate task completion rates
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);

        // Weekly tasks (tasks due in last 7 days)
        const weeklyTasks = await prisma.task.findMany({
            where: {
                userId,
                dueDate: {
                    gte: weekAgo,
                    lte: now,
                },
            },
            select: { status: true },
        });

        // Monthly tasks (tasks due in last 30 days)
        const monthlyTasks = await prisma.task.findMany({
            where: {
                userId,
                dueDate: {
                    gte: monthAgo,
                    lte: now,
                },
            },
            select: { status: true },
        });

        const weeklyTotal = weeklyTasks.length;
        const weeklyCompleted = weeklyTasks.filter(t => t.status === 'DONE').length;
        const weeklyCompletion = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : null;

        const monthlyTotal = monthlyTasks.length;
        const monthlyCompleted = monthlyTasks.filter(t => t.status === 'DONE').length;
        const monthlyCompletion = monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : null;

        // Determine if user has enough data
        const hasData = habits.length > 0 || monthlyTotal > 0;

        return NextResponse.json({
            user: {
                name: user.name || 'User',
                email: user.email,
            },
            habitStreak: maxStreak,
            weeklyTaskCompletion: weeklyCompletion,
            monthlyTaskCompletion: monthlyCompletion,
            weeklyTasksCompleted: weeklyCompleted,
            weeklyTasksTotal: weeklyTotal,
            monthlyTasksCompleted: monthlyCompleted,
            monthlyTasksTotal: monthlyTotal,
            hasData,
        });
    } catch (error) {
        console.error('Failed to fetch profile stats:', error);
        return NextResponse.json({ error: 'Failed to fetch profile stats' }, { status: 500 });
    }
}
