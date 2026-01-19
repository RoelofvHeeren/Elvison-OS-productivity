import { NextResponse } from 'next/server';
import { auth } from "@/auth"
import { generateStructuredOutputGemini } from '@/lib/gemini';

// Define the interface for the Gemini response
interface ProcessedTranscript {
    summary: string;
    tasks: Array<{
        title: string;
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        dueDate: string | null; // ISO Date string YYYY-MM-DD
    }>;
}

export const POST = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { transcript } = body;

        if (!transcript) {
            return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
        }

        const systemPrompt = `
You are an expert AI assistant helping Roelof van Heeren manage his work and life. 
Your task is to analyze a meeting transcript and extract valuable information.

1.  **Summary**: Create a concise, bulleted summary of the meeting. Focus on key decisions, updates, and action items.
2.  **Tasks**: Identify all tasks that are assigned to "Roelof", "Roelof van Heeren", "me" (if the context implies the speaker is assigning to Roelof, or if Roelof is capturing the note), or clearly meant for the user to handle.
    -   Ignore tasks clearly assigned to other people unless Roelof needs to oversee them.
    -   For each task, determine a priority (HIGH, MEDIUM, LOW) based on urgency and importance.
    -   If a specific date or deadline is mentioned, extract it as YYYY-MM-DD. Otherwise null.

Return the result ensuring complete JSON validity.
`;

        const result = await generateStructuredOutputGemini<ProcessedTranscript>(systemPrompt, transcript);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to process transcript:', error);
        return NextResponse.json({ error: 'Failed to process transcript' }, { status: 500 });
    }
});
