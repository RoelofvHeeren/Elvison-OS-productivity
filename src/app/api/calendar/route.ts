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

        const taskEvents = tasks.map(task => {
            let startDate = new Date(task.dueDate!); // Default to dueDate date part

            if (task.dueTime) {
                const dueTime = new Date(task.dueTime);
                if (dueTime.getFullYear() > 2000) {
                    // It's a full ISO timestamp
                    startDate = dueTime;
                } else {
                    // Legacy time-only (1970 base), merge with dueDate
                    startDate.setHours(dueTime.getHours(), dueTime.getMinutes(), 0, 0);
                }
            } else {
                // If no specific time, maybe default to 9am or keep it?
                // Actually, if no time, it probably should be an all-day event or defaults.
                // Current behavior was 8am/9am. Let's start at 9am if no time.
                startDate.setHours(9, 0, 0, 0);
            }

            return {
                id: `task-${task.id}`,
                title: `📌 ${task.title}`,
                start: startDate,
                end: new Date(startDate.getTime() + 30 * 60000), // 30 min duration
                allDay: !task.dueTime, // Treat as all-day if no time specified? User said "it's set for 8am", maybe they prefer all-day visual?
                // Actually, if dueTime is null, let's make it ALL DAY so it floats at top.
                source: 'LOCAL_TASK',
                status: task.status,
                originalTaskId: task.id, // Pass ID for editing
            };
        });

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
export async function DELETE(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
        return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    try {
        // 1. Fetch the event to check ownership and get externalId
        const event = await prisma.calendarEvent.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (event.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        let googleDeleteError = null;

        // 2. Try to delete from Google if it has an external ID
        if (event.externalId && event.source === 'GOOGLE') {
            try {
                const calendar = await setGoogleCredentials(userId);
                if (calendar) {
                    await calendar.events.delete({
                        calendarId: 'primary',
                        eventId: event.externalId,
                    });
                }
            } catch (error: any) {
                console.error('Failed to delete from Google Calendar:', error);
                // If it's already gone (404) or other error, we record it but proceed to delete local
                if (error.code !== 404) {
                    googleDeleteError = error.message;
                }
            }
        }

        // 3. Delete from local database
        await prisma.calendarEvent.delete({
            where: { id: eventId },
        });

        return NextResponse.json({
            success: true,
            googleDeleteError,
        });
    } catch (error) {
        console.error('Failed to delete calendar event:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
