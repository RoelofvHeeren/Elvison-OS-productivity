import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MOCK_USER_ID = 'user-1';

// GET /api/knowledge - Fetch knowledge items
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    try {
        const items = await prisma.knowledgeItem.findMany({
            where: {
                userId: MOCK_USER_ID,
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
}

// POST /api/knowledge - Create knowledge item
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, category, content, tags, projectId } = body;

        // Ensure user exists (temporary fix for development)
        const userExists = await prisma.user.findUnique({ where: { id: MOCK_USER_ID } });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    id: MOCK_USER_ID,
                    email: 'demo@example.com',
                    name: 'Demo User'
                }
            });
        }

        const item = await prisma.knowledgeItem.create({
            data: {
                userId: MOCK_USER_ID,
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
}
