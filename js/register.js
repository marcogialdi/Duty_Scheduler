'use strict';
/* Compiti di casa · registrazione guidata e invito di un altro genitore */

/* =====================================================================
   REGISTRAZIONE GUIDATA
   ===================================================================== */
let regStep = 0, regKids = [];
const regSteps = () => auth.currentUser ? ['family','kids','finish'] : ['account','family','kids','finish'];
const newKidDraft = i => ({name:'', pin:'', color:KID_COLORS[i % KID_COLORS.length], avatar:AVATAR_LIST[i * 3 % AVATAR_LIST.length]});
function openRegister(){
  regStep = 0;
  if (!regKids.length) regKids = [newKidDraft(0)];
  drawRegKids(); drawRegStep(); show('scrRegister');
}
function drawRegStep(){
  const steps = regSteps(), cur = steps[regStep];
  document.querySelectorAll('#regForm .wstep').forEach(s => s.hidden = s.dataset.step !== cur);
  $('regSteps').innerHTML = steps.map((s,i) => `<span class="${i <= regStep ? 'on' : ''}"></span>`).join('');
  $('rBack').textContent = regStep ? '‹ Indietro' : '‹ Annulla';
  $('rNext').textContent = regStep === steps.length - 1 ? '✨ Crea la famiglia' : 'Avanti ›';
  $('rNameBox').hidden = !auth.currentUser;
}
function drawRegKids(){
  $('rKids').innerHTML = regKids.map((k,i) => `
    <div class="kidrow" data-i="${i}">
      <div><label>Icona</label><button type="button" class="avbtn" data-av="${i}" aria-label="Scegli icona">${k.avatar}</button></div>
      <div><label>Nome</label><input data-f="name" value="${esc(k.name)}" placeholder="Es. Ricky" autocomplete="off"></div>
      <div><label>Colore</label><input type="color" data-f="color" value="${k.color}"></div>
      <div class="pin"><label>PIN (6 cifre)</label><input data-f="pin" value="${esc(k.pin)}" inputmode="numeric" maxlength="6" placeholder="••••••" autocomplete="off"></div>
      <div class="rm">${regKids.length > 1 ? `<button type="button" class="btn no icon" data-rm="${i}" aria-label="Togli">✕</button>` : ''}</div>
    </div>`).join('');
  $('rAddKid').hidden = regKids.length >= MAX_KIDS;
}
$('rKids').addEventListener('input', e => {
  const row = e.target.closest('.kidrow'), f = e.target.dataset.f;
  if (!row || !f) return;
  if (f === 'pin') e.target.value = e.target.value.replace(/\D/g,'').slice(0,6);
  regKids[row.dataset.i][f] = e.target.value;
});
$('rKids').addEventListener('click', e => {
  const av = e.target.closest('[data-av]'), rm = e.target.closest('[data-rm]');
  if (av){ const i = +av.dataset.av; pickIcon(AVATARS, regKids[i].avatar, ic => { regKids[i].avatar = ic; drawRegKids(); }); }
  if (rm){ regKids.splice(+rm.dataset.rm, 1); drawRegKids(); }
});
$('rAddKid').onclick = () => { regKids.push(newKidDraft(regKids.length)); drawRegKids(); };
$('rBack').onclick = () => { if (regStep){ regStep--; drawRegStep(); } else auth.currentUser ? route() : defaultLoggedOut(); };
$('rNext').onclick = async () => {
  const err = validateStep(regSteps()[regStep]);
  if (err) return toast(err);
  if (regStep < regSteps().length - 1){ regStep++; drawRegStep(); window.scrollTo(0,0); }
  else await createFamily();
};
function validateStep(step){
  if (step === 'account'){
    if (!$('rName').value.trim()) return 'Scrivi il tuo nome';
    if (!/^\S+@\S+\.\S+$/.test($('rEmail').value.trim())) return 'Email non valida';
    if ($('rPass').value.length < 6) return 'La password deve avere almeno 6 caratteri';
    if ($('rPass').value !== $('rPass2').value) return 'Le due password non coincidono';
  }
  if (step === 'family'){
    if (!$('rFam').value.trim()) return 'Dai un nome alla famiglia';
    if (auth.currentUser && !$('rName2').value.trim()) return 'Scrivi il tuo nome';
  }
  if (step === 'kids'){
    if (!regKids.length) return 'Aggiungi almeno un figlio';
    for (const k of regKids){
      if (!k.name.trim()) return 'Scrivi il nome di ogni figlio';
      if (!/^\d{6}$/.test(k.pin)) return `Il PIN di ${k.name} deve avere 6 cifre`;
    }
    if (new Set(regKids.map(k => k.pin)).size !== regKids.length) return 'Ogni figlio deve avere un PIN diverso';
  }
  if (step === 'finish'){
    if (!($('rWake').value < DEFAULTS.times.afternoon)) return 'La sveglia deve essere prima delle 13:00';
    if (!($('rBed').value > DEFAULTS.times.evening)) return 'L\'ora di andare a letto deve essere dopo le 19:00';
    if (!$('rConsent').checked) return 'Per continuare serve il consenso all\'informativa';
  }
  return '';
}
async function createFamily(){
  const btn = $('rNext'); btn.disabled = true; busy = true;
  let user = auth.currentUser, stepName = 'creazione dell\'account';
  try {
    const name = (user ? $('rName2') : $('rName')).value.trim();
    if (!user) user = (await createUserWithEmailAndPassword(auth, $('rEmail').value.trim(), $('rPass').value)).user;
    stepName = 'creazione della famiglia';
    const famRef = doc(collection(db, 'families'));
    fid = famRef.id;
    const times = {...DEFAULTS.times, wake:$('rWake').value, bed:$('rBed').value};
    const famName = $('rFam').value.trim();
    const b = writeBatch(db);
    b.set(famRef, {name:famName, times, categories:DEFAULTS.categories, rules:DEFAULTS.rules, kids:[],
                   createdBy:user.uid, createdAt:serverTimestamp(), consentAt:serverTimestamp()});
    b.set(doc(db,'members',user.uid), {familyId:fid, role:'parent', name, email:user.email, createdAt:serverTimestamp(), consentAt:serverTimestamp()});
    await b.commit();
    me = {uid:user.uid, familyId:fid, role:'parent', name};
    fam = mergeCfg({name:famName, times});
    stepName = 'creazione dei figli';
    const kids = [];
    for (const k of regKids){
      kids.push(await createKid(k));
      await updateDoc(famRef, {kids});           // salvato subito: se qualcosa va storto i figli già creati restano
    }
    fam.kids = kids;
    stepName = 'caricamento degli esempi';
    if ($('rSeed').checked) await seed();
    regKids = [];
    store('set', `cdc.view.${fid}`, 'parent');
    toast('Famiglia creata! 🎉 Segui i "Primi passi"');
  } catch(err){
    console.error(err);
    const famMade = ['creazione dei figli', 'caricamento degli esempi'].includes(stepName);
    alert(`Qualcosa non è andato durante: ${stepName}.\n(${AUTH_MSG[err?.code] || err?.code || err?.message})\n\n` +
      (famMade
        ? 'La famiglia è stata creata comunque. Controlla in ⚙️ Setup i figli e, se mancano i compiti, usa "Carica compiti e premi di esempio" nella scheda Genitori.'
        : 'Il tuo account è già creato: ricarica la pagina, entra con email e password e scegli "Crea una nuova famiglia".'));
  }
  finally { busy = false; btn.disabled = false; fam = null; }
  if (auth.currentUser) await loadMe(auth.currentUser);
}

/* ---------- invito di un altro genitore ---------- */
const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function openJoin(code){
  if (code) $('jCode').value = code.toUpperCase();
  $('jCreds').hidden = !!auth.currentUser;
  show('scrJoin');
}
$('joinForm').onsubmit = async e => {
  e.preventDefault();
  const code = $('jCode').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const name = $('jName').value.trim();
  if (code.length < 6) return toast('Scrivi il codice d\'invito');
  if (!name) return toast('Scrivi il tuo nome');
  if (!auth.currentUser){
    if (!/^\S+@\S+\.\S+$/.test($('jEmail').value.trim())) return toast('Email non valida');
    if ($('jPass').value.length < 6) return toast('La password deve avere almeno 6 caratteri');
    if ($('jPass').value !== $('jPass2').value) return toast('Le due password non coincidono');
  }
  if (!$('jConsent').checked) return toast('Per continuare serve il consenso all\'informativa');
  try {
    const inv = await getDoc(doc(db, 'invites', code));
    if (!inv.exists() || ms(inv.data().expiresAt) < Date.now()) return toast('Codice non valido o scaduto');
    busy = true;
    const user = auth.currentUser || (await createUserWithEmailAndPassword(auth, $('jEmail').value.trim(), $('jPass').value)).user;
    await setDoc(doc(db, 'members', user.uid), {familyId:inv.data().familyId, role:'parent', name, email:user.email,
      invite:code, createdAt:serverTimestamp(), consentAt:serverTimestamp()});
    busy = false;
    history.replaceState(null, '', location.pathname);
    await loadMe(user);
    toast('Benvenuto in famiglia! 👋');
  } catch(err){ busy = false; fail(err); }
};
