// TBC Sales Platform — Service Worker

const CACHE_NAME = 'tbc-sales-v4';
const OFFLINE_FILES = ['/', '/dashboard.html', '/login.html', '/icon.svg'];

// ── INSTALL ─────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(OFFLINE_FILES))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ────────────────────────────────────────────────────
// HTML: network-first — altijd vers ophalen, cache alleen als fallback offline
// Overig: cache-first — statische assets zelden gewijzigd
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isHTML = url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '';

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      });
    })
  );
});

// ── PUSH NOTIFICATION ONTVANGEN ─────────────────────────────
self.addEventListener('push', e => {
  let data = {
    title: 'TBC Sales Platform',
    body: 'Je hebt een nieuwe melding',
    icon: '/icon.svg'
  };

  try {
    data = e.data?.json() || data;
  } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        { action: 'open', title: 'Openen' },
        { action: 'close', title: 'Sluiten' }
      ]
    })
  );
});

// ── NOTIFICATIE KLIK ────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;

  const url = e.notification.data?.url || '/dashboard.html';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(wins => {
        const existing = wins.find(w => w.url.includes('dashboard'));
        if (existing) {
          existing.focus();
          existing.navigate(url);
        } else {
          clients.openWindow(url);
        }
      })
  );
});
