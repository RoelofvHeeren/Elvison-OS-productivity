import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { auth } from "@/auth"

// GET /api/habits - Fetch habits with logs
export const GET = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    try {
        const habits = await prisma.habit.findMany({
            where: {
                userId: userId,
                archived: false,
            },
            include: {
                logs: {
                    where: startDate && endDate ? {
                        date: {
                            gte: new Date(startDate),
                            lte: new Date(endDate),
                        },
                    } : undefined,
                    orderBy: { date: 'desc' },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Calculate streak and completion rate for each habit
        interface HabitWithRelations {
            id: string;
            userId: string;
            name: string;
            color: string;
            frequency: string;
            archived: boolean;
            createdAt: Date;
            updatedAt: Date;
            logs: {
                id: string;
                habitId: string;
                date: Date;
                completed: boolean;
                createdAt: Date;
            }[];
        }

        const habitsWithStats = await Promise.all((habits as unknown as HabitWithRelations[]).map(async (habit: HabitWithRelations) => {
            // Get last 30 days of logs for completion rate
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentLogs = await prisma.habitLog.findMany({
                where: {
                    habitId: habit.id,
                    date: { gte: thirtyDaysAgo },
                    completed: true,
                },
            });

            // Calculate streak
            let streak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < 365; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                checkDate.setHours(0, 0, 0, 0);

                const log = habit.logs.find(l => {
                    const logDate = new Date(l.date);
                    logDate.setHours(0, 0, 0, 0);
                    return logDate.getTime() === checkDate.getTime() && l.completed;
                });

                if (log) {
                    streak++;
                } else if (i > 0) {
                    break;
                }
            }

            return {
                ...habit,
                streak,
                completionRate: Math.round((recentLogs.length / 30) * 100),
            };
        }));

        return NextResponse.json(habitsWithStats);
    } catch (error) {
        console.error('Failed to fetch habits:', error);
        return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
    }
});

// POST /api/habits - Create a new habit
export const POST = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    try {
        const body = await req.json();
        const { name, color, frequency } = body;



        const habit = await prisma.habit.create({
            data: {
                userId: userId,
                name,
                color: color || '#139187',
                frequency: frequency || 'DAILY',
            },
            include: {
                logs: true,
            },
        });

        return NextResponse.json({ ...habit, streak: 0, completionRate: 0 }, { status: 201 });
    } catch (error) {
        console.error('Failed to create habit:', error);
        return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
    }
});
