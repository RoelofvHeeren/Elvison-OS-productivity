
import webpush from 'web-push';

if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not set. Push notifications will not work via server.');
} else {
    webpush.setVapidDetails(
        'mailto:support@elvison.os',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function sendNotification(subscription: any, payload: string) {
    try {
        await webpush.sendNotification(subscription, payload);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
}
