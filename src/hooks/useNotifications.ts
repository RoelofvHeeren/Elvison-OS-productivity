'use client';

import { useState, useEffect, useCallback } from 'react';

interface NotificationPermissionState {
    permission: NotificationPermission;
    isSupported: boolean;
    subscription: PushSubscription | null;
}

export function useNotifications() {
    const [state, setState] = useState<NotificationPermissionState>({
        permission: 'default',
        isSupported: false,
        subscription: null,
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check if notifications are supported
        const isSupported = 'Notification' in window && 'serviceWorker' in navigator;

        setState((prev) => ({
            ...prev,
            isSupported,
            permission: isSupported ? Notification.permission : 'denied',
        }));

        // Get existing subscription
        if (isSupported && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then((registration) => {
                registration.pushManager.getSubscription().then((sub) => {
                    setState((prev) => ({ ...prev, subscription: sub }));
                });
            });
        }
    }, []);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!state.isSupported) {
            console.warn('[Notifications] Not supported in this browser');
            return false;
        }

        setIsLoading(true);

        try {
            const permission = await Notification.requestPermission();

            setState((prev) => ({ ...prev, permission }));

            if (permission === 'granted') {
                // Subscribe to push notifications
                const registration = await navigator.serviceWorker.ready;

                // In production, you'd use your VAPID public key here
                // const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                // const subscription = await registration.pushManager.subscribe({
                //   userVisibleOnly: true,
                //   applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                // });

                console.log('[Notifications] Permission granted');
                return true;
            }

            return false;
        } catch (error) {
            console.error('[Notifications] Error requesting permission:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [state.isSupported]);

    const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
        if (state.permission !== 'granted') {
            const granted = await requestPermission();
            if (!granted) return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // For demo purposes, we'll just get/create a subscription
            // In production, you'd provide your VAPID public key
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                // Note: This will fail without a valid VAPID key
                // subscription = await registration.pushManager.subscribe({
                //   userVisibleOnly: true,
                //   applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                // });
            }

            if (subscription) {
                // Save subscription to server
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription.toJSON()),
                });

                setState((prev) => ({ ...prev, subscription }));
            }

            return subscription;
        } catch (error) {
            console.error('[Notifications] Subscribe error:', error);
            return null;
        }
    }, [state.permission, requestPermission]);

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!state.subscription) return true;

        try {
            await state.subscription.unsubscribe();

            // Remove from server
            await fetch('/api/notifications/subscribe', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: state.subscription.endpoint }),
            });

            setState((prev) => ({ ...prev, subscription: null }));
            return true;
        } catch (error) {
            console.error('[Notifications] Unsubscribe error:', error);
            return false;
        }
    }, [state.subscription]);

    const showLocalNotification = useCallback(async (
        title: string,
        options?: NotificationOptions
    ): Promise<boolean> => {
        if (state.permission !== 'granted') {
            const granted = await requestPermission();
            if (!granted) return false;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                vibrate: [100, 50, 100],
                ...options,
            });
            return true;
        } catch (error) {
            console.error('[Notifications] Show notification error:', error);
            return false;
        }
    }, [state.permission, requestPermission]);

    return {
        ...state,
        isLoading,
        requestPermission,
        subscribe,
        unsubscribe,
        showLocalNotification,
    };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

export default useNotifications;
