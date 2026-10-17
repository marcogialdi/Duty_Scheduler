/* Service worker di "Compiti di casa".
   Quando cambi index.html non serve toccare questo file: la pagina viene sempre
   scaricata fresca quando c'è rete. Aumenta VERSION solo se cambi icone o manifest. */
const VERSION = 'compiti-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // la pagina: prima la rete (sempre l'ultima versione), senza rete la copia salvata
  if (req.mode === 'navigate'){
    e.respondWith(fetch(req)
      .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // librerie Firebase (versione fissa) e file dell'app: prima la copia salvata
  const firebaseLib = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (firebaseLib || url.origin === self.location.origin){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok){ const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    })));
  }
  // tutto il resto (database, accesso) passa direttamente: ci pensa Firebase
});
