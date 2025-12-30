import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, priority, status, dueDate, dueTime, doToday, projectId } = body;

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(priority !== undefined && { priority }),
                ...(status !== undefined && { status }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(dueTime !== undefined && { dueTime: dueTime ? new Date(`1970-01-01T${dueTime}:00`) : null }),
                ...(doToday !== undefined && { doToday }),
                ...(projectId !== undefined && { projectId }),
            },
            include: {
                project: { select: { id: true, name: true } },
                subtasks: { orderBy: { order: 'asc' } },
            },
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error('Failed to update task:', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.task.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete task:', error);
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
