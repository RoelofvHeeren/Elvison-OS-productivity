import { NextRequest, NextResponse } from 'next/server';
import { generateStructuredOutputGemini, transcribeAudioGemini } from '@/lib/gemini';
import { prisma } from '@/lib/db';

const MOCK_USER_ID = 'user-1';

// Schema for the AI output
interface CaptureResult {
    type: 'TASK' | 'NOTE';
    title: string;
    content?: string; // For notes
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate?: string; // ISO string or null
    projectId?: string; // UUID
    projectError?: string; // If project mentioned but not found
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('audio') as Blob | null;
        let text = formData.get('text') as string | null;
        const mode = formData.get('mode') as string || 'task';

        // 1. Transcribe if audio using Gemini
        if (file) {
            console.log('[Capture] Transcribing audio with Gemini...');
            const buffer = Buffer.from(await file.arrayBuffer());

            // Verify buffer
            if (buffer.length === 0) {
                throw new Error("Audio buffer is empty");
            }

            const mime = file.type || 'audio/mp4';
            console.log(`[Capture] Processing filetype: ${mime}`);

            text = await transcribeAudioGemini(buffer, mime);
            console.log('[Capture] Transcription:', text);
        }

        if (!text) {
            return NextResponse.json({ error: 'No input provided' }, { status: 400 });
        }

        // 2. Fetch Context (Active Projects)
        const projects = await prisma.project.findMany({
            where: { userId: MOCK_USER_ID, status: 'ACTIVE' },
            select: { id: true, name: true }
        });
        const projectList = projects.map(p => `"${p.name}" (ID: ${p.id})`).join(', ');

        // 3. AI Processing with Gemini
        const systemPrompt = `
        You are an intelligent productivity assistant for "Elvison OS".
        Your goal is to parse user voice transcripts into structured items.

        CONTEXT:
        - Mode: ${mode.toUpperCase()} (Task/Reminder = TASK, Note = NOTE)
        - Today's Date: ${new Date().toISOString()} (User is in user-local timezone, treat relative dates like "tomorrow" relative to this)
        - Active Projects: ${projectList}

        INSTRUCTIONS FOR TASK/REMINDER:
        1. **Title**: Generate a CONCISE, ACTIONABLE title from the transcript. Do NOT just copy the full transcript. 
           - Example Transcript: "I need to call Peter tomorrow at 5pm to discuss the marketing budget."
           - Good Title: "Call Peter re: Marketing Budget"
        2. **Due Date**: Extract any mentioned deadline. "Tomorrow 9am", "Next Friday", "In 2 hours". Return as ISO string.
        3. **Project**: Look for project names in the transcript. Fuzzy match against the "Active Projects" list. 
           - If "Elvison OS" is mentioned and you have a project named "Elvison OS", link it.
           - If no project is found, leave projectId null.
        4. **Priority**: Default to MEDIUM. Set HIGH if urgency is implied ("ASAP", "Urgent", "Important").

        INSTRUCTIONS FOR NOTE:
        - Title: Generate a short summary title.
        - Content: Clean up the transcript into nice markdown.

        RESPOND WITH THIS EXACT JSON STRUCTURE:
        {
            "type": "TASK" or "NOTE",
            "title": "...",
            "content": "..." (only for notes),
            "priority": "HIGH" | "MEDIUM" | "LOW",
            "dueDate": "ISO string or null",
            "projectId": "UUID or null"
        }
        `;

        const result = await generateStructuredOutputGemini<CaptureResult>(
            systemPrompt,
            text
        );

        // 4. Database Creation
        if (result.type === 'TASK') {
            const task = await prisma.task.create({
                data: {
                    userId: MOCK_USER_ID,
                    title: result.title,
                    priority: result.priority || 'MEDIUM',
                    dueDate: result.dueDate ? new Date(result.dueDate) : null,
                    projectId: result.projectId || null,
                    status: 'TODO'
                }
            });
            return NextResponse.json({ success: true, item: task, type: 'TASK', originalText: text });
        } else {
            // Note
            const note = await prisma.knowledgeItem.create({
                data: {
                    userId: MOCK_USER_ID,
                    title: result.title,
                    content: result.content || text,
                    category: 'PROMPT', // Default category for quick notes
                    tags: ['quick-capture'],
                }
            });
            return NextResponse.json({ success: true, item: note, type: 'NOTE', originalText: text });
        }

    } catch (error) {
        console.error('[Capture] Error:', error);
        return NextResponse.json({ error: 'Processing failed', details: String(error) }, { status: 500 });
    }
}
