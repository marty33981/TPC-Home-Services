// TPC Home Services — Service Worker
// Push notifications and smart caching.
// App code (project/) is always fetched fresh — only vendor/assets are cached.

self.addEventListener('push', (e) => {
  if (!e.data) return;
  let payload = {};
  try { payload = e.data.json(); } catch (_) { return; }

  const title = payload.notification?.title || 'New Inspection Report';
  const body  = payload.notification?.body  || 'An operator submitted a new report.';
  const count = parseInt(payload.data?.unreadCount || '1', 10);

  if (self.navigator?.setAppBadge) self.navigator.setAppBadge(count);

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:     '/icons/icon-192.png',
      badge:    '/icons/icon-96.png',
      data:     { url: '/', count },
      tag:      'tpc-report',
      renotify: true,
      vibrate:  [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(e.notification.data?.url || '/');
    })
  );
});

const CACHE = 'tpc-homewatch-vendor-v1';
const BASE  = self.location.pathname.replace(/\/sw\.js$/, '');

// Only cache vendor files and static assets — these never change
const VENDOR = [
  BASE + '/vendor/react.js',
  BASE + '/vendor/react-dom.js',
  BASE + '/vendor/babel.min.js',
  BASE + '/vendor/tabler-icons/tabler-icons.min.css',
  BASE + '/vendor/tabler-icons/fonts/tabler-icons.woff2',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
  BASE + '/project/styles.css',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(VENDOR)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  const path = url.pathname;

  // App code and HTML — always network-first (never stale)
  if (path.startsWith(BASE + '/project/') || path === BASE + '/' ||
      path === BASE + '/index.html' || path.endsWith('/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Vendor / static assets — cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
