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

/* avviso di trasloco: chi apre l'app da un indirizzo vecchio viene invitato su HOME_URL
   (si porta dietro ?invito=… e simili, così i link d'invito continuano a funzionare) */
if (OLD_HOSTS.includes(location.hostname) && location.origin !== new URL(HOME_URL).origin){
  $('moveGo').href = HOME_URL + location.search + location.hash;
  $('moveUrl').textContent = new URL(HOME_URL).host;
  $('moveUntil').textContent = new Date(OLD_HOSTS_UNTIL + 'T12:00').toLocaleDateString('it-IT', {weekday: 'long', day: 'numeric', month: 'long'});
  $('moveDlg').showModal();
}
