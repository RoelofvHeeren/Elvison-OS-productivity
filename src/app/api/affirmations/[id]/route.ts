import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/affirmations/[id] - Update affirmation
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { content, active } = body;

        const affirmation = await prisma.affirmation.update({
            where: { id },
            data: {
                ...(content !== undefined && { content }),
                ...(active !== undefined && { active }),
            },
        });

        return NextResponse.json(affirmation);
    } catch (error) {
        console.error('Failed to update affirmation:', error);
        return NextResponse.json({ error: 'Failed to update affirmation' }, { status: 500 });
    }
}

// DELETE /api/affirmations/[id] - Delete affirmation
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.affirmation.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete affirmation:', error);
        return NextResponse.json({ error: 'Failed to delete affirmation' }, { status: 500 });
    }
}
