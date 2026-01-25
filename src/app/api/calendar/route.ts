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
        // 1. Fetch tasks first to know which Google Events to hide (deduplication)
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

        // Collect external IDs of tasks to avoid showing the same event twice
        const taskExternalIds = tasks
            .map(t => t.calendarEventId)
            .filter((id): id is string => !!id);

        // 2. Fetch events, excluding those that are already represented by tasks
        const events = await prisma.calendarEvent.findMany({
            where: {
                userId: userId,
                // Exclude events that link to our tasks
                externalId: { notIn: taskExternalIds },
                ...(start && end && {
                    start: {
                        gte: new Date(start),
                        lte: new Date(end),
                    },
                }),
            },
            orderBy: { start: 'asc' },
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
                // Get user's timezone (you might want to store this in user settings)
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                const event = {
                    summary: title,
                    description: description,
                    location: location || null,
                    start: {
                        dateTime: new Date(start).toISOString(),
                        timeZone: timeZone,
                    },
                    end: {
                        dateTime: new Date(end).toISOString(),
                        timeZone: timeZone,
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

export async function PATCH(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await request.json();
        const { id, start, end, title, description, location } = body;

        if (!id) {
            return NextResponse.json({ error: "Event ID required" }, { status: 400 });
        }

        // 1. Fetch event
        const event = await prisma.calendarEvent.findUnique({
            where: { id },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (event.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        let googleUpdateError = null;

        // 2. Update Google Calendar if externalId exists
        if (event.externalId && event.source === 'GOOGLE') {
            try {
                const calendar = await setGoogleCredentials(userId);
                if (calendar) {
                    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                    const resource: any = {
                        summary: title || event.title,
                        description: description !== undefined ? description : event.description,
                        location: location !== undefined ? location : event.location,
                    };

                    // Only update time if provided
                    if (start) {
                        resource.start = {
                            dateTime: new Date(start).toISOString(),
                            timeZone
                        };
                    }
                    if (end) {
                        resource.end = {
                            dateTime: new Date(end).toISOString(),
                            timeZone
                        };
                    }

                    await calendar.events.patch({
                        calendarId: 'primary',
                        eventId: event.externalId,
                        requestBody: resource,
                    });
                }
            } catch (error: any) {
                console.error('Failed to update Google Calendar event:', error);
                googleUpdateError = error.message;
            }
        }

        // 3. Update local database
        const updatedEvent = await prisma.calendarEvent.update({
            where: { id },
            data: {
                title: title || undefined,
                description: description !== undefined ? description : undefined,
                location: location !== undefined ? location : undefined,
                start: start ? new Date(start) : undefined,
                end: end ? new Date(end) : undefined,
            },
        });

        return NextResponse.json({
            success: true,
            event: updatedEvent,
            googleUpdateError,
        });

    } catch (error) {
        console.error('Failed to update calendar event:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}
