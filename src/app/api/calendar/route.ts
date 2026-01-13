import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setGoogleCredentials } from '@/lib/calendar';
import { auth } from "@/auth"

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    try {
        const events = await prisma.calendarEvent.findMany({
            where: {
                userId: userId,
                ...(start && end && {
                    start: {
                        gte: new Date(start),
                        lte: new Date(end),
                    },
                }),
            },
            orderBy: { start: 'asc' },
        });

        // Also fetch tasks as events
        const tasks = await prisma.task.findMany({
            where: {
                userId: userId,
                dueDate: { not: null },
                status: { not: 'DONE' },
                ...(start && end && {
                    dueDate: {
                        gte: new Date(start),
                        lte: new Date(end),
                    },
                }),
            },
        });

        const taskEvents = tasks.map(task => ({
            id: `task-${task.id}`,
            title: `📌 ${task.title}`,
            start: task.dueDate,
            end: new Date(task.dueDate!.getTime() + 30 * 60000),
            allDay: false,
            source: 'LOCAL_TASK',
            status: task.status,
        }));

        return NextResponse.json([...events, ...taskEvents]);
    } catch (error) {
        console.error('Failed to fetch calendar events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    try {
        const body = await request.json();
        const { title, description, start, end, attendees, location } = body;

        let googleEventId = null;
        let syncError = null;

        // 1. Try to sync with Google if connected
        try {
            const calendar = await setGoogleCredentials(userId);
            if (calendar) {
                const event = {
                    summary: title,
                    description: description,
                    location: location || null,
                    start: {
                        dateTime: new Date(start).toISOString(),
                    },
                    end: {
                        dateTime: new Date(end).toISOString(),
                    },
                    attendees: attendees ? attendees.map((email: string) => ({ email })) : [],
                };

                const response = await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: event,
                    sendUpdates: 'all', // This sends the email invites
                });
                googleEventId = response.data.id;
            }
        } catch (error: any) {
            console.error('Google sync failed during creation:', error);
            syncError = error.message || 'Sync failed';
            // We continue anyway to save locally
        }

        // 2. Save locally regardless of sync status
        const localEvent = await prisma.calendarEvent.create({
            data: {
                userId,
                title,
                description,
                location,
                start: new Date(start),
                end: new Date(end),
                externalId: googleEventId,
                source: googleEventId ? 'GOOGLE' : 'LOCAL',
            }
        });

        return NextResponse.json({
            success: true,
            event: localEvent,
            synced: !!googleEventId,
            syncError
        });
    } catch (error) {
        console.error('Failed to create calendar event:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
