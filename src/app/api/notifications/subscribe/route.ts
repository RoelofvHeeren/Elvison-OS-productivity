import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Use a fixed user ID for the single-user mode (or fetch from session if available later)
// For now, we'll try to find the first user or creating a default one if needed
async function getUserId() {
    const user = await prisma.user.findFirst();
    if (user) return user.id;

    // Fallback: create default user if none exists
    const newUser = await prisma.user.create({
        data: {
            email: 'user@elvison.os',
            name: 'Elvison User'
        }
    });
    return newUser.id;
}

export async function POST(request: NextRequest) {
    try {
        const subscription = await request.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            );
        }

        const userId = await getUserId();

        // Store or update the push subscription
        await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: {
                keys: subscription.keys ?? {},
                userId
            },
            create: {
                endpoint: subscription.endpoint,
                keys: subscription.keys ?? {},
                userId
            },
        });

        console.log('[Push] Subscription saved for user:', userId);

        return NextResponse.json({
            success: true,
            message: 'Subscription saved successfully',
        });
    } catch (error) {
        console.error('[Push] Subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to save subscription' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { endpoint } = await request.json();

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Endpoint required' },
                { status: 400 }
            );
        }

        await prisma.pushSubscription.delete({
            where: { endpoint },
        });

        console.log('[Push] Subscription removed');

        return NextResponse.json({
            success: true,
            message: 'Subscription removed',
        });
    } catch (error) {
        console.error('[Push] Unsubscribe error:', error);
        // Don't fail if already deleted
        return NextResponse.json({ success: true });
    }
}
