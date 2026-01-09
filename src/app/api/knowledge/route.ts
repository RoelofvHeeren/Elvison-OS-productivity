import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { auth } from "@/auth"

// GET /api/knowledge - Fetch knowledge items
export const GET = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    try {
        const items = await prisma.knowledgeItem.findMany({
            where: {
                userId: userId,
                ...(category && { category: category as any }),
                ...(search && {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { content: { contains: search, mode: 'insensitive' } },
                        { tags: { hasSome: [search.toLowerCase()] } },
                    ],
                }),
            },
            include: {
                project: { select: { id: true, name: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error('Failed to fetch knowledge items:', error);
        return NextResponse.json({ error: 'Failed to fetch knowledge items' }, { status: 500 });
    }
});

// POST /api/knowledge - Create knowledge item
export const POST = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    try {
        const body = await req.json();
        const { title, category, content, tags, projectId } = body;



        const item = await prisma.knowledgeItem.create({
            data: {
                userId: userId,
                title,
                category: category || 'DOCUMENT',
                content: content || '',
                tags: tags || [],
                projectId: projectId || null,
            },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error('Failed to create knowledge item:', error);
        return NextResponse.json({ error: 'Failed to create knowledge item' }, { status: 500 });
    }
});
