const CACHE_NAME = 'roco-pokedex-v3';

const PRECACHE_URLS = [
  './',
  './index.html',
  './assets/index-CX5B3Qh1.js',
  './assets/index-BMwEmXte.css',
  './favicon.svg',
  './header-bg.svg',
  './icons.svg'
];

// Install: precache shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all(
      PRECACHE_URLS.map(url =>
        fetch(url).then(res => {
          if (res.ok) return caches.open(CACHE_NAME).then(c => c.put(url, res));
        }).catch(() => {})
      )
    )
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Cache-first for images
const IMAGE_RE = /\.(webp|png|jpg|jpeg|svg|ico)$/i;

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Images: cache-first
  if (IMAGE_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request).then(res => {
          if (res.ok) caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Navigation & assets: stale-while-revalidate
  if (request.mode === 'navigate' || /\.(js|css|html|json)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request).then(res => {
          if (res.ok) caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }
});</arg_value>