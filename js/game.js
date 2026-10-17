'use strict';
/* Compiti di casa · regole del gioco: stelle, serie, cartellini, chiusura dei giorni */

/* =====================================================================
   LOGICA DI GIOCO
   ===================================================================== */
function streakBonusFor(n){
  if (n === 3) return R().streak3;
  if (n === 7) return R().streak7;
  if (n === 14) return R().streak14;
  return n > 14 && (n - 14) % 7 === 0 ? R().streakEveryBonus : 0;
}
function redOn(kid, ds){ return cardsOf(kid).find(c => c.type === 'red' && c.from <= ds && ds <= c.until); }
function lastRedDate(kid){ return cardsOf(kid).filter(c => c.type === 'red').map(c => c.date).sort().pop() || ''; }
function activeYellows(kid){
  const lr = lastRedDate(kid), lim = addDays(today(), -R().yellowWindowDays);
  return cardsOf(kid).filter(c => c.type === 'yellow' && c.date > lim && c.date > lr);
}
function redsInQuarter(kid, ds = today()){
  const q = quarterKey(ds);
  return cardsOf(kid).filter(c => c.type === 'red' && quarterKey(c.date) === q);
}
// saldo: somma calcolata dal server (1 lettura) invece di leggere tutto lo storico
const balTimers = {};
function refreshBalance(k){
  clearTimeout(balTimers[k]);
  balTimers[k] = setTimeout(async () => {
    try {
      const s = await getAggregateFromServer(col('kids',k,'ledger'), {total: sum('amount')});
      data.balance[k] = s.data().total || 0;
      store('set', `cdc.bal.${fid}.${k}`, String(data.balance[k]));
      render();
    } catch(e){ console.warn('Saldo non aggiornato (offline?)', e); }
  }, 250);
}
function balance(k){
  if (data.balance[k] != null) return data.balance[k];
  const c = Number(store('get', `cdc.bal.${fid}.${k}`)); return Number.isFinite(c) ? c : 0;
}
function reserved(k){
  const list = isParent() ? (data.pending[k] || []) : (data.redemptions[k] || []).filter(r => r.status === 'pending');
  return list.reduce((a,r) => a + r.cost, 0);
}

function itemsFor(kid, ds, swaps){
  const wd = isoWeekday(ds);
  const todays = data.sched.filter(s => s.active && data.tasks[s.taskId] && !data.tasks[s.taskId].punishment && !data.tasks[s.taskId].board &&
    (s.weekdays||[]).includes(wd) && s.startDate <= ds && (!s.endDate || s.endDate >= ds));
  const live = swaps.filter(x => x.date === ds && (x.status === 'pending' || x.status === 'accepted'));
  const swapBy = Object.fromEntries(live.map(x => [x.scheduleId, x]));
  const items = [];
  for (const s of todays){
    const sw = swapBy[s.id], task = data.tasks[s.taskId];
    const optional = !!task.optional;
    // compito di squadra: una sola assegnazione per tutti i membri, mai scambiabile
    if (isTeamSched(s)){ if ((s.team || []).includes(kid)) items.push({key:s.id, task, time:s.startTime, s, optional:true, collab:true}); continue; }
    if (s.owner === kid && !(sw && sw.status === 'accepted')) items.push({key:s.id, task, time:s.startTime, s, sw, received:false, optional});
    else if (s.owner !== kid && sw?.status === 'accepted' && sw.toOwner === kid) items.push({key:s.id, task, time:s.startTime, s, sw, received:true, optional});
  }
  if (redOn(kid, ds)?.effect === 'extra'){
    Object.values(data.tasks).filter(t => t.punishment).forEach(t =>
      items.push({key:`extra-${t.id}-${kid}`, task:t, time:t.defaultTime || T().evening, pun:true}));
  }
  return items.sort((a,b) => a.time.localeCompare(b.time));
}
function pointsFor(item, kid, ds){
  if (item.pun) return 0;
  if (redOn(kid, ds)?.effect === 'nostars') return 0;
  return (item.task.points || 1) + (item.received ? R().swapFavor : 0);
}

/* ---------- chiusura dei giorni passati (fatta dal dispositivo di un genitore) ---------- */
let closing = false, closedOnce = false;
const watchedKids = () => isParent() ? kidsList().map(k => k.id) : (me?.kidId ? [me.kidId] : []);
const cardsReady = () => watchedKids().every(k => loaded['cards_' + k]);
function maybeClose(){
  if (!isParent() || closedOnce || !loaded.tasks || !loaded.sched || !cardsReady()) return;
  closedOnce = true; closeDays();
}
async function closeDays(){
  if (closing) return; closing = true;
  try { for (const k of kidsList()) await closeKid(k.id); }
  catch(e){ console.warn('Chiusura giorni rimandata', e); closedOnce = false; }
  finally { closing = false; }
}
async function closeKid(kid){
  const kref = dref('kids', kid);
  const snap = await getDoc(kref);
  const yesterday = addDays(today(), -1);
  if (!snap.exists() || !snap.data().lastClosed){
    await setDoc(kref, {lastClosed:yesterday, streak:snap.data()?.streak || 0}, {merge:true}); return;
  }
  const startLast = snap.data().lastClosed;
  let streak = snap.data().streak || 0;
  if (startLast >= yesterday) return;
  let from = addDays(startLast, 1);
  if (from < addDays(yesterday, -59)) from = addDays(yesterday, -59);
  const [sw, cp] = await Promise.all([
    getDocs(query(col('swaps'),       where('date','>=',from), where('date','<=',yesterday))),
    getDocs(query(col('completions'), where('date','>=',from), where('date','<=',yesterday))),
  ]);
  const swaps = docs(sw);
  const comps = new Map(cp.docs.map(d => [d.id, d.data()]));
  const writes = [];
  for (let ds = from; ds <= yesterday; ds = addDays(ds, 1)){
    // i compiti facoltativi non contano per giornata perfetta, serie e penalità
    const items = itemsFor(kid, ds, swaps).filter(i => !i.optional);
    if (!items.length) continue;
    const noStars = redOn(kid, ds)?.effect === 'nostars';
    let done = 0;
    for (const it of items){
      const c = comps.get(`${it.key}_${ds}`);
      if (c && !c.contested) done++;
      else if (!c) writes.push([`miss_${it.key}_${ds}`, {kid, amount:R().missed, type:'missed', reason:`Non fatto: ${it.task.title}`, date:ds}]);
    }
    if (done === items.length){
      streak++;
      if (!noStars){
        writes.push([`perfect_${kid}_${ds}`, {kid, amount:R().perfectDay, type:'perfect', reason:'Giornata perfetta', date:ds}]);
        const b = streakBonusFor(streak);
        if (b) writes.push([`streak_${kid}_${ds}`, {kid, amount:b, type:'streak', reason:`Serie di ${streak} giorni 🔥`, date:ds}]);
      }
    } else streak = 0;
  }
  await runTransaction(db, async tx => {
    const cur = await tx.get(kref);
    if (cur.data().lastClosed !== startLast) return;
    writes.forEach(([id, v]) => tx.set(dref('kids', kid, 'ledger', id), {...v, createdAt:serverTimestamp()}));
    tx.update(kref, {lastClosed:yesterday, streak});
  });
}

function gameRules(){
  const r = R();
  return [
    `Ogni compito fatto vale le stelle indicate: le ricevi appena lo segni come fatto (solo nel giorno stesso).`,
    `Tutti i compiti del giorno fatti = <b>giornata perfetta</b>: +${r.perfectDay} ⭐.`,
    `Giornate perfette di fila = <b>serie 🔥</b>: +${r.streak3} a 3 giorni, +${r.streak7} a 7, +${r.streak14} a 14 e poi +${r.streakEveryBonus} ogni settimana. Un giorno saltato azzera la serie.`,
    `Se accetti un compito di un fratello prendi le sue stelle +${r.swapFavor} di favore.`,
    `Compito non fatto a fine giornata: ${r.missed} ⭐.`,
    `Segnare fatto un compito che non hai fatto: restituisci le stelle, ne perdi ${r.cheatMultiplier} volte il valore, perdi la serie e prendi un <b>cartellino giallo 🟨</b>. Dire la verità conviene sempre!`,
    `${r.yellowsForRed} gialli in ${r.yellowWindowDays} giorni = <b>cartellino rosso 🟥</b>. Il primo rosso del trimestre: per ${r.redDays} giorni i compiti non danno stelle. Dal secondo rosso nel trimestre: ${r.redDays} giorni di compiti di recupero 🔄.`,
    `I compiti <b>facoltativi ✨</b> danno stelle se li fai, ma non contano per la giornata perfetta: se li salti non perdi nulla.`,
    `I <b>lavoretti extra 🧹</b> (es. la pattumiera) si fanno quando servono: dopo averlo fatto tocca "L'ho fatto!". Chi arriva prima lo segna; non contano per la giornata perfetta.`,
    `Hai fatto qualcos'altro di utile? <b>Proponilo 💡</b>: se mamma e papà approvano, decidono loro quante stelle darti.`,
    `I compiti <b>di squadra 🤝</b> si fanno insieme: uno lo segna, gli altri confermano "l'abbiamo fatto". Le stelle arrivano a tutti solo quando hanno confermato tutti; se non era vero, il cartellino giallo va a tutta la squadra.`,
    `Anche facoltativi e lavoretti extra si possono controllare: se non è vero, vale la regola del cartellino giallo.`,
    `Con le stelle compri i premi del negozio: mamma e papà approvano la richiesta.`,
  ];
}
