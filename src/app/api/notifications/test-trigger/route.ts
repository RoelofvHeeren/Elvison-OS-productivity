
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import { generateNotificationPayload } from '@/lib/notification-templates';

export async function POST(request: NextRequest) {
    try {
        const { type } = await request.json();

        // Ensure we handle authentication properly later
        // For now, get the first user just like the subscribe route
        const user = await prisma.user.findFirst();
        if (!user) {
            return NextResponse.json({ error: 'No user found' }, { status: 404 });
        }

        // Get payload
        const payload = await generateNotificationPayload(type, user.id);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
        }

        // Get all subscriptions for user
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId: user.id }
        });

        if (subscriptions.length === 0) {
            return NextResponse.json({ error: 'No push subscriptions found for user' }, { status: 404 });
        }

        let sentCount = 0;

        for (const sub of subscriptions) {
            try {
                // Must convert Prisma JSON keys to the object format expected by web-push
                const subscriptionObject = {
                    endpoint: sub.endpoint,
                    keys: sub.keys as any
                };

                const success = await sendNotification(subscriptionObject, JSON.stringify(payload));
                if (success) sentCount++;
            } catch (e) {
                console.error('Failed to send to sub', sub.id, e);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${type} notification to ${sentCount} devices`,
            payload
        });

    } catch (error) {
        console.error('Test Trigger Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
