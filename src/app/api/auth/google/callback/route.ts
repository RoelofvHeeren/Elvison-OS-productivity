import { NextResponse } from 'next/server';
import { oauth2Client } from '@/lib/calendar';
import { prisma } from '@/lib/db';

const MOCK_USER_ID = 'user-1';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);

        // Update user with tokens
        await prisma.user.update({
            where: { id: MOCK_USER_ID },
            data: {
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
                googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            },
        });

        // Redirect back to dashboard or calendar page
        return NextResponse.redirect(new URL('/', request.url).toString());
    } catch (error) {
        console.error('Failed to get tokens:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
