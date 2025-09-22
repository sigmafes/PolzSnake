const CACHE_NAME = 'PolzSnake-v1.2.6';
const urlsToCache = [
    '/',
    'index.html',
    'game.js',
    'store.js',
    'editor.html',
    'mapEngine.js',
    'mapPlayer.js',
    'styles.css',
    'icons/icon-192.png',
    'icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});