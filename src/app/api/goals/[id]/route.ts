import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/goals/[id] - Update goal
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, category, timeframe, successCriteria, why, linkedProjectIds } = body;

        // If linkedProjectIds provided, update the links
        if (linkedProjectIds !== undefined) {
            // Delete existing links
            await prisma.goalProject.deleteMany({
                where: { goalId: id },
            });

            // Create new links
            if (linkedProjectIds.length > 0) {
                await prisma.goalProject.createMany({
                    data: linkedProjectIds.map((projectId: string) => ({
                        goalId: id,
                        projectId,
                    })),
                });
            }
        }

        const goal = await prisma.goal.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(category !== undefined && { category }),
                ...(timeframe !== undefined && { timeframe }),
                ...(successCriteria !== undefined && { successCriteria }),
                ...(why !== undefined && { why }),
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
        });
    } catch (error) {
        console.error('Failed to update goal:', error);
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }
}

// DELETE /api/goals/[id] - Delete goal
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.goal.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete goal:', error);
        return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }
}
