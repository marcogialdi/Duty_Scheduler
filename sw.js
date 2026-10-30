/* Service worker di "Compiti di casa" · versione 0.13.0
   File generato da build.py: non modificare a mano (VERSION viene da APP_VERSION in js/config.js).
   I file dell'app hanno ?v=<versione> nel nome: a ogni versione nuova i telefoni li riscaricano. */
const VERSION = 'compiti-0.13.0';
const SHELL = [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/apple-touch-icon.png",
    "./css/base.css?v=0.13.0",
    "./css/app.css?v=0.13.0",
    "./js/firebase.js?v=0.13.0",
    "./js/config.js?v=0.13.0",
    "./js/util.js?v=0.13.0",
    "./js/state.js?v=0.13.0",
    "./js/game.js?v=0.13.0",
    "./js/auth.js?v=0.13.0",
    "./js/register.js?v=0.13.0",
    "./js/data.js?v=0.13.0",
    "./js/kid.js?v=0.13.0",
    "./js/parent.js?v=0.13.0",
    "./js/verify.js?v=0.13.0",
    "./js/edit.js?v=0.13.0",
    "./js/collab.js?v=0.13.0",
    "./js/setup.js?v=0.13.0",
    "./js/help.js?v=0.13.0",
    "./js/main.js?v=0.13.0"
  ];

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
  // librerie Firebase (versione fissa) e file dell'app (con la versione nel nome): prima la copia salvata
  const firebaseLib = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (firebaseLib || url.origin === self.location.origin){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok){ const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    })));
  }
  // tutto il resto (database, accesso) passa direttamente: ci pensa Firebase
});
