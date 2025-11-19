const cacheName = "2025-11-20 00:00";
const urlsToCache = [
  "/speecha/index.js",
  "/speecha/mp3/bgm.mp3",
  "/speecha/mp3/correct3.mp3",
  "/speecha/mp3/end.mp3",
  "/speecha/img/cat0.webp",
  "/speecha/img/cat51.webp",
  "/speecha/img/cat52.webp",
  "/speecha/favicon/favicon.svg",
];

async function preCache() {
  const cache = await caches.open(cacheName);
  await Promise.all(
    urlsToCache.map((url) =>
      cache.add(url).catch((e) => console.warn("Failed to cache", url, e))
    ),
  );
  self.skipWaiting();
}

async function handleFetch(event) {
  const cached = await caches.match(event.request);
  return cached || fetch(event.request);
}

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map((name) => name !== cacheName ? caches.delete(name) : null),
  );
  self.clients.claim();
}

self.addEventListener("install", (event) => {
  event.waitUntil(preCache());
});
self.addEventListener("fetch", (event) => {
  event.respondWith(handleFetch(event));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(cleanOldCaches());
});
