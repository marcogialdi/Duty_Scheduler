'use strict';
/* Compiti di casa · impostazioni della famiglia, figli, genitori, dispositivo */

/* =====================================================================
   SETUP
   ===================================================================== */
let catDraft = [];

/* schede del Setup; il pulsante Salva vale per Famiglia e orari e per Regole del gioco */
const STAB_OF = {sDevice:'dev', sKids:'kids', sParents:'par'};
let stab = store('get', 'cdc.stab') || 'fam';
function showStab(k){
  if (!document.querySelector(`.ssec[data-ss="${k}"]`)) k = 'fam';
  stab = k; store('set', 'cdc.stab', k);
  document.querySelectorAll('#stabs [data-st]').forEach(b => { b.classList.toggle('on', b.dataset.st === k); b.setAttribute('aria-selected', b.dataset.st === k); });
  document.querySelectorAll('.ssec').forEach(x => x.hidden = x.dataset.ss !== k);
  $('saveSetup').hidden = !['fam','rules'].includes(k);
  $('sDanger').hidden = k !== 'fam';
}
$('stabs').onclick = e => { const b = e.target.closest('[data-st]'); if (b) showStab(b.dataset.st); };

function fillSetup(){
  applyView.filled = true;
  $('sTitle').value = fam.name;
  $('sLogout').value = R().autoLogoutMin;
  $('tWake').value = T().wake; $('tAft').value = T().afternoon; $('tEve').value = T().evening; $('tBed').value = T().bed;
  catDraft = fam.categories.map(c => ({...c}));
  drawCats();
  $('rulesForm').innerHTML = RULE_FIELDS.map(([k,l]) => `<div><label>${l}</label><input type="number" data-rule="${k}" value="${R()[k]}"></div>`).join('');
  $('kColor').value = KID_COLORS[kidsList().length % KID_COLORS.length];
  $('kAv').textContent = AVATAR_LIST[(kidsList().length * 3) % AVATAR_LIST.length];
  fillDevice();
  renderSetupLists();
  showStab(stab);
}
function fillDevice(){
  const mode = device?.fid === fid ? device.mode : 'none';
  document.querySelectorAll('[name=devMode]').forEach(r => r.checked = r.value === mode);
  $('devKid').innerHTML = kidOpts();
  if (device?.fid === fid && device.kidId && kidById(device.kidId)) $('devKid').value = device.kidId;
}
$('devKid').addEventListener('change', () => { document.querySelector('[name=devMode][value=kid]').checked = true; });
$('saveDev').onclick = async () => {
  const mode = document.querySelector('[name=devMode]:checked')?.value || 'none';
  if (mode === 'none'){
    if (device?.fid === fid) saveDevice(null);
    store('set', `cdc.devBannerOff.${fid}`, '1');
    return toast('Questo dispositivo è solo per i genitori');
  }
  if (!kidsList().length) return toast('Prima aggiungi i figli');
  saveDevice({fid, mode, kidId: mode === 'kid' ? $('devKid').value : null, famName: fam.name, kids: []});
  syncDevice();
  try { await updateDoc(doc(db, 'families', fid), {lastDeviceAt: serverTimestamp()}); } catch(e){}
  toast(mode === 'kid' ? `Attivato per ${kidName(device.kidId)} 📱 Ora puoi uscire` : 'Attivato come tablet di famiglia 📱 Ora puoi uscire');
};
function drawCats(){
  $('catList').innerHTML = catDraft.map((c,i) => `
    <div class="catrow"><input data-ci="${i}" data-f="name" value="${esc(c.name)}" aria-label="Nome categoria">
      <input type="color" data-ci="${i}" data-f="color" value="${c.color}" aria-label="Colore">
      <button class="btn no icon" type="button" data-cdel="${i}" aria-label="Rimuovi">✕</button></div>`).join('');
}
$('catList').addEventListener('input', e => { const i = e.target.dataset.ci; if (i !== undefined) catDraft[i][e.target.dataset.f] = e.target.value; });
$('catList').addEventListener('click', e => {
  const i = e.target.closest('[data-cdel]')?.dataset.cdel; if (i === undefined) return;
  const c = catDraft[i];
  const used = Object.values(data.tasks).filter(t => t.categoryId === c.id).length;
  if (catDraft.length === 1) return toast('Serve almeno una categoria');
  if (used && !confirm(`${used} compiti usano "${c.name}": appariranno come "Altro". Rimuovere?`)) return;
  catDraft.splice(i, 1); drawCats();
});
$('addCat').onclick = () => { catDraft.push({id:'c' + rid(), name:'Nuova categoria', color:'#0ea5e9'}); drawCats(); };
$('saveSetup').onclick = async () => {
  const times = {wake:$('tWake').value, afternoon:$('tAft').value, evening:$('tEve').value, bed:$('tBed').value};
  if (!(times.wake < times.afternoon && times.afternoon < times.evening && times.evening < times.bed))
    return toast('Gli orari devono essere in ordine: sveglia < pomeriggio < sera < letto');
  if (catDraft.some(c => !c.name.trim())) return toast('Dai un nome a ogni categoria');
  const rules = {...R(), autoLogoutMin: Math.max(0, parseInt($('sLogout').value,10) || 0)};
  for (const inp of document.querySelectorAll('[data-rule]')){
    const v = Number(inp.value);
    if (!Number.isFinite(v)) return toast('Controlla i numeri delle regole');
    rules[inp.dataset.rule] = Math.round(v);
  }
  if (rules.missed > 0) rules.missed = -rules.missed;
  if (rules.yellowsForRed < 1 || rules.redDays < 1 || rules.contestHours < 1) return toast('Gialli, giorni del rosso e ore devono essere almeno 1');
  try {
    await updateDoc(doc(db, 'families', fid), {name:$('sTitle').value.trim() || fam.name, times, rules,
      categories: catDraft.map(c => ({id:c.id, name:c.name.trim(), color:c.color}))});
    toast('Impostazioni salvate ✅');
  } catch(err){ fail(err); }
};

function renderSetupLists(){
  $('kidsList').innerHTML = kidsList().map(k => `
    <div class="sched"><button class="avbtn" style="width:48px" data-kav="${k.id}" aria-label="Cambia icona">${k.avatar || '🙂'}</button>
      <div class="body"><b style="color:${k.color}">${esc(k.name)}</b></div>
      <div class="acts"><input type="color" value="${k.color}" data-kcolor="${k.id}" style="width:48px" aria-label="Colore">
      <button class="btn" data-kren="${k.id}">Rinomina</button>
      <button class="btn" data-kpin="${k.id}">Nuovo PIN</button>
      <button class="btn no" data-kdel="${k.id}">Rimuovi</button></div></div>`).join('') || '<div class="empty">Nessun figlio</div>';
  $('addKidForm').hidden = kidsList().length >= MAX_KIDS;
  keepSel('devKid', kidOpts());
  $('parentsList').innerHTML = data.parents.map(p => `
    <div class="sched"><div class="body"><b>${esc(p.name)}</b> <small style="color:var(--muted)">${esc(p.email || '')}</small></div>
      ${p.id === me.uid ? '<small style="color:var(--muted)">sei tu</small>' : `<button class="btn no" data-pdel="${p.id}">Rimuovi</button>`}</div>`).join('');
  const inv = data.invites.filter(i => ms(i.expiresAt) > Date.now());
  $('inviteList').innerHTML = inv.map(i => `
    <div class="panel" style="margin:10px 0 0;padding:10px">
      <div class="codebox">${i.id}</div>
      <div class="sched" style="border:none;padding:0"><small class="body" style="color:var(--muted)">Valido fino al ${fmtMs(ms(i.expiresAt))}</small>
        <div class="acts inl"><button class="btn primary" data-ishare="${i.id}">📤 Condividi</button><button class="btn no" data-idel="${i.id}">Revoca</button></div></div>
    </div>`).join('');
}

async function createAccount(email, password){
  const cred = await createUserWithEmailAndPassword(secAuth, email, password);
  const uid = cred.user.uid;
  await signOut(secAuth);
  return uid;
}
async function createKid({name, pin, color, avatar}){
  const id = 'k' + rid(), authEmail = kidEmail(id, 1);
  const uid = await createAccount(authEmail, pin);
  await setDoc(doc(db, 'members', uid), {familyId:fid, role:'kid', kidId:id, name, createdAt:serverTimestamp(), newsSeen:APP_VERSION});
  return {id, name, color, avatar, authEmail, uid, ver:1};
}
async function saveKids(kids){ await updateDoc(doc(db, 'families', fid), {kids}); }

$('kAv').onclick = () => pickIcon(AVATARS, $('kAv').textContent, ic => { $('kAv').textContent = ic; });
$('kPin').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g,'').slice(0,6); });
$('addKidForm').onsubmit = async e => {
  e.preventDefault();
  const name = $('kName').value.trim(), pin = $('kPin').value.trim();
  if (!name) return toast('Scrivi il nome');
  if (!/^\d{6}$/.test(pin)) return toast('Il PIN deve avere 6 cifre');
  if (kidsList().length >= MAX_KIDS) return toast(`Al massimo ${MAX_KIDS} figli`);
  try {
    const k = await createKid({name, pin, color:$('kColor').value, avatar:$('kAv').textContent});
    await saveKids([...kidsList(), k]);
    toast(`${name} aggiunto/a ✅`); e.target.reset();
    $('kColor').value = KID_COLORS[(kidsList().length + 1) % KID_COLORS.length];
    $('kAv').textContent = AVATAR_LIST[((kidsList().length + 1) * 3) % AVATAR_LIST.length];
  } catch(err){ fail(err); }
};
$('kidsList').addEventListener('change', async e => {
  const id = e.target.dataset.kcolor; if (!id) return;
  try { await saveKids(kidsList().map(k => k.id === id ? {...k, color:e.target.value} : k)); } catch(err){ fail(err); }
});
$('kidsList').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  try {
    if (d.kav){
      const k = kidById(d.kav);
      return pickIcon(AVATARS, k.avatar, async ic => { try { await saveKids(kidsList().map(x => x.id === k.id ? {...x, avatar:ic} : x)); } catch(err){ fail(err); } });
    }
    if (d.kren){
      const k = kidById(d.kren), n = prompt('Nuovo nome', k.name);
      if (n && n.trim()) await saveKids(kidsList().map(x => x.id === k.id ? {...x, name:n.trim()} : x));
    }
    if (d.kpin){
      // dal browser non si può cambiare la password di un altro account:
      // si crea un nuovo account per il figlio e il vecchio perde ogni permesso
      const k = kidById(d.kpin), pin = prompt(`Nuovo PIN di ${k.name} (6 cifre)`);
      if (pin === null) return;
      if (!/^\d{6}$/.test(pin)) return toast('Il PIN deve avere 6 cifre');
      const ver = (k.ver || 1) + 1, authEmail = kidEmail(k.id, ver);
      // le novità già lette passano al nuovo account, così non ricompaiono
      const oldSeen = k.uid ? await getDoc(doc(db, 'members', k.uid)).then(x => x.data()?.newsSeen).catch(() => null) : null;
      const uid = await createAccount(authEmail, pin);
      await setDoc(doc(db, 'members', uid), {familyId:fid, role:'kid', kidId:k.id, name:k.name, createdAt:serverTimestamp(),
        ...(oldSeen ? {newsSeen:oldSeen} : {})});
      await saveKids(kidsList().map(x => x.id === k.id ? {...x, authEmail, uid, ver} : x));
      if (k.uid) await deleteDoc(doc(db, 'members', k.uid));
      toast(`Nuovo PIN di ${k.name} attivo ✅`);
    }
    if (d.kdel){
      const k = kidById(d.kdel);
      if (!confirm(`Rimuovere ${k.name}? Non potrà più entrare. Stelle e storico restano salvati.`)) return;
      await saveKids(kidsList().filter(x => x.id !== k.id));
      if (k.uid) await deleteDoc(doc(db, 'members', k.uid));
      toast(`${k.name} rimosso/a`);
    }
  } catch(err){ fail(err); }
});

/* inviti */
$('inviteBtn').onclick = async () => {
  const code = Array.from(crypto.getRandomValues(new Uint8Array(8)), b => ALPH[b % ALPH.length]).join('');
  try {
    await setDoc(doc(db, 'invites', code), {familyId:fid, familyName:fam.name, createdBy:me.uid,
      createdAt:serverTimestamp(), expiresAt:Timestamp.fromMillis(Date.now() + 7 * 864e5)});
    shareInvite(code);
  } catch(err){ fail(err); }
};
async function shareInvite(code){
  const url = `${location.origin}${location.pathname}?invito=${code}`;
  const text = `Entra nella famiglia "${fam.name}" su Compiti di casa. Apri il link oppure usa il codice ${code} in "Ho un codice d'invito".`;
  try {
    if (navigator.share) await navigator.share({title:'Invito – Compiti di casa', text, url});
    else { await navigator.clipboard.writeText(`${text}\n${url}`); toast('Invito copiato: incollalo in un messaggio'); }
  } catch(e){ if (e?.name !== 'AbortError') toast(`Codice: ${code}`); }
}
$('inviteList').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.ishare) return shareInvite(b.dataset.ishare);
  if (b.dataset.idel){ try { await deleteDoc(doc(db, 'invites', b.dataset.idel)); } catch(err){ fail(err); } }
});
$('parentsList').addEventListener('click', async e => {
  const id = e.target.dataset.pdel; if (!id) return;
  if (!confirm('Rimuovere questo genitore dalla famiglia? Non potrà più entrare.')) return;
  try { await deleteDoc(doc(db, 'members', id)); } catch(err){ fail(err); }
});

/* elimina famiglia */
$('delFam').onclick = async () => {
  const n = prompt(`Per confermare scrivi il nome della famiglia:\n${fam.name}`);
  if (n === null) return;
  if (n.trim().toLowerCase() !== fam.name.trim().toLowerCase()) return toast('Il nome non corrisponde: nulla è stato eliminato');
  const myFid = fid, myUid = me.uid;
  toast('Eliminazione in corso…');
  try {
    busy = true;
    stopData(); stopFam();
    const C = (...p) => collection(db, 'families', myFid, ...p);
    const refs = [];
    for (const c of ['tasks','schedule','swaps','completions','rewards']) (await getDocs(C(c))).docs.forEach(d => refs.push(d.ref));
    const kidIds = new Set([...kidsList().map(k => k.id), ...(await getDocs(C('kids'))).docs.map(d => d.id)]);
    for (const k of kidIds){
      for (const c of ['ledger','cards','redemptions','proposals']) (await getDocs(C('kids', k, c))).docs.forEach(d => refs.push(d.ref));
      refs.push(doc(db, 'families', myFid, 'kids', k));
    }
    (await getDocs(query(collection(db,'invites'), where('familyId','==',myFid)))).docs.forEach(d => refs.push(d.ref));
    (await getDocs(query(collection(db,'members'), where('familyId','==',myFid)))).docs.forEach(d => { if (d.id !== myUid) refs.push(d.ref); });
    refs.push(doc(db, 'families', myFid));
    const del = chunkedBatch(); refs.forEach(r => del.delete(r)); await del.commit();
    await deleteDoc(doc(db, 'members', myUid));
    if (device?.fid === myFid) saveDevice(null);
    Object.keys(localStorage).filter(k => k.startsWith('cdc.') && k.includes(myFid)).forEach(k => store('del', k));
    busy = false;
    try { await deleteUser(auth.currentUser); } catch(e){ await signOut(auth); }
    alert('Famiglia e dati eliminati. Grazie per aver provato Compiti di casa!');
  } catch(err){ busy = false; fail(err); }
};
