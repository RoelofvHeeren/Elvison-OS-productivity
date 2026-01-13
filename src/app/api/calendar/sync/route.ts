import { NextResponse } from 'next/server';
import { setGoogleCredentials } from '@/lib/calendar';
import { prisma } from '@/lib/db';

import { auth } from "@/auth"

export const POST = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = req.auth.user.id;
    try {
        const calendar = await setGoogleCredentials(userId);
        if (!calendar) {
            return NextResponse.json({ error: 'Not authenticated with Google' }, { status: 401 });
        }

        // 1. Fetch events from Google (last 30 days and next 60 days)
        const timeMin = new Date();
        timeMin.setDate(timeMin.getDate() - 30);
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 60);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const googleEvents = response.data.items || [];

        // 2. Sync to local database
        const googleEventIds = new Set(googleEvents.map(e => e.id).filter(Boolean));

        const syncResults = await Promise.all(googleEvents.map(async (event) => {
            if (!event.id || !event.summary || !event.start?.dateTime || !event.end?.dateTime) return null;

            return prisma.calendarEvent.upsert({
                where: { externalId: event.id },
                update: {
                    title: event.summary,
                    description: event.description || null,
                    start: new Date(event.start.dateTime || event.start.date!),
                    end: new Date(event.end.dateTime || event.end.date!),
                    location: event.location || null,
                    allDay: !event.start.dateTime,
                },
                create: {
                    userId: userId,
                    externalId: event.id,
                    title: event.summary,
                    description: event.description || null,
                    start: new Date(event.start.dateTime || event.start.date!),
                    end: new Date(event.end.dateTime || event.end.date!),
                    location: event.location || null,
                    allDay: !event.start.dateTime,
                },
            });
        }));

        // 2.5 DELETE events that were deleted in Google Calendar
        // We look for events in our DB that are:
        // - In the sync time range (approx -30d to +60d)
        // - Source is GOOGLE
        // - ExternalId is NOT in googleEventIds

        await prisma.calendarEvent.deleteMany({
            where: {
                userId: userId,
                source: 'GOOGLE',
                start: {
                    gte: timeMin,
                    lte: timeMax
                },
                externalId: {
                    notIn: Array.from(googleEventIds) as string[]
                }
            }
        });

        // 3. Push tasks with deadlines to Google Calendar (if not already synced)
        const tasksToSync = await prisma.task.findMany({
            where: {
                userId: userId,
                dueDate: { not: null },
                calendarEventId: null,
            },
        });

        for (const task of tasksToSync) {
            try {
                // Construct Start Time
                const eventDate = new Date(task.dueDate!);
                // Check if task has a specific time set (stored in dueTime usually, but here we might need to fetch it or rely on existing field)
                // Wait, the `task` object here comes from `tasksToSync` query above.
                // We need to ensure `dueTime` is included in the query or logic.
                // Standardizing: 
                // If dueTime is present, use it. 
                // If not, default to 09:00.

                if (task.dueTime) {
                    eventDate.setHours(task.dueTime.getHours(), task.dueTime.getMinutes(), 0, 0);
                } else {
                    eventDate.setHours(9, 0, 0, 0);
                }

                const googleEvent = await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: {
                        summary: `Task: ${task.title}`,
                        description: `Scheduled from Elvison OS`,
                        start: { dateTime: eventDate.toISOString() },
                        end: { dateTime: new Date(eventDate.getTime() + 30 * 60000).toISOString() }, // 30 min duration
                    },
                });

                if (googleEvent.data.id) {
                    await prisma.task.update({
                        where: { id: task.id },
                        data: { calendarEventId: googleEvent.data.id },
                    });
                }
            } catch (e) {
                console.error(`Failed to sync task ${task.id} to Google:`, e);
            }
        }

        return NextResponse.json({
            success: true,
            syncedEvents: syncResults.filter(Boolean).length,
            syncedTasks: tasksToSync.length
        });
    } catch (error) {
        console.error('Failed to sync calendar:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
});
