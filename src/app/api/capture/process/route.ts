import { NextRequest, NextResponse } from 'next/server';
import { generateStructuredOutputGemini, transcribeAudioGemini } from '@/lib/gemini';
import { prisma } from '@/lib/db';

import { auth } from "@/auth"
import { google } from 'googleapis';

// Schema for the AI output
interface CaptureResult {
    type: 'TASK' | 'NOTE' | 'REMINDER';
    title: string;
    content?: string;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate?: string;  // For tasks
    datetime?: string; // For reminders
    projectId?: string;
    projectId?: string;
    projectName?: string;
    // Event specific
    startDateTime?: string;
    endDateTime?: string;
    location?: string;
    attendees?: string[];
}

export const POST = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    try {
        const formData = await req.formData();
        const file = formData.get('audio') as Blob | null;
        let text = formData.get('text') as string | null;
        const mode = formData.get('mode') as string || 'task';
        const action = formData.get('action') as string || 'parse'; // 'parse' or 'save'
        const timezone = formData.get('timezone') as string || 'UTC';

        // If action is 'save', we receive the approved data and save it
        if (action === 'save') {
            const itemData = JSON.parse(formData.get('data') as string);

            if (itemData.type === 'EVENT') {
                // Save to Google Calendar
                const user = await prisma.user.findUnique({
                    where: { id: userId }
                });

                if (!user || !user.googleAccessToken) {
                    return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
                }

                const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET
                );

                oauth2Client.setCredentials({
                    access_token: user.googleAccessToken,
                    refresh_token: user.googleRefreshToken || undefined,
                    expiry_date: user.googleTokenExpiry ? Number(user.googleTokenExpiry) : undefined
                });

                // Refresh if needed
                if (oauth2Client.isTokenExpiring()) {
                    const { credentials } = await oauth2Client.refreshAccessToken();
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            googleAccessToken: credentials.access_token,
                            googleRefreshToken: credentials.refresh_token ?? user.googleRefreshToken,
                            googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined
                        }
                    });
                }

                const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

                const event = {
                    summary: itemData.title,
                    description: itemData.content || '',
                    start: { dateTime: itemData.startDateTime }, // ISO strings
                    end: { dateTime: itemData.endDateTime },
                    location: itemData.location,
                    attendees: itemData.attendees ? itemData.attendees.map((email: string) => ({ email })) : [],
                };

                const res = await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: event,
                });

                return NextResponse.json({ success: true, item: res.data, type: 'EVENT' });

            } else if (itemData.type === 'TASK') {
                const task = await prisma.task.create({
                    data: {
                        userId: userId,
                        title: itemData.title,
                        priority: itemData.priority || 'MEDIUM',
                        dueDate: itemData.dueDate ? new Date(itemData.dueDate) : null,
                        projectId: itemData.projectId || null,
                        status: 'TODO',
                        doToday: true, // Mark as today's task
                    }
                });
                return NextResponse.json({ success: true, item: task, type: 'TASK' });
            } else if (itemData.type === 'REMINDER') {
                // Save as Reminder
                const reminderDatetime = itemData.datetime || itemData.dueDate;
                if (!reminderDatetime) {
                    return NextResponse.json({ error: 'Reminder requires a datetime' }, { status: 400 });
                }
                const reminder = await prisma.reminder.create({
                    data: {
                        userId: userId,
                        title: itemData.title,
                        datetime: new Date(reminderDatetime),
                        type: 'CUSTOM',
                    }
                });
                return NextResponse.json({ success: true, item: reminder, type: 'REMINDER' });
            } else {
                // Save as Note in Knowledge Base with NOTE category
                const note = await prisma.knowledgeItem.create({
                    data: {
                        userId: userId,
                        title: itemData.title,
                        content: itemData.content || '',
                        category: 'NOTE',
                        tags: ['quick-capture', 'voice-note'],
                    }
                });
                return NextResponse.json({ success: true, item: note, type: 'NOTE' });
            }
        }

        // Otherwise, parse the audio/text and return candidate for review
        if (file) {
            console.log('[Capture] Transcribing audio with Gemini...');
            const buffer = Buffer.from(await file.arrayBuffer());

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

        // Fetch Context (Active Projects)
        const projects = await prisma.project.findMany({
            where: { userId: userId, status: 'ACTIVE' },
            select: { id: true, name: true }
        });
        const projectList = projects.map(p => `"${p.name}" (ID: ${p.id})`).join(', ');

        // Determine the output type based on mode
        const modeType = mode === 'reminder' ? 'REMINDER' : mode === 'note' ? 'NOTE' : mode === 'calendar' ? 'EVENT' : 'TASK';

        // AI Processing with Gemini
        const systemPrompt = `
        You are an intelligent productivity assistant for "Elvison OS".
        Your goal is to parse user voice transcripts into structured items.

        CONTEXT:
        - Mode: ${mode.toUpperCase()}
        - Expected Type: ${modeType}
        - User Timezone: ${timezone}
        - Current Time (in user timezone): ${new Date().toLocaleString('en-US', { timeZone: timezone })}
        - Today's Date: ${new Date().toISOString()} (UTC base)
        - Active Projects: ${projectList || 'None'}

        CRITICAL DATE/TIME RULES:
        1. interpret all relative time ("tomorrow", "at 5pm") based on the "Current Time (in user timezone)" provided above.
        2. RETURN ALL DATES (dueDate, datetime) AS ISO 8601 STRINGS CONVERTED TO UTC, but preserving the user's intended absolute moment in time.
           - Example: If user says "5pm" and they are in New York (UTC-5), return the ISO string for 22:00 UTC.

        ${modeType === 'TASK' ? `
        INSTRUCTIONS FOR TASK:
        1. **Title**: Generate a CONCISE, ACTIONABLE title from the transcript. Do NOT just copy the full transcript. 
           - Example Transcript: "I need to call Peter tomorrow at 5pm to discuss the marketing budget."
           - Good Title: "Call Peter re: Marketing Budget"
        2. **Due Date (dueDate)**: Extract any mentioned deadline. "Tomorrow 9am", "Next Friday", "In 2 hours". Return as ISO string.
        3. **Project**: Look for project names in the transcript. Fuzzy match against the "Active Projects" list. 
           - If no project is found, leave projectId null.
           - If you find a matching project, also return projectName.
        4. **Priority**: Default to MEDIUM. Set HIGH if urgency is implied ("ASAP", "Urgent", "Important").
        ` : ''}

        ${modeType === 'REMINDER' ? `
        INSTRUCTIONS FOR REMINDER:
        1. **Title**: Generate a CONCISE reminder title from the transcript.
           - Example Transcript: "Remind me to pick up groceries at 6pm today"
           - Good Title: "Pick up groceries"
        2. **Datetime (datetime)**: Extract the exact time for the reminder. This is REQUIRED for reminders.
           - "At 3pm", "Tomorrow morning", "In 30 minutes", "Tonight at 8"
           - Return as ISO string. If no time is specified, default to 1 hour from now.
        ` : ''}

        ${modeType === 'NOTE' ? `
        INSTRUCTIONS FOR NOTE:
        1. **Title**: Generate a short summary title for the note.
        2. **Content**: Clean up the transcript into nice markdown, preserving the key information.
        ` : ''}

        ${modeType === 'EVENT' ? `
        INSTRUCTIONS FOR CALENDAR EVENT:
        1. **Title**: Generate a clear, concise event title.
           - Example: "Lunch with John"
        2. **Start/End Time**: Extract start and end times. 
           - **startDateTime**: ISO string (UTC).
           - **endDateTime**: ISO string (UTC). If duration is not specified, assume 1 hour.
        3. **Attendees**: Extract any mentioned names or emails who are invited.
           - Return an array of potential email addresses if mentioned (or placeholders if just names).
        4. **Location**: Extract location if mentioned.
        ` : ''}

        RESPOND WITH THIS EXACT JSON STRUCTURE:
        {
            "type": "${modeType}",
            "title": "...",
            ${modeType === 'NOTE' ? '"content": "..." (the note content in markdown),' : ''}
            ${modeType === 'TASK' ? '"priority": "HIGH" | "MEDIUM" | "LOW",' : ''}
            ${modeType === 'TASK' ? '"dueDate": "ISO string or null",' : ''}
            ${modeType === 'REMINDER' ? '"datetime": "ISO string (REQUIRED)",' : ''}
            ${modeType === 'TASK' ? '"projectId": "UUID or null",' : ''}
            ${modeType === 'TASK' ? '"projectName": "Project name or null",' : ''}
            ${modeType === 'EVENT' ? '"startDateTime": "ISO string",' : ''}
            ${modeType === 'EVENT' ? '"endDateTime": "ISO string",' : ''}
            ${modeType === 'EVENT' ? '"location": "string or null",' : ''}
            ${modeType === 'EVENT' ? '"attendees": ["email1", "email2"],' : ''}
        }
        `;

        const result = await generateStructuredOutputGemini<CaptureResult>(
            systemPrompt,
            text
        );

        // Ensure proper type is set in result
        result.type = modeType;

        // Return candidate for review (not saved yet!)
        return NextResponse.json({
            success: true,
            candidate: result,
            originalText: text,
            projects: projects // Send project list for editing
        });

    } catch (error) {
        console.error('[Capture] Error:', error);
        return NextResponse.json({ error: 'Processing failed', details: String(error) }, { status: 500 });
    }
});
