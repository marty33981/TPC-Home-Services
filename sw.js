// TPC Home Services — Service Worker
// Cache-first for app shell; network-first for dynamic data.

const CACHE = 'tpc-homewatch-v3';

// Derive base path from SW location so this works on any subdirectory (e.g. GitHub Pages)
const BASE = self.location.pathname.replace(/\/sw\.js$/, '');

const SHELL = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/project/styles.css',
  BASE + '/project/data.js',
  BASE + '/project/ios-frame.jsx',
  BASE + '/project/tweaks-panel.jsx',
  BASE + '/project/ui.jsx',
  BASE + '/project/screens-core.jsx',
  BASE + '/project/screens-detail.jsx',
  BASE + '/project/screens-more.jsx',
  BASE + '/project/screens-owner.jsx',
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
