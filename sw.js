// TPC Home Services — Service Worker
// Handles caching, push notifications, and notification clicks.
// No Firebase SDK imported here — Firebase CDN importScripts can fail and
// prevent the entire SW from installing, leaving users on stale cached code.

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

const CACHE = 'tpc-homewatch-v11';

// Derive base path so this works on any subdirectory (e.g. GitHub Pages)
const BASE = self.location.pathname.replace(/\/sw\.js$/, '');

const SHELL = [
  BASE + '/manifest.json',
  BASE + '/project/styles.css',
  BASE + '/project/data.js',
  BASE + '/project/ios-frame.jsx',
  BASE + '/project/tweaks-panel.jsx',
  BASE + '/project/ui.jsx',
  BASE + '/project/screens-core.jsx',
  BASE + '/project/screens-detail.jsx',
  BASE + '/project/screens-more.jsx',
  BASE + '/project/screens-admin.jsx',
  BASE + '/project/screens-owner.jsx',
  BASE + '/project/auth.jsx',
  BASE + '/project/firebase.js',
  BASE + '/project/app.jsx',
  BASE + '/vendor/react.js',
  BASE + '/vendor/react-dom.js',
  BASE + '/vendor/babel.min.js',
  BASE + '/vendor/tabler-icons/tabler-icons.min.css',
  BASE + '/vendor/tabler-icons/fonts/tabler-icons.woff2',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
];

// Install: pre-cache the app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML (always fresh), cache-first for other assets
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Only handle same-origin GET requests
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Always fetch HTML fresh so the SW registration URL stays current
  if (url.pathname === BASE + '/' || url.pathname === BASE + '/index.html' || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(BASE + '/index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;

      return fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
