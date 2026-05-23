/**
 * ANHAD Nitnem - Service Worker (Decommissioned)
 * 
 * This service worker is intentionally a no-op.
 * 
 * The root /sw.js (v5.8.0) handles all caching for the entire app including
 * all /nitnem/* resources. This secondary SW was causing a "cache deletion war"
 * where each SW's activate event would delete the other's caches on every load,
 * resulting in 503 errors and offline fallback pages being served.
 * 
 * Fix: This SW activates, clears any stale caches it previously created,
 * and then unregisters itself so only the root SW handles requests.
 */

// Immediately activate and clean up, then self-destruct
self.addEventListener('install', () => {
  console.log('[SW:nitnem] Decommissioned SW installing - will self-unregister');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW:nitnem] Decommissioned SW activating - clearing own caches and unregistering');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      // Only delete caches that this old SW created (prefix: anhad-instant or anhad-static v2.x)
      const ownCaches = cacheNames.filter(name =>
        name.startsWith('anhad-instant') ||
        (name.startsWith('anhad-static-v2') || name.startsWith('anhad-bani-v2'))
      );
      return Promise.all(ownCaches.map(name => {
        console.log('[SW:nitnem] Removing own stale cache:', name);
        return caches.delete(name);
      }));
    }).then(() => {
      // Claim clients so we control all pages, then unregister
      return self.clients.claim();
    }).then(() => {
      // Self-unregister so the root /sw.js takes over completely
      return self.registration.unregister();
    }).then(() => {
      console.log('[SW:nitnem] Successfully unregistered. Root SW will handle all requests.');
    })
  );
});

// Do NOT intercept any fetch requests - pass everything through
// The root /sw.js handles all caching
