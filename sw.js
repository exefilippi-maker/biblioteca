const CACHE = 'biblioteca-v3';
const STATIC = [
  '/biblioteca/',
  '/biblioteca/index.html',
  '/biblioteca/biblioteca.html',
  '/biblioteca/manifest.json',
  '/biblioteca/icon.png',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

// INSTALL — cachear todo
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(STATIC.map(url => c.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

// ACTIVATE — limpiar caches viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// FETCH — cache first para estáticos, network first para el resto
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Ignorar chrome-extension y no-GET
  if(e.request.method !== 'GET') return;
  if(url.protocol === 'chrome-extension:') return;

  // Archivos propios: cache first, fallback a red
  if(url.origin === self.location.origin || url.hostname.includes('fonts.g') || url.hostname.includes('cdnjs')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if(cached) return cached;
        return fetch(e.request).then(resp => {
          if(resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        }).catch(() => caches.match('/biblioteca/index.html'));
      })
    );
    return;
  }

  // Todo lo demás: network first, fallback a cache
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
