import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { auth } from "@/auth"

export const GET = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    try {
        // 1. Get Tasks Today count
        const tasksTodayCount = await prisma.task.count({
            where: {
                userId: userId,
                doToday: true,
                status: { not: 'DONE' } // Only count pending tasks for "Today"
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
            // This is a simplified streak calculation
            // In a real app we'd use the logic from the habits route or a dedicated utility
            let currentStreak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < 365; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);

                const log = habit.logs.find(l => {
                    const logDate = new Date(l.date);
                    logDate.setHours(0, 0, 0, 0);
                    return logDate.getTime() === checkDate.getTime() && l.completed;
                });

                if (log) {
                    currentStreak++;
                } else if (i > 0) {
                    // If not completed today, we don't break yet (might have been completed yesterday)
                    // If not completed yesterday, streak breaks
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
