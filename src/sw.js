var CACHE_NAME = "2023-06-09 01:00";
var urlsToCache = [
  "/speecha/",
  "/speecha/index.js",
  "/speecha/words.lst",
  "/speecha/mp3/bgm.mp3",
  "/speecha/mp3/correct3.mp3",
  "/speecha/mp3/end.mp3",
  "/speecha/voice.svg",
  "/speecha/img/cat0.webp",
  "/speecha/img/cat51.webp",
  "/speecha/img/cat52.webp",
  "/speecha/favicon/favicon.svg",
  "https://cdn.jsdelivr.net/npm/number-to-words@1.2.4/numberToWords.min.js",
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
