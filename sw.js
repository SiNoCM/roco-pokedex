const CACHE_NAME = 'roco-pokedex-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './assets/index-CX5B3Qh1.js',
  './assets/index-BMwEmXte.css',
  './favicon.svg',
  './header-bg.svg',
  './icons.svg'
];

// Install: cache static assets with individual error handling
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache each asset individually to prevent total failure
      return Promise.all(
        STATIC_ASSETS.map((url) =>
          fetch(url)
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
              console.warn('[SW] Failed to cache:', url, response.status);
            })
            .catch((err) => {
              console.warn('[SW] Error fetching:', url, err.message);
            })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Helper: check if response is cacheable
function isCacheable(response) {
  return response && response.ok && response.status === 200;
}

// Fetch: cache-first for images, stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Images: cache-first with background update
  if (url.pathname.match(/\.(webp|png|jpg|jpeg|svg)$/i)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (isCacheable(networkResponse)) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // JS/CSS/HTML: stale-while-revalidate
  if (request.mode === 'navigate' || url.pathname.match(/\.(js|css|html)$/i)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (isCacheable(networkResponse)) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (isCacheable(networkResponse)) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
