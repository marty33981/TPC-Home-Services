// TPC Home Services — Service Worker
// Cache-first for app shell; network-first for dynamic data.

const CACHE = 'tpc-homewatch-v1';

const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/project/styles.css',
  '/project/data.js',
  '/project/ios-frame.jsx',
  '/project/tweaks-panel.jsx',
  '/project/ui.jsx',
  '/project/screens-core.jsx',
  '/project/screens-detail.jsx',
  '/project/screens-more.jsx',
  '/project/screens-owner.jsx',
  '/project/app.jsx',
  '/vendor/react.js',
  '/vendor/react-dom.js',
  '/vendor/babel.min.js',
  '/vendor/tabler-icons/tabler-icons.min.css',
  '/vendor/tabler-icons/fonts/tabler-icons.woff2',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
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

// Fetch: cache-first for shell assets, network-first for everything else
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Only handle same-origin GET requests
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;

      return fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
