const CACHE_NAME = 'label-maker-v2';
const CORE_ASSETS = [
  './index.html', './manifest.json', './icon-192.png', './icon-512.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('label-maker-') && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache third-party scripts, API calls, or other cross-origin responses.
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const response = await fetch(req);
      if (response && response.ok && req.destination !== 'document' && url.pathname.endsWith('.html') === false) {
        await cache.put(req, response.clone());
      }
      return response;
    } catch (err) {
      if (cached) return cached;
      throw err;
    }
  })());
});
