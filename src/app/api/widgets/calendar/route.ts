import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { google } from 'googleapis';

const MOCK_USER_ID = 'user-1';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('key');
    const token = searchParams.get('token');
    const headerSecret = request.headers.get('x-widget-secret');

    const VALID_SECRET = process.env.WIDGET_SECRET || 'elvison-widget-secret';

    if (secret !== VALID_SECRET && headerSecret !== VALID_SECRET) {
        return NextResponse.json({ error: 'Unauthorized: Invalid Secret' }, { status: 401 });
    }

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized: Missing Token' }, { status: 401 });
    }

    // Lookup user by token
    const user = await prisma.user.findUnique({
        where: { widgetToken: token }
    });

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized: Invalid Token' }, { status: 401 });
    }

    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Get Google Calendar integration
        // Get Google Calendar integration
        // TOKENS are directly on User
        let events: any[] = [];

        if (user.googleAccessToken) {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );

            oauth2Client.setCredentials({
                access_token: user.googleAccessToken,
                refresh_token: user.googleRefreshToken || undefined,
                expiry_date: user.googleTokenExpiry ? new Date(user.googleTokenExpiry).getTime() : undefined
            });

            // Refresh token if needed
            const expiryDate = user.googleTokenExpiry ? new Date(user.googleTokenExpiry).getTime() : 0;
            const isExpiring = !expiryDate || (expiryDate - Date.now() < 5 * 60 * 1000);

            if (isExpiring) {
                try {
                    const { credentials } = await oauth2Client.refreshAccessToken();
                    // Update DB with new tokens
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            googleAccessToken: credentials.access_token,
                            googleRefreshToken: credentials.refresh_token ?? user.googleRefreshToken, // keep old if not returned
                            googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined
                        }
                    });
                } catch (refreshError) {
                    console.error('Failed to refresh Google token:', refreshError);
                }
            }


            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            try {
                // Fetch primary calendar events
                const response = await calendar.events.list({
                    calendarId: 'primary',
                    timeMin: startOfDay.toISOString(),
                    timeMax: endOfDay.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime',
                });

                if (response.data.items) {
                    events = response.data.items.map(event => {
                        const start = event.start?.dateTime || event.start?.date;
                        const end = event.end?.dateTime || event.end?.date;
                        const isAllDay = !event.start?.dateTime;

                        return {
                            id: event.id,
                            title: event.summary || 'No Title',
                            start: start,
                            end: end,
                            isAllDay: isAllDay,
                            location: event.location,
                            htmlLink: event.htmlLink
                        };
                    });
                }
            } catch (calError: any) {
                console.error('Google Calendar API Error:', calError?.message || calError);
                // Allow partial failure, return empty events
            }
        }

        const data = {
            events: events,
            updatedAt: new Date().toISOString()
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch calendar widget data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
