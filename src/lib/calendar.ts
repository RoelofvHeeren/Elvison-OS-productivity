import { google } from 'googleapis';
import { prisma } from './db';



const getRedirectUri = () => {
    if (process.env.NEXT_PUBLIC_BASE_URL) {
        return `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`;
    }
    return 'http://localhost:3000/api/auth/google/callback';
};

export const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
);

export function getGoogleAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ],
        prompt: 'select_account consent',
    });
}

export async function setGoogleCredentials(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user || !user.googleAccessToken) {
        return null;
    }

    oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken || undefined,
        expiry_date: user.googleTokenExpiry?.getTime() || undefined,
    });

    // Check if token needs refresh
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    googleAccessToken: tokens.access_token,
                    googleRefreshToken: tokens.refresh_token,
                    googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                },
            });
        } else if (tokens.access_token) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    googleAccessToken: tokens.access_token,
                    googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                },
            });
        }
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
}
