import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/habits/[id] - Update habit
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, color, frequency, archived } = body;

        const habit = await prisma.habit.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(color !== undefined && { color }),
                ...(frequency !== undefined && { frequency }),
                ...(archived !== undefined && { archived }),
            },
        });

        return NextResponse.json(habit);
    } catch (error) {
        console.error('Failed to update habit:', error);
        return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
    }
}

// DELETE /api/habits/[id] - Delete habit
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.habit.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete habit:', error);
        return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
    }
}
