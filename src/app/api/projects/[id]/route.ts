import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/projects/[id] - Get project with tasks and notes
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                tasks: {
                    include: {
                        subtasks: { orderBy: { order: 'asc' } },
                    },
                    orderBy: [{ status: 'asc' }, { priority: 'asc' }],
                },
                notes: {
                    orderBy: { updatedAt: 'desc' },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error('Failed to fetch project:', error);
        return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, category, objective, status, startDate, targetEndDate } = body;

        const project = await prisma.project.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(category !== undefined && { category }),
                ...(objective !== undefined && { objective }),
                ...(status !== undefined && { status }),
                ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
                ...(targetEndDate !== undefined && { targetEndDate: targetEndDate ? new Date(targetEndDate) : null }),
            },
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error('Failed to update project:', error);
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.project.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete project:', error);
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }
}
