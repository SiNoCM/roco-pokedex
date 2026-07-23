const CACHE_NAME = 'roco-pokedex-v9';
const PRECACHE = ['./', './index.html', './assets/index-CX5B3Qh1.js', './assets/index-BMwEmXte.css', './favicon.svg', './header-bg.svg', './icons.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const { request: req } = e;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Static assets (hashed filenames): cache-first, infinite cache
  if (/\.(js|css|woff2?|webp|png|svg|ico)$/i.test(url.pathname)) {
    e.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => { if (res.ok) caches.open(CACHE_NAME).then(c => c.put(req, res.clone())); return res; }).catch(() => new Response('', { status: 404 }))));
    return;
  }
  // HTML: network-first, fallback to cache
  if (req.mode === 'navigate' || /\.html?$/i.test(url.pathname)) {
    e.respondWith(fetch(req).then(res => { if (res.ok) { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, clone)); } return res; }).catch(() => caches.match(req) || new Response('Offline', { status: 503 })));
    return;
  }
});