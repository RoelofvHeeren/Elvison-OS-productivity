import { NextResponse } from 'next/server';
import { generateStructuredOutput } from '@/lib/openai';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { wins, challenges, insights, weekNotes } = body;

        const summary = await generateStructuredOutput<{ summary: string; suggestions: string }>(
            `You are an expert productivity coach using the "Week Review" methodology. 
            Analyze the user's weekly review input and provide:
            1. A concise, encouraging summary of their week (max 2-3 sentences).
            2. One or two high-impact suggestions for next week based on their challenges and insights.
            
            Return JSON with keys: 'summary' and 'suggestions'.`,

            `Wins: ${JSON.stringify(wins)}
            Challenges: ${JSON.stringify(challenges)}
            Insights: ${JSON.stringify(insights)}
            Week Notes: ${weekNotes}`
        );

        return NextResponse.json({
            summary: summary.summary,
            suggestions: summary.suggestions
        });

    } catch (error) {
        console.error('Error generating AI summary:', error);
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
}
