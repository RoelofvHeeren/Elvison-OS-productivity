import { NextRequest, NextResponse } from 'next/server';
import { openai, generateStructuredOutput } from '@/lib/openai';
import { TASK_INGESTION_PROMPT, TaskIngestionResult } from '@/ai/agents/task-ingestion';

export async function POST(request: NextRequest) {
    try {
        const { input } = await request.json();

        if (!input || typeof input !== 'string') {
            return NextResponse.json(
                { error: 'Input is required' },
                { status: 400 }
            );
        }

        // Get current date for context
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

        // Replace placeholders in prompt
        const contextualPrompt = TASK_INGESTION_PROMPT
            .replace(/\{\{TODAY\}\}/g, todayStr)
            .replace(/\{\{END_OF_WEEK\}\}/g, endOfWeekStr);

        const result = await generateStructuredOutput<TaskIngestionResult>(
            contextualPrompt + `\n\nToday's date is: ${todayStr}`,
            `Convert this to a task: "${input}"`
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Task ingestion error:', error);
        return NextResponse.json(
            { error: 'Failed to process task' },
            { status: 500 }
        );
    }
}
