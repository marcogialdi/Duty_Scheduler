/* Chiusura dei giorni passati: giornata perfetta, serie e bonus, penalità dei compiti non fatti, progressi delle medaglie.
   Calcolo puro (nessun accesso al database): riceve i dati di un figlio e dice cosa scrivere.
   È la versione server di closeKid (js/game.js) e di medalDay (js/medals.js) della 0.16.x:
   stessi documenti, stessi id fissi, stessi importi. Finché l'app ha ancora closeKid,
   functions/test/equivalenza.test.mjs controlla che i due calcoli diano lo stesso risultato. */
import { addDays, itemsFor, redOn, streakBonusFor } from '../shared/gioco.js';

export const GIORNI_MAX = 60;                 // come l'app: al rientro si recuperano al massimo 60 giorni

/* ---------- progressi delle medaglie che si contano giorno per giorno ---------- */
export const bestStreakOf = ks => Math.max(ks.bestStreak || 0, ks.streak || 0);
export function medalProgress(d){
  return {bestStreak: bestStreakOf(d), mornStreak: d.mornStreak || 0, mornBest: d.mornBest || 0,
          perfMonth: d.perfMonth || '', perfMonthN: d.perfMonthN || 0, perfMonthBest: d.perfMonthBest || 0,
          comeback: !!d.comeback, punOk: d.punOk ?? null, punDone: !!d.punDone, init: !!d.medalInit};
}
export const medalFields = ({init, ...st}) => st;
const slotOf = (t, times) => t < times.afternoon ? 'Mattina' : t < times.evening ? 'Pomeriggio' : 'Sera';

// ok = chiavi dei compiti obbligatori fatti quel giorno; perfectEntry = è stata scritta la giornata perfetta
function medalDay(st, cards, times, ds, items, ok, streak, perfectEntry){
  st.bestStreak = Math.max(st.bestStreak, streak);
  const morn = items.filter(i => !i.pun && slotOf(i.time, times) === 'Mattina');
  if (morn.length){ st.mornStreak = morn.every(i => ok.has(i.key)) ? st.mornStreak + 1 : 0; st.mornBest = Math.max(st.mornBest, st.mornStreak); }
  if (perfectEntry && st.init){
    const ym = ds.slice(0, 7);
    if (ym !== st.perfMonth){ st.perfMonth = ym; st.perfMonthN = 0; }
    st.perfMonthBest = Math.max(st.perfMonthBest, ++st.perfMonthN);
  }
  if (streak >= 7 && cards.some(c => c.type === 'red' && c.date <= ds)) st.comeback = true;
  const red = redOn(cards, ds);
  if (red?.effect === 'extra'){
    const pun = items.filter(i => i.pun);
    if (ds === red.from) st.punOk = true;
    if (!pun.length || !pun.every(i => ok.has(i.key))) st.punOk = false;
    if (ds === red.until && st.punOk === true) st.punDone = true;
  }
}

// il rosso "niente stelle" più recente, copiato sullo stato del figlio perché lo leggano le regole di Firestore
export function noStarsNow(cards){
  const red = cards.filter(c => c.type === 'red' && c.effect === 'nostars').sort((a, b) => a.from.localeCompare(b.from)).pop();
  return {noStarsFrom: red?.from || '', noStarsUntil: red?.until || ''};
}

// primo giorno da chiudere per uno stato (null se non c'è niente da fare)
export function primoGiorno(stato, ieri){
  if (!stato?.lastClosed || stato.lastClosed >= ieri) return null;
  const from = addDays(stato.lastClosed, 1), min = addDays(ieri, -(GIORNI_MAX - 1));
  return from < min ? min : from;
}

/* Calcola la chiusura di un figlio fino a ieri.
   fam   = {tasks, sched, times, rules}   (regole e orari già completati con i predefiniti)
   stato = documento kids/{kid} (o null)  cards = cartellini del figlio
   swaps = scambi del periodo             comps = Map id → completamento del periodo
   Risultato:
   - {tipo: 'nuovo', aggiorna}            figlio mai chiuso: si parte da ieri, come fa l'app
   - {tipo: 'niente'}                     già chiuso fino a ieri
   - {tipo: 'chiudi', da, lastClosed, scritture: [[id, voce]], aggiorna, giorni: [{giorno, voci, serie}]} */
export function calcolaChiusura({fam, kid, stato, cards, swaps, comps, ieri}){
  const {rules, times} = fam;
  if (!stato?.lastClosed) return {tipo: 'nuovo', aggiorna: {lastClosed: ieri, streak: stato?.streak || 0}};
  const from = primoGiorno(stato, ieri);
  if (!from) return {tipo: 'niente'};
  let streak = stato.streak || 0;
  const st = medalProgress(stato);
  const famGiorno = {tasks: fam.tasks, sched: fam.sched, cards, times};
  const scritture = [], giorni = [];
  for (let ds = from; ds <= ieri; ds = addDays(ds, 1)){
    // i compiti facoltativi non contano per giornata perfetta, serie e penalità
    const items = itemsFor(famGiorno, kid, ds, swaps).filter(i => !i.optional);
    if (!items.length) continue;
    const noStars = redOn(cards, ds)?.effect === 'nostars';
    const voci = [];
    let done = 0;
    const ok = new Set();
    for (const it of items){
      const c = comps.get(`${it.key}_${ds}`);
      if (c && !c.contested){ done++; ok.add(it.key); }
      else if (!c) voci.push([`miss_${it.key}_${ds}`, {kid, amount: rules.missed, type: 'missed', reason: `Non fatto: ${it.task.title}`, date: ds}]);
    }
    if (done === items.length){
      streak++;
      if (!noStars){
        voci.push([`perfect_${kid}_${ds}`, {kid, amount: rules.perfectDay, type: 'perfect', reason: 'Giornata perfetta', date: ds}]);
        const b = streakBonusFor(streak, rules);
        if (b) voci.push([`streak_${kid}_${ds}`, {kid, amount: b, type: 'streak', reason: `Serie di ${streak} giorni 🔥`, date: ds, n: streak}]);
      }
    } else streak = 0;
    medalDay(st, cards, times, ds, items, ok, streak, done === items.length && !noStars);
    scritture.push(...voci);
    giorni.push({giorno: ds, voci: Object.fromEntries(voci.map(([id, v]) => [id, {amount: v.amount, type: v.type}])), serie: streak});
  }
  return {tipo: 'chiudi', da: from, lastClosed: stato.lastClosed, scritture, giorni,
          aggiorna: {lastClosed: ieri, streak, ...medalFields(st)}, medaglie: medalFields(st), medalInit: st.init};
}
