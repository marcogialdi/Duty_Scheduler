'use strict';
/* Compiti di casa · avvio: ultimo file caricato, quando tutti gli altri sono pronti */

onAuthStateChanged(auth, async user => {
  if (user && busy) return;       // registrazione in corso: ci pensa lei
  stopData(); stopFam();
  me = null; fid = null; fam = null; newsShown = false;
  if ($('newsDlg').open) $('newsDlg').close();
  if (!user){ renderWho(); defaultLoggedOut(); return; }
  await loadMe(user);
});

/* registra il service worker (app installabile e apertura rapida) */
if ('serviceWorker' in navigator && location.protocol === 'https:')
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW', e)));
