import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { widgetToken: true }
    });

    // If token is somehow missing (old user), generate it
    if (user && !user.widgetToken) {
        const newToken = crypto.randomUUID();
        await prisma.user.update({
            where: { id: session.user.id },
            data: { widgetToken: newToken }
        });
        return NextResponse.json({ widgetToken: newToken });
    }

    return NextResponse.json({ widgetToken: user?.widgetToken });
}

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newToken = crypto.randomUUID();
    await prisma.user.update({
        where: { id: session.user.id },
        data: { widgetToken: newToken }
    });

    return NextResponse.json({ widgetToken: newToken });
}
