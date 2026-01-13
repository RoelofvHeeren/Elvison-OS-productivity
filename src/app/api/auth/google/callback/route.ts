import { NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/calendar';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', request.url).toString());
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const client = getOAuth2Client();
        const { tokens } = await client.getToken(code);

        // Update user with tokens
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
                googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            },
        });

        // Redirect back to calendar page
        return NextResponse.redirect(new URL('/calendar', request.url).toString());
    } catch (error) {
        console.error('Failed to get tokens:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
