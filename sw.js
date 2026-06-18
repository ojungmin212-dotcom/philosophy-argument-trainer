const CACHE_NAME = 'philosophy-quote-study-v1';
const APP_ASSETS = [
  './',
  './index.html',
  './styles.css?v=20260618',
  './manifest.webmanifest',
  './favicon.svg',
  './src/app.js?v=20260618',
  './src/content.js?v=20260618',
  './src/storage.js?v=20260618',
  './src/training.js?v=20260618',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request);
    }),
  );
});
