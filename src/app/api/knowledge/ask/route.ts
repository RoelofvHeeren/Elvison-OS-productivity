import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { prisma } from '@/lib/db';

const MOCK_USER_ID = 'user-1';

// POST /api/knowledge/ask - AI query against knowledge base
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { query } = body;

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Fetch all knowledge items for context
        const items = await prisma.knowledgeItem.findMany({
            where: { userId: MOCK_USER_ID },
            select: { title: true, category: true, content: true, tags: true },
        });

        if (items.length === 0) {
            return NextResponse.json({
                answer: "Your knowledge base is empty. Add some documents, prompts, or references first.",
                sources: [],
            });
        }

        interface KnowledgeItem {
            id: string;
            title: string;
            category: string;
            content: string;
            tags: string[];
        }

        // Build context from knowledge items
        const context = (items as unknown as KnowledgeItem[]).map((item: KnowledgeItem, i: number) =>
            `[${i + 1}] ${item.title} (${item.category})\n${item.content}\nTags: ${item.tags.join(', ')}`
        ).join('\n\n---\n\n');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful assistant with access to the user's knowledge base. Answer questions based on the provided knowledge items. Always cite which items you referenced using their titles. If the answer isn't in the knowledge base, say so.

Knowledge Base Contents:
${context}`,
                },
                {
                    role: 'user',
                    content: query,
                },
            ],
            max_tokens: 1000,
            temperature: 0.3,
        });

        const answer = completion.choices[0]?.message?.content?.trim() || 'Unable to generate response.';

        // Find which items were likely referenced (simple title matching)
        const sources = (items as unknown as KnowledgeItem[])
            .filter((item: KnowledgeItem) => answer.toLowerCase().includes(item.title.toLowerCase()))
            .map((item: KnowledgeItem) => item.title);

        return NextResponse.json({ answer, sources });
    } catch (error) {
        console.error('Failed to query knowledge base:', error);
        return NextResponse.json({ error: 'Failed to query knowledge base' }, { status: 500 });
    }
}
