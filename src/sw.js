var CACHE_NAME = '2021-10-08 00:19';
var urlsToCache = [
  "/speecha/",
  "/speecha/index.js",
  "/speecha/mp3/bgm.mp3",
  "/speecha/mp3/cat.mp3",
  "/speecha/mp3/correct.mp3",
  "/speecha/mp3/end.mp3",
  "/speecha/mp3/keyboard.mp3",
  "/speecha/voice.svg",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/css/bootstrap.min.css",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      }),
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }),
  );
});

self.addEventListener("activate", function (event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
