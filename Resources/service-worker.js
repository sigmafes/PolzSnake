const CACHE_NAME = 'polzsnake-cache-v1';
const urlsToCache = [
    '/',
    'index.html',
    'game.js',
    'store.js',
    'editor.html',
    'mapEngine.js',
    'mapPlayer.js',
    'styles.css',
    // Asegúrate de incluir todos los archivos de tu juego aquí
    // Incluye los iconos también
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