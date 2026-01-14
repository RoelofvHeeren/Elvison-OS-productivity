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

        // 1. Fetch events from Google
        // Expanded range: last 90 days and next 180 days to catch more deletions
        const timeMin = new Date();
        timeMin.setDate(timeMin.getDate() - 90);
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 180);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            showDeleted: false, // Don't fetch already deleted ones
        });

        const googleEvents = response.data.items || [];

        // Filter out 'cancelled' events and those missing requirements
        const activeGoogleEvents = googleEvents.filter(e =>
            e.status !== 'cancelled' &&
            e.id &&
            e.summary &&
            (e.start?.dateTime || e.start?.date) &&
            (e.end?.dateTime || e.end?.date)
        );

        // 2. Sync to local database
        const googleEventIds = new Set(activeGoogleEvents.map(e => e.id));

        const syncResults = await Promise.all(activeGoogleEvents.map(async (event) => {
            const start = new Date(event.start?.dateTime || event.start?.date!);
            const end = new Date(event.end?.dateTime || event.end?.date!);

            return prisma.calendarEvent.upsert({
                where: { externalId: event.id! },
                update: {
                    title: event.summary!,
                    description: event.description || null,
                    start,
                    end,
                    location: event.location || null,
                    allDay: !event.start?.dateTime,
                    source: 'GOOGLE', // Ensure it's marked as GOOGLE
                },
                create: {
                    userId,
                    externalId: event.id!,
                    title: event.summary!,
                    description: event.description || null,
                    start,
                    end,
                    location: event.location || null,
                    allDay: !event.start?.dateTime,
                    source: 'GOOGLE',
                },
            });
        }));

        // 3. Cleanup stale local events
        // Events that exist locally with source='GOOGLE' but are NOT in the active Google list
        await prisma.calendarEvent.deleteMany({
            where: {
                userId,
                source: 'GOOGLE',
                externalId: {
                    notIn: Array.from(googleEventIds) as string[],
                    not: null,
                },
                // Only delete within the synced range to avoid wiping history outside it
                start: {
                    gte: timeMin,
                    lte: timeMax,
                },
            },
        });

        // 4. Push tasks with deadlines to Google Calendar
        const tasksToSync = await prisma.task.findMany({
            where: {
                userId,
                dueDate: { not: null },
                calendarEventId: null,
                status: { not: 'DONE' },
            },
        });

        for (const task of tasksToSync) {
            try {
                let resource: any;

                if (task.dueTime) {
                    // Specific time set: Create timed event
                    const dueTime = new Date(task.dueTime);
                    let startDateTime = new Date(task.dueDate!); // Default base

                    // If dueTime has year > 2000, use it as full timestamp source
                    if (dueTime.getFullYear() > 2000) {
                        startDateTime = dueTime;
                    } else {
                        // Legacy handling: reset date base
                        startDateTime.setHours(dueTime.getHours(), dueTime.getMinutes(), 0, 0);
                    }

                    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 min duration by default

                    resource = {
                        summary: `📌 ${task.title}`,
                        description: `Scheduled from Elvison OS`,
                        start: { dateTime: startDateTime.toISOString() },
                        end: { dateTime: endDateTime.toISOString() },
                    };
                } else {
                    // No time set: Create All-Day event
                    // Use the date string part YYYY-MM-DD to avoid timezone shifts
                    const dateStr = task.dueDate!.toISOString().split('T')[0];

                    resource = {
                        summary: `📌 ${task.title}`,
                        description: `Scheduled from Elvison OS`,
                        start: { date: dateStr },
                        end: { date: dateStr }, // For single all-day event, Google expects end date to be the next day? 
                        // Actually for single day, end should be start + 1 day for exclusive end.
                        // But typically same day works if inclusive? No, Google API says end is exclusive.
                    };

                    // Correction: End date must be next day for all-day event
                    const nextDay = new Date(task.dueDate!);
                    nextDay.setDate(nextDay.getDate() + 1);
                    const nextDayStr = nextDay.toISOString().split('T')[0];
                    resource.end.date = nextDayStr;
                }

                const googleEvent = await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: resource,
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
            syncedEvents: syncResults.length,
            syncedTasks: tasksToSync.length
        });
    } catch (error: any) {
        console.error('Failed to sync calendar:', error);

        // 401/Invalid credentials error from Google
        if (error.code === 401 || error.message?.includes('invalid_grant')) {
            return NextResponse.json({ error: 'Authentication expired', needsAuth: true }, { status: 401 });
        }

        return NextResponse.json({ error: 'Sync failed', details: error.message }, { status: 500 });
    }
});
