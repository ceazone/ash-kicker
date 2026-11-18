/* Ash Kicker service worker: makes the app open with no signal in the gym.
   Network first, so a new version shows up as soon as she is online;
   falls back to the saved copy when offline. */
const CACHE = 'ash-kicker-v1';
const SHELL = [
  './', 'index.html', 'tokens.css', 'app.css', 'program.js', 'logic.js', 'app.js', 'manifest.webmanifest',
  'fonts/anton-400.woff2', 'fonts/barlowc-700.woff2', 'fonts/barlowc-900.woff2',
  'fonts/inter-400.woff2', 'fonts/inter-500.woff2', 'fonts/inter-700.woff2',
  'logo/peach-color.svg', 'icons/app-icon-192.png', 'icons/app-icon-512.png', 'icons/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
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
