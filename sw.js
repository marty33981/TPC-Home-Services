// TPC Home Services — Service Worker

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyBb7wJP6W2EzkpVdtkbNJdOIBYjBzPosYk",
  authDomain:        "tpc-homewatch.firebaseapp.com",
  projectId:         "tpc-homewatch",
  storageBucket:     "tpc-homewatch.firebasestorage.app",
  messagingSenderId: "603133828808",
  appId:             "1:603133828808:web:5c5e7b6318dbe795f04ffd",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "New Inspection Report";
  const body  = payload.notification?.body  || "An operator submitted a new report.";
  const count = parseInt(payload.data?.unreadCount || "1", 10);
  if (self.navigator?.setAppBadge) self.navigator.setAppBadge(count);
  return self.registration.showNotification(title, {
    body,
    icon:      "/icons/icon-192.png",
    badge:     "/icons/icon-96.png",
    data:      { url: "/" },
    tag:       "tpc-report",
    renotify:  true,
    vibrate:   [200, 100, 200],
  });
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(e.notification.data?.url || "/");
    })
  );
});

const CACHE = 'tpc-homewatch-v4';

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
