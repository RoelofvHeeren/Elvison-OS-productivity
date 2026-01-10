import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { timezone } = await req.json();

        if (!timezone || typeof timezone !== 'string') {
            return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
        }

        // Validate timezone string
        try {
            Intl.DateTimeFormat(undefined, { timeZone: timezone });
        } catch (e) {
            return NextResponse.json({ error: 'Invalid timezone format' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { timezone },
        });

        return NextResponse.json({ success: true, timezone });
    } catch (error) {
        console.error('Error updating timezone:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
