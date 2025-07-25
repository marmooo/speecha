const CACHE_NAME = "2025-07-20 00:00";
const urlsToCache = [
  "/speecha/",
  "/speecha/index.js",
  "/speecha/words.lst",
  "/speecha/mp3/bgm.mp3",
  "/speecha/mp3/correct3.mp3",
  "/speecha/mp3/end.mp3",
  "/speecha/img/cat0.webp",
  "/speecha/img/cat51.webp",
  "/speecha/img/cat52.webp",
  "/speecha/favicon/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
