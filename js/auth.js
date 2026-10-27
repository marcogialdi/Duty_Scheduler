'use strict';
/* Compiti di casa · schermate d'accesso, genitori, PIN dei figli */

/* =====================================================================
   ACCESSO E SCHERMATE
   ===================================================================== */
const SCREENS = ['loading','scrWelcome','scrRegister','scrJoin','scrParentLogin','scrPick','scrPin','scrNoFam','app'];
let curScreen = null;
function show(id){
  if (curScreen === id) return;
  curScreen = id;
  SCREENS.forEach(x => $(x).hidden = x !== id);
  window.scrollTo(0, 0);
}

function mergeCfg(raw){
  return {
    ...DEFAULTS, ...raw,
    times: {...DEFAULTS.times, ...(raw?.times||{})},
    rules: {...DEFAULTS.rules, ...(raw?.rules||{})},
    categories: raw?.categories?.length ? raw.categories : DEFAULTS.categories,
    kids: cleanKids(raw?.kids),
  };
}


async function loadMe(user){
  show('loading');
  let m = null;
  try { const s = await getDoc(doc(db,'members',user.uid)); m = s.exists() ? s.data() : null; }
  catch(e){ console.error(e); }
  me = {uid:user.uid, ...(m || {})};
  if (!m?.familyId){ renderWho(); show('scrNoFam'); return; }
  fid = m.familyId;
  watchFam();
}

let unsubFam = null;
function watchFam(){
  unsubFam = onSnapshot(doc(db,'families',fid), s => {
    if (!s.exists()){ stopData(); fam = null; fid = null; me = {...me, familyId:null}; renderWho(); show('scrNoFam'); return; }
    const first = !fam;
    fam = mergeCfg(s.data());
    document.title = $('appTitle').textContent = fam.name || APP_NAME;
    if (me.role === 'kid' && !kidById(me.kidId)) { signOut(auth); return; }   // figlio rimosso
    syncDevice();
    if (first){ initView(); startData(); armIdle(); }
    else {
      syncKidWatch();
      if (isParent() && view && !['parent','setup'].includes(view) && !kidById(view)) view = 'parent';
    }
    route(); render();
  }, err => fail(err));
}
function stopFam(){ unsubFam?.(); unsubFam = null; }

function initView(){
  if (me.role === 'kid'){ owner = view = me.kidId; return; }
  const last = store('get', `cdc.view.${fid}`);
  view = last && (last === 'parent' || last === 'setup' || kidById(last)) ? last : 'parent';
  if (kidById(view)) owner = view;
}
function route(){
  renderWho();
  if (!auth.currentUser) return defaultLoggedOut();
  if (!me?.familyId) return show('scrNoFam');
  if (!fam) return show('loading');
  show('app'); renderTabs(); applyView();
  setTimeout(maybeShowNews, 400);             // novità non ancora lette (una volta per accesso)
}
function defaultLoggedOut(){
  $('appTitle').textContent = device?.famName || APP_NAME;
  const inv = new URLSearchParams(location.search).get('invito');
  if (inv){ openJoin(inv); return; }
  if (device?.fid && device.kids?.length){
    if (device.mode === 'kid' && device.kids.some(k => k.id === device.kidId)) return openPin(device.kidId);
    return showPick();
  }
  show('scrWelcome');
}

/* il dispositivo ricorda la famiglia e i figli (nome, colore, icona) per la schermata d'accesso */
function syncDevice(){
  if (!device || device.fid !== fid) return;
  const kids = kidsList().map(k => ({id:k.id, name:k.name, color:k.color, avatar:k.avatar, authEmail:k.authEmail}));
  const d = {...device, famName: fam.name, kids};
  if (d.mode === 'kid' && !kids.some(k => k.id === d.kidId)) d.mode = 'shared';
  saveDevice(d);
}

/* ---------- intestazione ---------- */
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; renderWho(); });
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function renderWho(){
  const u = auth.currentUser;
  let h = '';
  if (u && fam && me?.role === 'kid') h += `<span class="who-name">${kidAvatar(me.kidId)} ${esc(kidName(me.kidId))}</span>`;
  if (u && fam && isParent()) h += `<span class="who-name">👪 ${esc(me.name || '')}</span>`;
  if (installEvt && !isStandalone()) h += `<button class="hbtn" data-w="install">📲 Installa</button>`;
  h += `<button class="hbtn" data-w="help" aria-label="Guida">❓ Guida</button>`;
  if (u && fam && me?.role === 'kid') h += `<button class="hbtn" data-w="pin">🔢 PIN</button>`;
  if (u) h += `<button class="hbtn" data-w="out">Esci</button>`;
  $('who').innerHTML = h;
}
$('who').onclick = async e => {
  const w = e.target.closest('[data-w]')?.dataset.w; if (!w) return;
  if (w === 'out') signOut(auth);
  if (w === 'help') openHelp();
  if (w === 'pin') changeMyPin();
  if (w === 'install' && installEvt){ installEvt.prompt(); await installEvt.userChoice.catch(()=>{}); installEvt = null; renderWho(); }
};

/* ---------- navigazione tra le schermate d'accesso ---------- */
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g){ e.preventDefault(); const t = g.dataset.go; t === 'register' ? openRegister() : t === 'join' ? openJoin() : show(t); return; }
  if (e.target.closest('[data-back]')){ e.preventDefault(); auth.currentUser ? route() : defaultLoggedOut(); return; }
  if (e.target.closest('[data-priv]')){ e.preventDefault(); openPrivacy(); }
});
$('noFamOut').onclick = () => signOut(auth);

/* ---------- accesso genitori ---------- */
$('loginParent').onsubmit = async e => {
  e.preventDefault();
  try { await signInWithEmailAndPassword(auth, $('lEmail').value.trim(), $('lPass').value); $('lPass').value = ''; }
  catch(err){ fail(err); }
};
$('lForgot').onclick = async () => {
  const email = $('lEmail').value.trim();
  if (!email) return toast('Scrivi prima la tua email');
  try { await sendPasswordResetEmail(auth, email); toast('Ti abbiamo mandato un\'email per reimpostare la password'); }
  catch(err){ fail(err); }
};

/* ---------- accesso figli: "Chi sei?" e PIN ---------- */
let pinKid = null, pinVal = '';
function showPick(){
  $('appTitle').textContent = device.famName || APP_NAME;
  $('loginTiles').innerHTML = device.kids.map(k => `
    <button class="tile" style="--k:${esc(k.color)}" data-kid="${esc(k.id)}"><span class="av">${esc(k.avatar || String(k.name ?? '').charAt(0).toUpperCase())}</span>${esc(k.name)}</button>`).join('') +
    `<button class="tile" data-par="1"><span class="av">👪</span>Genitori</button>`;
  show('scrPick');
}
$('loginTiles').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.par) return show('scrParentLogin');
  openPin(b.dataset.kid);
};
function openPin(kidId){
  pinKid = device.kids.find(k => k.id === kidId); pinVal = '';
  if (!pinKid) return showPick();
  $('appTitle').textContent = device.famName || APP_NAME;
  $('scrPin').style.setProperty('--k', pinKid.color);
  $('pinAv').textContent = pinKid.avatar || pinKid.name.charAt(0).toUpperCase();
  $('pinWho').textContent = `Ciao ${pinKid.name}!`;
  $('pinBack').hidden = device.mode === 'kid';
  drawPin(); show('scrPin');
}
$('pinPad').innerHTML = [1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(n => n === '' ? '<span></span>' : `<button data-n="${n}" aria-label="${n === '⌫' ? 'Cancella' : n}">${n}</button>`).join('');
function drawPin(){ $('pinDots').innerHTML = [0,1,2,3,4,5].map(i => `<span class="${i < pinVal.length ? 'f' : ''}"></span>`).join(''); }
$('pinPad').onclick = async e => {
  const b = e.target.closest('button'); if (!b || !pinKid) return;
  if (b.dataset.n === '⌫') pinVal = pinVal.slice(0,-1);
  else if (pinVal.length < 6) pinVal += b.dataset.n;
  drawPin();
  if (pinVal.length === 6){
    try { await signInWithEmailAndPassword(auth, pinKid.authEmail, pinVal); pinKid = null; }
    catch(err){
      $('pinDots').classList.add('shake'); setTimeout(() => $('pinDots').classList.remove('shake'), 400);
      toast(err.code === 'auth/too-many-requests' ? AUTH_MSG[err.code] : err.code === 'auth/network-request-failed' ? AUTH_MSG[err.code] : 'PIN sbagliato');
      pinVal = ''; drawPin();
    }
  }
};
document.addEventListener('keydown', e => {
  if ($('scrPin').hidden) return;
  if (/^\d$/.test(e.key)) $('pinPad').querySelector(`[data-n="${e.key}"]`)?.click();
  if (e.key === 'Backspace') $('pinPad').querySelector('[data-n="⌫"]')?.click();
});
$('pinBack').onclick = () => showPick();
$('pinParent').onclick = () => show('scrParentLogin');

async function changeMyPin(){
  const cur = prompt('PIN attuale (6 cifre)'); if (cur === null) return;
  const nw = prompt('Nuovo PIN (6 cifre)'); if (nw === null) return;
  if (!/^\d{6}$/.test(nw)) return toast('Il PIN deve avere 6 cifre');
  if (prompt('Ripeti il nuovo PIN') !== nw) return toast('I due PIN non coincidono');
  try {
    const u = auth.currentUser;
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, cur));
    await updatePassword(u, nw);
    toast('PIN cambiato ✅');
  } catch(err){ toast(err.code === 'auth/too-many-requests' ? AUTH_MSG[err.code] : 'PIN attuale sbagliato'); }
}

/* uscita automatica dei figli per inattività */
let idleT = null;
function armIdle(){
  clearTimeout(idleT);
  const min = Number(fam?.rules?.autoLogoutMin) || 0;
  if (me?.role !== 'kid' || !min) return;
  idleT = setTimeout(() => { signOut(auth); toast('Sei uscito per inattività'); }, min * 60000);
}
['pointerdown','keydown','scroll'].forEach(ev => document.addEventListener(ev, armIdle, {passive:true}));
