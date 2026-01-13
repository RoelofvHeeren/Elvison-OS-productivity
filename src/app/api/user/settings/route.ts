import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        // TODO: Auth
        const user = await prisma.user.findFirst();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        return NextResponse.json({
            reviewDayOfWeek: user.reviewDayOfWeek,
            reviewTimeHour: user.reviewTimeHour,
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { reviewDayOfWeek, reviewTimeHour } = body;

        // TODO: Auth
        const user = await prisma.user.findFirst();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                reviewDayOfWeek,
                reviewTimeHour
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
