
import webpush from 'web-push';

if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    console.error('Missing VAPID env vars');
    // We don't throw error here to avoid crashing the whole app, but push won't work
} else {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
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
