import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/habits/[id]/log - Log habit completion for a date
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { date } = body;

        const logDate = new Date(date);
        logDate.setHours(0, 0, 0, 0);

        // Check if trying to log for a future date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (logDate > today) {
            return NextResponse.json(
                { error: 'Cannot log habits for future dates' },
                { status: 400 }
            );
        }

        // Upsert the log (create if not exists, update if exists)
        const log = await prisma.habitLog.upsert({
            where: {
                habitId_date: {
                    habitId: id,
                    date: logDate,
                },
            },
            update: {
                completed: true,
            },
            create: {
                habitId: id,
                date: logDate,
                completed: true,
            },
        });

        return NextResponse.json(log, { status: 201 });
    } catch (error) {
        console.error('Failed to log habit:', error);
        return NextResponse.json({ error: 'Failed to log habit' }, { status: 500 });
    }
}

// DELETE /api/habits/[id]/log - Remove habit completion log
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        const logDate = new Date(date);
        logDate.setHours(0, 0, 0, 0);

        // Check if trying to modify a future date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (logDate > today) {
            return NextResponse.json(
                { error: 'Cannot modify habits for future dates' },
                { status: 400 }
            );
        }

        await prisma.habitLog.delete({
            where: {
                habitId_date: {
                    habitId: id,
                    date: logDate,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to remove habit log:', error);
        return NextResponse.json({ error: 'Failed to remove habit log' }, { status: 500 });
    }
}
