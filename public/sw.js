// Yefris Service Worker — DISABLED (self-unregistering kill switch).
//
// The app no longer uses a service worker. Older versions registered one that
// cached aggressively and, due to a fetch-handler bug, returned `undefined` to
// respondWith() for cross-origin and dev module requests — breaking the page
// ("Failed to convert value to 'Response'"). This script neutralizes any stale
// registration still living in visitors' browsers.
//
// Do NOT delete this file: if sw.js 404s, the browser's update check fails and
// the old buggy worker stays active. It must be served and byte-different so the
// browser replaces the old worker with this harmless one.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Purge every cache the old worker created.
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));

    // Remove this registration entirely.
    await self.registration.unregister();

    // Take control of open pages, then reload them so they fetch fresh from
    // the network without any worker in the way.
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url));
  })());
});

// No fetch handler: all requests go straight to the network (browser default).
