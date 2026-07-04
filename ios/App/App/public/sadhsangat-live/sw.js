const CACHE = 'sadhsangat-v3';
const PRECACHE = ['/', '/index.html', '/favicon.ico'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('ytimg.com') || e.request.url.includes('youtube.com/vi/')) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/favicon.ico')))
    );
    return;
  }
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

self.addEventListener('message', e => {
  const data = e.data || {};
  switch (data.type) {
    case 'keepalive':
      e.source?.postMessage({ type: 'keepalive-response' });
      break;
    case 'play':
    case 'pause':
    case 'stop':
      self.clients.matchAll().then(clients => {
        clients.forEach(c => c.postMessage(data));
      });
      break;
  }
});

self.addEventListener('push', e => {
  if (!e.data) return;
  const d = e.data.json();
  self.registration.showNotification(d.title || 'Sadhsangat Live', {
    body: d.body || 'Gurbani Kirtan is live',
    icon: '../assets/icon-192x192.png',
    badge: '../assets/icon-192x192.png',
    tag: 'sadhsangat-live',
    requireInteraction: true,
    vibrate: [200, 100, 200]
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
        clients[0].postMessage({ type: 'notification-click' });
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});
