const CACHE_NAME = 'the-finlog-v2';
const STATIC_CACHE = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.svg',
];

// Install event - cache static resources only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(STATIC_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for API/pages, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and different origins
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // API calls and dynamic pages: always use network-first
  // This ensures fresh data is always fetched
  if (url.pathname.startsWith('/api/') ||
      url.pathname === '/' ||
      url.pathname === '/dashboard' ||
      url.pathname === '/income' ||
      url.pathname === '/expenses' ||
      url.pathname === '/savings' ||
      url.pathname === '/settings') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // If network fails, try cache as fallback for offline support
          return caches.match(event.request);
        })
    );
    return;
  }

  // Static assets: cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from The Finlog',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'finlog-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification('The Finlog', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/dashboard')
  );
});

// Background sync event (for offline data sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-entries') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // This will sync offline data when connection is restored
  console.log('Syncing offline data...');
  // Implementation for syncing offline entries
}
