import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from "@/auth"

export const DELETE = auth(async (req, { params }) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before accessing its properties
    const resolvedParams = await params;

    if (!resolvedParams?.id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    try {
        await prisma.knowledgeItem.delete({
            where: {
                id: resolvedParams.id,
                userId: req.auth.user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete knowledge item:', error);
        return NextResponse.json({ error: 'Failed to delete knowledge item' }, { status: 500 });
    }
});
