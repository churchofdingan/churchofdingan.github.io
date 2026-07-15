/* Dingan Flies — service worker. Cache-first for the game shell + fonts;
   everything else (index.html etc.) passes straight through untouched. */
const CACHE = 'dingan-flies-v5';
const SHELL = ['./fly.html', './fly.webmanifest', './fly-192.png', './fly-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isShell = SHELL.some((p) => url.pathname.endsWith(p.slice(1)));
  const isFont = url.hostname === 'cdn.jsdelivr.net';
  if (!isShell && !isFont) return; // pass through — do not touch the rest of the site
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
    )
  );
});
