import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from "@/auth"

// GET /api/projects - Fetch all projects
export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    try {
        const projects = await prisma.project.findMany({
            where: {
                userId: userId,
                ...(status && { status: status as any }),
            },
            include: {
                tasks: {
                    select: { id: true, title: true, status: true, priority: true, dueDate: true },
                },
                notes: {
                    select: { id: true, title: true, content: true, createdAt: true },
                    orderBy: { updatedAt: 'desc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Calculate task counts
        interface ProjectWithRelations {
            id: string;
            userId: string;
            name: string;
            category: string;
            objective: string | null;
            status: string;
            startDate: Date | null;
            targetEndDate: Date | null;
            createdAt: Date;
            updatedAt: Date;
            tasks: { id: string; status: string }[];
            notes: { id: string }[];
        }

        const projectsWithCounts = (projects as unknown as ProjectWithRelations[]).map((project: ProjectWithRelations) => ({
            ...project,
            tasksCount: project.tasks.length,
            completedTasks: project.tasks.filter(t => t.status === 'DONE').length,
            notesCount: project.notes.length,
        }));

        return NextResponse.json(projectsWithCounts);
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    try {
        const body = await request.json();
        const { name, category, objective, startDate, targetEndDate } = body;

        const project = await prisma.project.create({
            data: {
                userId: userId,
                name,
                category: category || 'PERSONAL',
                objective: objective || null,
                startDate: startDate ? new Date(startDate) : null,
                targetEndDate: targetEndDate ? new Date(targetEndDate) : null,
            },
        });

        return NextResponse.json({
            ...project,
            tasksCount: 0,
            completedTasks: 0,
            notesCount: 0,
            tasks: [],
            notes: []
        }, { status: 201 });
    } catch (error) {
        console.error('Failed to create project:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}
