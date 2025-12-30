import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

// POST /api/affirmations/rewrite - AI rewrite suggestion
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert at crafting powerful, personal affirmations. 
Rewrite the given affirmation to be more impactful while maintaining its core meaning.
The rewritten affirmation should:
- Be in first person ("I am...", "I...")
- Be present tense
- Be positive (no negatives)
- Be specific and vivid
- Evoke emotion and conviction
Return ONLY the rewritten affirmation, nothing else.`,
                },
                {
                    role: 'user',
                    content: `Rewrite this affirmation: "${content}"`,
                },
            ],
            max_tokens: 150,
            temperature: 0.7,
        });

        const suggestion = completion.choices[0]?.message?.content?.trim();

        if (!suggestion) {
            return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 });
        }

        return NextResponse.json({ original: content, suggestion });
    } catch (error) {
        console.error('Failed to rewrite affirmation:', error);
        return NextResponse.json({ error: 'Failed to rewrite affirmation' }, { status: 500 });
    }
}
