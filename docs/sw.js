const CACHE_NAME="2023-09-06 08:45",urlsToCache=["/speecha/","/speecha/index.js","/speecha/words.lst","/speecha/mp3/bgm.mp3","/speecha/mp3/correct3.mp3","/speecha/mp3/end.mp3","/speecha/img/cat0.webp","/speecha/img/cat51.webp","/speecha/img/cat52.webp","/speecha/favicon/favicon.svg","https://cdn.jsdelivr.net/npm/number-to-words@1.2.4/numberToWords.min.js"];self.addEventListener("install",a=>{a.waitUntil(caches.open(CACHE_NAME).then(a=>a.addAll(urlsToCache)))}),self.addEventListener("fetch",a=>{a.respondWith(caches.match(a.request).then(b=>b||fetch(a.request)))}),self.addEventListener("activate",a=>{a.waitUntil(caches.keys().then(a=>Promise.all(a.filter(a=>a!==CACHE_NAME).map(a=>caches.delete(a)))))})