
import webpush from 'web-push';

// HARDCODED VAPID KEYS FOR DEBUGGING
const PUBLIC_KEY = 'BIJ4OI6UUZcvrEr8IJYb-9dGkFJ3qmBHQhUxvFFcu_cfIKXfwYs7gz-aPG0fVgTodMNuNqpB97KLYgRdTQvnJ4A';
const PRIVATE_KEY = 'ygvs6Pn4qYoZAIFDU68MZ7cbobAhXD7Gg6KWXfQEO8g';

console.log('[Init] Hardcoded VAPID keys being used');

webpush.setVapidDetails(
    'mailto:admin@elvison.os', // Changed email slightly
    PUBLIC_KEY,
    PRIVATE_KEY
);

export async function sendNotification(subscription: any, payload: string) {
    try {
        await webpush.sendNotification(subscription, payload);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
}
