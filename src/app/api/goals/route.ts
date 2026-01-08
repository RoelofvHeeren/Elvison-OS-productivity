import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from "@/auth"

// GET /api/goals - Fetch goals by timeframe
export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe');

    try {
        const goals = await prisma.goal.findMany({
            where: {
                userId: userId,
                ...(timeframe && { timeframe: timeframe as any }),
            },
            include: {
                projectLinks: {
                    include: {
                        project: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform to include linked project names
        interface GoalWithRelations {
            id: string;
            title: string;
            category: string;
            timeframe: string;
            successCriteria: string | null;
            why: string | null;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            projectLinks: {
                project: {
                    name: string;
                };
            }[];
        }

        const goalsWithProjects = (goals as unknown as GoalWithRelations[]).map((goal: GoalWithRelations) => ({
            ...goal,
            linkedProjects: goal.projectLinks.map((link) => link.project.name),
        }));

        return NextResponse.json(goalsWithProjects);
    } catch (error) {
        console.error('Failed to fetch goals:', error);
        return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }
}

// POST /api/goals - Create a new goal
export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    try {
        const body = await request.json();
        const { title, category, timeframe, successCriteria, why, linkedProjectIds } = body;

        const goal = await prisma.goal.create({
            data: {
                userId: userId,
                title,
                category: category || 'PERSONAL',
                timeframe: timeframe || 'QUARTERLY',
                successCriteria: successCriteria || null,
                why: why || null,
                projectLinks: linkedProjectIds?.length > 0 ? {
                    create: linkedProjectIds.map((projectId: string) => ({
                        projectId,
                    })),
                } : undefined,
            },
            include: {
                projectLinks: {
                    include: {
                        project: { select: { id: true, name: true } },
                    },
                },
            },
        });

        return NextResponse.json({
            ...goal,
            linkedProjects: goal.projectLinks.map((link: { project: { name: string } }) => link.project.name),
        }, { status: 201 });
    } catch (error) {
        console.error('Failed to create goal:', error);
        return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }
}
