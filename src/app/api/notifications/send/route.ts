import { NextRequest, NextResponse } from 'next/server';

// For production, you'd use web-push library
// import webpush from 'web-push';
// webpush.setVapidDetails(
//   'mailto:your-email@example.com',
//   process.env.VAPID_PUBLIC_KEY!,
//   process.env.VAPID_PRIVATE_KEY!
// );

interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, unknown>;
    actions?: Array<{ action: string; title: string }>;
}

export async function POST(request: NextRequest) {
    try {
        const { subscription, notification } = await request.json();

        if (!subscription || !notification) {
            return NextResponse.json(
                { error: 'Subscription and notification data required' },
                { status: 400 }
            );
        }

        const payload: NotificationPayload = {
            title: notification.title || 'Elvison OS',
            body: notification.body || 'You have a new notification',
            icon: notification.icon || '/icons/icon-192x192.png',
            badge: notification.badge || '/icons/icon-72x72.png',
            tag: notification.tag || 'elvison-notification',
            data: notification.data || {},
            actions: notification.actions || [],
        };

        // In production, you'd send the push notification:
        // await webpush.sendNotification(subscription, JSON.stringify(payload));

        console.log('[Push] Would send notification:', payload);

        return NextResponse.json({
            success: true,
            message: 'Notification sent',
        });
    } catch (error) {
        console.error('[Push] Send error:', error);
        return NextResponse.json(
            { error: 'Failed to send notification' },
            { status: 500 }
        );
    }
}

// Test endpoint to trigger a sample notification
export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Push notification API ready',
        usage: {
            method: 'POST',
            body: {
                subscription: 'PushSubscription object from navigator.serviceWorker',
                notification: {
                    title: 'Notification title',
                    body: 'Notification body',
                    data: { url: '/tasks' },
                },
            },
        },
    });
}
