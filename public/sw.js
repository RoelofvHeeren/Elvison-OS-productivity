// Elvison OS Service Worker
// Version: 1.0.0

const CACHE_NAME = 'elvison-os-v1';
const STATIC_CACHE = 'elvison-static-v1';
const DYNAMIC_CACHE = 'elvison-dynamic-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/Transparent Logo Elvison.png',
];

// Pages to cache for offline access
const PAGES_TO_CACHE = [
    '/',
    '/tasks',
    '/habits',
    '/calendar',
    '/projects',
    '/goals',
    '/manifestation',
    '/knowledge',
    '/weekly-review',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API requests (we don't want to cache dynamic data)
    if (url.pathname.startsWith('/api/')) return;

    // Skip external requests
    if (url.origin !== location.origin) return;

    event.respondWith(
        // Try network first
        fetch(request)
            .then((response) => {
                // Clone the response before caching
                const responseClone = response.clone();

                // Cache the response for future offline use
                caches.open(DYNAMIC_CACHE)
                    .then((cache) => {
                        cache.put(request, responseClone);
                    });

                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        // If it's a page request, return the offline page
                        if (request.mode === 'navigate') {
                            return caches.match('/');
                        }

                        // Return a fallback for other requests
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    let data = {
        title: 'Elvison OS',
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'elvison-notification',
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: data.badge,
            tag: data.tag,
            vibrate: [100, 50, 100],
            data: data.data || {},
            actions: data.actions || [],
        })
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');

    event.notification.close();

    // Get the URL to open from notification data
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open a new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-tasks') {
        event.waitUntil(syncTasks());
    }
});

// Helper function to sync tasks when back online
async function syncTasks() {
    // This would sync any offline changes when connectivity is restored
    console.log('[SW] Syncing offline changes...');
}
