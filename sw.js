// TBC Sales Platform — Service Worker
// Zet dit bestand als "sw.js" in de ROOT van je GitHub repo

const CACHE_NAME = 'tbc-sales-v1';
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

// ── FETCH (cache-first voor static assets) ──────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request))
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
