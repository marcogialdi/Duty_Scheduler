'use strict';
/* Compiti di casa · dati in tempo reale e navigazione tra le viste */

/* =====================================================================
   DATI IN TEMPO REALE
   ===================================================================== */
let unsubs = [], unsubDay = [];
const kidUnsubs = {};
function sub(q, fn){ unsubs.push(onSnapshot(q, s => { fn(s); maybeClose(); render(); }, fail)); }
function stopData(){
  [...unsubs, ...unsubDay].forEach(u => u()); unsubs = []; unsubDay = [];
  Object.values(kidUnsubs).flat().forEach(u => u()); for (const k in kidUnsubs) delete kidUnsubs[k];
  for (const k in loaded) delete loaded[k];
  data = blank(); closedOnce = false; clearTimeout(idleT);
}
function startData(){
  sub(col('tasks'), s => { data.tasks = Object.fromEntries(s.docs.map(d => [d.id, {id:d.id, ...d.data()}])); loaded.tasks = true; });
  sub(col('schedule'), s => { data.sched = docs(s); loaded.sched = true; });
  sub(col('rewards'), s => { data.rewards = docs(s); });
  if (isParent()){
    sub(query(col('completions'), where('date','>=',addDays(today(),-2))), s => { data.verify = docs(s); });
    // scambi degli stessi giorni: servono alla griglia di "Da verificare" per sapere chi doveva fare cosa
    sub(query(col('swaps'), where('date','>=',addDays(today(),-2))), s => { data.verSwaps = docs(s); });
    sub(query(collection(db,'members'), where('familyId','==',fid), where('role','==','parent')), s => { data.parents = docs(s); });
    sub(query(collection(db,'invites'), where('familyId','==',fid)), s => { data.invites = docs(s); });
  }
  syncKidWatch();
  watchDay();
}
// per ogni figlio: stato, ultimi movimenti, cartellini, richieste premi
function syncKidWatch(){
  if (!me?.role) return;
  const want = watchedKids();
  for (const k of Object.keys(kidUnsubs)) if (!want.includes(k)){ kidUnsubs[k].forEach(u => u()); delete kidUnsubs[k]; }
  for (const k of want) if (!kidUnsubs[k]) watchKid(k);
}
function watchKid(k){
  const u = [];
  const on = (q, fn) => u.push(onSnapshot(q, s => { fn(s); maybeClose(); render(); }, fail));
  on(dref('kids', k), s => { data.kidState[k] = s.exists() ? s.data() : {}; });
  on(query(col('kids',k,'ledger'), orderBy('createdAt','desc'), limit(40)), s => { data.ledger[k] = docs(s); refreshBalance(k); });
  on(col('kids',k,'cards'), s => { data.cards[k] = docs(s); loaded['cards_' + k] = true; });
  if (isParent()) on(query(col('kids',k,'redemptions'), where('status','==','pending')), s => { data.pending[k] = docs(s); });
  else on(query(col('kids',k,'redemptions'), orderBy('createdAt','desc'), limit(20)), s => { data.redemptions[k] = docs(s); });
  // C: proposte dei ragazzi
  if (isParent()) on(query(col('kids',k,'proposals'), where('status','==','pending')), s => { data.propPending[k] = docs(s); });
  else on(query(col('kids',k,'proposals'), orderBy('createdAt','desc'), limit(20)), s => { data.proposals[k] = docs(s); });
  kidUnsubs[k] = u;
}
function watchDay(){
  unsubDay.forEach(u => u()); unsubDay = []; data.swaps = []; data.comps = [];
  if (!fid || !me?.role) return;
  unsubDay = [
    onSnapshot(query(col('swaps'), where('date','==',day)), s => { data.swaps = docs(s); render(); }, fail),
    onSnapshot(query(col('completions'), where('date','==',day)), s => { data.comps = docs(s); render(); }, fail),
  ];
}
// se l'app resta aperta dopo mezzanotte, torna sul nuovo "oggi" e chiude i conti del giorno prima
let lastRenderToday = today();
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !fid) return;
  if (day === lastRenderToday && today() !== lastRenderToday) changeDay(today());
  closedOnce = false; maybeClose();
});

function render(){
  if (!fam || !me?.role || !loaded.tasks || !loaded.sched) return;
  collabRepair();
  if (view === 'parent') return renderParent();
  if (view === 'setup') return renderSetupLists();
  if (!kidById(owner)) return;
  renderScore();
  if (subView === 'day') renderDay();
  if (subView === 'shop') renderShop();
  if (subView === 'log') renderLog();
}

/* ---------- tab ---------- */
function renderTabs(){
  if (!isParent()){ $('tabs').hidden = true; return; }
  $('tabs').hidden = false;
  $('tabs').innerHTML = kidsList().map(k => `<button class="tab ${view===k.id?'on':''}" style="--k:${k.color}" data-v="${k.id}"><span class="tav">${k.avatar || ''}</span>${esc(k.name)}</button>`).join('') +
    `<button class="tab par ${view==='parent'?'on':''}" data-v="parent">👪 Genitori</button>` +
    `<button class="tab par ${view==='setup'?'on':''}" data-v="setup">⚙️ Setup</button>`;
}
$('tabs').onclick = e => { const b = e.target.closest('button'); if (b) goView(b.dataset.v); };
function goView(v, anchor){
  view = v; if (v !== 'setup') store('set', `cdc.view.${fid}`, v);
  if (kidById(v)) owner = v;
  if (v === 'setup'){ fillSetup(); if (STAB_OF[anchor]) showStab(STAB_OF[anchor]); }
  renderTabs(); applyView(); render();
  if (anchor) setTimeout(() => $(anchor)?.scrollIntoView({behavior:'smooth', block:'start'}), 50);
}
function applyView(){
  $('kidView').hidden = !kidById(view);
  $('parentView').hidden = view !== 'parent';
  $('setupView').hidden = view !== 'setup';
  if (view === 'setup' && !applyView.filled) fillSetup();
}
$('sub').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  subView = b.dataset.sv;
  document.querySelectorAll('#sub button').forEach(x => x.classList.toggle('on', x === b));
  $('svDay').hidden = subView !== 'day'; $('svShop').hidden = subView !== 'shop'; $('svLog').hidden = subView !== 'log';
  render();
};
function changeDay(ds){ day = ds; swapPick = null; watchDay(); render(); }
$('prev').onclick = () => changeDay(addDays(day,-1));
$('next').onclick = () => changeDay(addDays(day, 1));
$('todayLink').onclick = () => changeDay(today());
