import webpush from 'web-push';

export async function sendNotification(subscription: any, payload: string) {
    // Read env vars fresh on every call to avoid module-init caching issues
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
        console.error('[Push] Missing VAPID env vars:', { hasPublic: !!publicKey, hasPrivate: !!privateKey, hasSubject: !!subject });
        throw new Error('VAPID keys not configured');
    }

    // Log key prefixes for debugging (safe to log partial keys)
    console.log('[Push] Using VAPID keys:', {
        publicKeyStart: publicKey.substring(0, 10),
        privateKeyStart: privateKey.substring(0, 5),
        subject
    });

    webpush.setVapidDetails(subject, publicKey, privateKey);

    try {
        await webpush.sendNotification(subscription, payload);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
}
