/* Ash Kicker service worker: makes the app open with no signal in the gym.
   Network first, so a new version shows up as soon as she is online;
   falls back to the saved copy when offline. */
const CACHE = 'ash-kicker-v2';
const PHOTOS = ['img/abduct-0.jpg', 'img/abduct-1.jpg', 'img/backext-0.jpg', 'img/backext-1.jpg', 'img/bridge-0.jpg', 'img/bridge-1.jpg', 'img/cablecrunch-0.jpg', 'img/cablecrunch-1.jpg', 'img/cardio-0.jpg', 'img/cardio-1.jpg', 'img/carry-0.jpg', 'img/carry-1.jpg', 'img/chestpress-0.jpg', 'img/chestpress-1.jpg', 'img/curl-0.jpg', 'img/curl-1.jpg', 'img/dbbench-0.jpg', 'img/dbbench-1.jpg', 'img/dbbridge-0.jpg', 'img/dbbridge-1.jpg', 'img/dbrow-0.jpg', 'img/dbrow-1.jpg', 'img/deadbug-0.jpg', 'img/deadbug-1.jpg', 'img/facepull-0.jpg', 'img/facepull-1.jpg', 'img/goblet-0.jpg', 'img/goblet-1.jpg', 'img/hammer-0.jpg', 'img/hammer-1.jpg', 'img/hipthrust-0.jpg', 'img/hipthrust-1.jpg', 'img/incline-0.jpg', 'img/incline-1.jpg', 'img/lateral-0.jpg', 'img/lateral-1.jpg', 'img/legcurl-0.jpg', 'img/legcurl-1.jpg', 'img/legext-0.jpg', 'img/legext-1.jpg', 'img/legpress-0.jpg', 'img/legpress-1.jpg', 'img/ohp-0.jpg', 'img/ohp-1.jpg', 'img/pallof-0.jpg', 'img/pallof-1.jpg', 'img/pulldown-0.jpg', 'img/pulldown-1.jpg', 'img/pushdown-0.jpg', 'img/pushdown-1.jpg', 'img/rdl-0.jpg', 'img/rdl-1.jpg', 'img/revfly-0.jpg', 'img/revfly-1.jpg', 'img/row-0.jpg', 'img/row-1.jpg', 'img/shoulderm-0.jpg', 'img/shoulderm-1.jpg', 'img/sidebend-0.jpg', 'img/sidebend-1.jpg', 'img/sideplank-0.jpg', 'img/sideplank-1.jpg', 'img/stepup-0.jpg', 'img/stepup-1.jpg', 'img/triext-0.jpg', 'img/triext-1.jpg', 'img/warm-0.jpg', 'img/warm-1.jpg', 'img/woodchop-0.jpg', 'img/woodchop-1.jpg'];
const SHELL = [
  './', 'index.html', 'tokens.css', 'app.css', 'program.js', 'logic.js', 'app.js', 'manifest.webmanifest',
  'fonts/anton-400.woff2', 'fonts/barlowc-700.woff2', 'fonts/barlowc-900.woff2',
  'fonts/inter-400.woff2', 'fonts/inter-500.woff2', 'fonts/inter-700.woff2',
  'logo/peach-color.svg', 'icons/app-icon-192.png', 'icons/app-icon-512.png', 'icons/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL).then(() => Promise.allSettled(PHOTOS.map(u => c.add(u))))) // photos are nice-to-have
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html')))
  );
});
