const CACHE_NAME = 'blkphx-v2';
const APP_SHELL  = ['/', '/index.html', '/manifest.json', '/assets/brand/blkphx-mark-8bit.png', '/assets/brand/silkscreen-latin-400-normal.woff2', '/assets/brand/press-start-2p-latin-400-normal.woff2'];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting()))
);

self.addEventListener('activate', e =>
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()))
);

self.addEventListener('fetch', e => {
  if (
    e.request.url.includes('script.google.com') ||
    e.request.url.includes('sheets.googleapis.com')
  ) return;
  // Pages come from the network first, so a deploy reaches the installed app. The cached copy is the offline fallback.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
