/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD SERVICE-WORKER.JS — Redirect to sw.js
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This file exists for backward compatibility. The main service worker is sw.js.
 * This file simply imports sw.js functionality to avoid conflicts.
 * 
 * NOTE: If you're seeing this, the real service worker is sw.js.
 * This file auto-activates and claims clients immediately.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const SW_REDIRECT_VERSION = 'redirect-v5.1.0';

// Immediately take control
self.addEventListener('install', (event) => {
  console.log('[service-worker.js] Redirecting to sw.js — skipping waiting');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[service-worker.js] Activated — claiming clients');
  event.waitUntil(
    // Clear any caches this old SW might have created
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key.startsWith('anhad-pwa-') || key.startsWith('anhad-runtime-'))
          .map(key => {
            console.log('[service-worker.js] Clearing old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Don't intercept any fetches — let sw.js handle everything
// This effectively makes this SW a no-op pass-through

// Handle SKIP_WAITING message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
