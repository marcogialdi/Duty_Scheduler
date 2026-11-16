'use strict';
/* Compiti di casa · regole del gioco: stelle, serie, cartellini, chiusura dei giorni */

/* =====================================================================
   LOGICA DI GIOCO
   ===================================================================== */
/* calendario del giorno, serie e stelle: le regole vere sono in js/shared/gioco.js (condiviso con il server) */
const Gioco = globalThis.BeBeansGioco;
const streakBonusFor = n => Gioco.streakBonusFor(n, R());
const redOn = (kid, ds) => Gioco.redOn(cardsOf(kid), ds);
// il rosso "niente stelle" è copiato anche sullo stato del figlio, dove lo leggono le regole di Firestore
const noStarsOf = red => red?.effect === 'nostars' ? {noStarsFrom:red.from, noStarsUntil:red.until} : {};
function noStarsNow(kid){
  const red = cardsOf(kid).filter(c => c.type === 'red' && c.effect === 'nostars').sort((a,b) => a.from.localeCompare(b.from)).pop();
  return {noStarsFrom:red?.from || '', noStarsUntil:red?.until || ''};
}
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
/* tagli della valuta (0.16.0): 🪐 pianeta = 100 ⭐, 🌌 galassia = 1.000 ⭐. Solo come si mostrano i numeri:
   nel database tutto resta in stelle. Si spengono in Setup › Regole del gioco (rules.denoms). */
const useDenoms = () => fam?.rules?.denoms !== false;
function starsTxt(n){
  n = Math.round(Number(n) || 0);
  if (!useDenoms() || n < 100) return `${n} ⭐`;
  const parts = [[Math.floor(n / 1000), '🌌'], [Math.floor(n % 1000 / 100), '🪐'], [n % 100, '⭐']];
  return parts.filter(([v]) => v).map(([v, ic]) => `${v} ${ic}`).join(' ');
}
// festa quando il saldo forma un nuovo pianeta o una nuova galassia: una volta per soglia, sul dispositivo del figlio
function denomParty(k){
  if (isParent() || !useDenoms() || data.balance[k] == null) return;
  const key = `cdc.denom.${fid}.${k}`, cur = Math.floor(Math.max(0, data.balance[k]) / 100), prev = store('get', key);
  if (prev === null || cur <= +prev){ if (prev === null) store('set', key, String(cur)); return; }
  store('set', key, String(cur));
  toast(Math.floor(cur / 10) > Math.floor(+prev / 10) ? 'Hai formato una galassia! 🌌' : 'Hai formato un pianeta! 🪐');
}
function balance(k){
  if (data.balance[k] != null) return data.balance[k];
  const c = Number(store('get', `cdc.bal.${fid}.${k}`)); return Number.isFinite(c) ? c : 0;
}
function reserved(k){
  const list = isParent() ? (data.pending[k] || []) : (data.redemptions[k] || []).filter(r => r.status === 'pending');
  return list.reduce((a,r) => a + r.cost, 0);
}

const itemsFor = (kid, ds, swaps) => Gioco.itemsFor({tasks:data.tasks, sched:data.sched, cards:cardsOf(kid), times:T()}, kid, ds, swaps);
const pointsFor = (item, kid, ds) => Gioco.pointsFor(item, cardsOf(kid), R(), ds);

/* ---------- chiusura dei giorni passati (fatta dal dispositivo di un genitore) ---------- */
let closing = false, closedOnce = false;
const watchedKids = () => isParent() ? kidsList().map(k => k.id) : (me?.kidId ? [me.kidId] : []);
const cardsReady = () => watchedKids().every(k => loaded['cards_' + k] && loaded['medals_' + k]);
function maybeClose(){
  if (!isParent() || closedOnce || !loaded.tasks || !loaded.sched || !cardsReady()) return;
  closedOnce = true; closeDays();
}
async function closeDays(){
  if (closing) return; closing = true;
  let closed = false;
  try { for (const k of kidsList()) closed = await closeKid(k.id) || closed; }
  catch(e){ console.warn('Chiusura giorni rimandata', e); closedOnce = false; }
  finally { closing = false; }
  checkMedals(closed);                           // medaglie: subito se si è chiuso un giorno, altrimenti ogni 6 ore
}
async function closeKid(kid){
  const kref = dref('kids', kid);
  const snap = await getDoc(kref);
  const yesterday = addDays(today(), -1);
  const ns = noStarsNow(kid);                    // allinea i rossi dati prima della 0.12.2
  if (ns.noStarsFrom !== (snap.data()?.noStarsFrom || '') || ns.noStarsUntil !== (snap.data()?.noStarsUntil || ''))
    await setDoc(kref, ns, {merge:true});
  if (!snap.exists() || !snap.data().lastClosed){
    await setDoc(kref, {lastClosed:yesterday, streak:snap.data()?.streak || 0}, {merge:true}); return;
  }
  const startLast = snap.data().lastClosed;
  let streak = snap.data().streak || 0;
  if (startLast >= yesterday) return false;
  const st = medalProgress(snap.data());         // progressi per le medaglie, contati giorno per giorno
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
    const ok = new Set();
    for (const it of items){
      const c = comps.get(`${it.key}_${ds}`);
      if (c && !c.contested){ done++; ok.add(it.key); }
      else if (!c) writes.push([`miss_${it.key}_${ds}`, {kid, amount:R().missed, type:'missed', reason:`Non fatto: ${it.task.title}`, date:ds}]);
    }
    if (done === items.length){
      streak++;
      if (!noStars){
        writes.push([`perfect_${kid}_${ds}`, {kid, amount:R().perfectDay, type:'perfect', reason:'Giornata perfetta', date:ds}]);
        const b = streakBonusFor(streak);
        if (b) writes.push([`streak_${kid}_${ds}`, {kid, amount:b, type:'streak', reason:`Serie di ${streak} giorni 🔥`, date:ds, n:streak}]);
      }
    } else streak = 0;
    medalDay(st, kid, ds, items, ok, streak, done === items.length && !noStars);
  }
  await runTransaction(db, async tx => {
    const cur = await tx.get(kref);
    if (cur.data().lastClosed !== startLast) return;
    writes.forEach(([id, v]) => tx.set(dref('kids', kid, 'ledger', id), {...v, createdAt:serverTimestamp()}));
    tx.update(kref, {lastClosed:yesterday, streak, ...medalFields(st)});
  });
  return true;
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
    `Con le stelle compri i premi del negozio: mamma e papà approvano la richiesta. Se un premio costa ancora troppo, sceglilo come <b>🎯 obiettivo</b>: una barra ti mostra quanto manca.`,
    `Le <b>medaglie 🏅</b> premiano i traguardi (la prima giornata perfetta, la prima settimana perfetta…): si vincono una volta sola, non danno stelle e restano tue per sempre.`,
  ];
}
