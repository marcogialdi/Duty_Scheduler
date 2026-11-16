/* BeBeans · regole del gioco condivise tra l'app (browser) e il server (Cloud Functions).
   Migrazione, fase 0 (docs/migrazione.md): un solo file, così app e server non possono divergere.

   Regole per chi modifica questo file:
   - niente import, niente DOM, niente Firebase: solo funzioni pure su dati semplici;
   - le date sono stringhe 'aaaa-mm-gg' e i calcoli sulle date non dipendono dal fuso del dispositivo
     (il server gira in UTC, i telefoni in ora italiana): il fuso entra solo in oggi(fuso);
   - il server ne usa una copia (functions/shared/gioco.js, creata da `npm run condiviso` in functions/):
     non modificare la copia, modificare questo file.

   Nell'app è caricato come modulo prima degli altri script, che lo trovano in globalThis.BeBeansGioco. */

export const VERSIONE_GIOCO = 1;               // aumenta quando cambia il significato di un calcolo
export const FUSO_PREDEFINITO = 'Europe/Rome';

/* ---------- impostazioni predefinite del gioco (una famiglia nuova parte da queste) ---------- */
export const REGOLE_PREDEFINITE = Object.freeze({
  perfectDay: 3, missed: -1, swapFavor: 1,
  streak3: 5, streak7: 15, streak14: 40, streakEveryBonus: 15,
  cheatMultiplier: 2, contestHours: 48,
  yellowWindowDays: 14, yellowsForRed: 3, redDays: 3,
});
export const ORARI_PREDEFINITI = Object.freeze({wake: '06:50', afternoon: '13:00', evening: '19:00', bed: '21:00'});

// regole e orari effettivi di una famiglia: i predefiniti completati da quelli salvati nel documento della famiglia
export function regoleDi(fam){ return {...REGOLE_PREDEFINITE, ...(fam?.rules || {})}; }
export function orariDi(fam){ return {...ORARI_PREDEFINITI, ...(fam?.times || {})}; }

/* ---------- date 'aaaa-mm-gg' (calcoli in UTC: stesso risultato su ogni dispositivo) ---------- */
const pad = n => String(n).padStart(2, '0');
const partiData = s => s.split('-').map(Number);
const daUTC = ms => { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
export function addDays(s, n){ const [y, m, d] = partiData(s); return daUTC(Date.UTC(y, m - 1, d + n)); }
// 1 = lunedì … 7 = domenica
export function isoWeekday(s){ const [y, m, d] = partiData(s); return new Date(Date.UTC(y, m - 1, d)).getUTCDay() || 7; }
export function quarterKey(s){ const [y, m] = partiData(s); return y + 'Q' + (Math.floor((m - 1) / 3) + 1); }
// la data di oggi in un fuso (per il server: sempre l'ora italiana, mai quella del computer di Google)
export function oggi(fuso = FUSO_PREDEFINITO, adesso = new Date()){
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit'})
    .formatToParts(adesso).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

/* ---------- cartellini, serie, stelle ---------- */
export const isTeamSched = s => s?.owner === 'team';
// il cartellino rosso attivo in un giorno (cards = cartellini del figlio)
export function redOn(cards, ds){ return (cards || []).find(c => c.type === 'red' && c.from <= ds && ds <= c.until); }
// bonus della serie al giorno n di giornate perfette di fila
export function streakBonusFor(n, rules){
  if (n === 3) return rules.streak3;
  if (n === 7) return rules.streak7;
  if (n === 14) return rules.streak14;
  return n > 14 && (n - 14) % 7 === 0 ? rules.streakEveryBonus : 0;
}

/* ---------- calendario del giorno ----------
   I compiti di un figlio in un giorno, in ordine di orario.
   fam = {tasks: {id: compito}, sched: [assegnazioni], cards: [cartellini del figlio], times: orari della famiglia}
   swaps = scambi tra fratelli (si usano solo quelli del giorno, in attesa o accettati).
   Ogni voce: {key, task, time, s, sw?, received?, optional, collab?, pun?} */
export function itemsFor(fam, kid, ds, swaps){
  const {tasks, sched, cards, times} = fam;
  const wd = isoWeekday(ds);
  const todays = sched.filter(s => s.active && tasks[s.taskId] && !tasks[s.taskId].punishment && !tasks[s.taskId].board &&
    (s.weekdays || []).includes(wd) && s.startDate <= ds && (!s.endDate || s.endDate >= ds));
  const live = (swaps || []).filter(x => x.date === ds && (x.status === 'pending' || x.status === 'accepted'));
  const swapBy = Object.fromEntries(live.map(x => [x.scheduleId, x]));
  const items = [];
  for (const s of todays){
    const sw = swapBy[s.id], task = tasks[s.taskId];
    const optional = !!task.optional;
    // compito di squadra: una sola assegnazione per tutti i membri, mai scambiabile
    if (isTeamSched(s)){ if ((s.team || []).includes(kid)) items.push({key: s.id, task, time: s.startTime, s, optional: true, collab: true}); continue; }
    if (s.owner === kid && !(sw && sw.status === 'accepted')) items.push({key: s.id, task, time: s.startTime, s, sw, received: false, optional});
    else if (s.owner !== kid && sw?.status === 'accepted' && sw.toOwner === kid) items.push({key: s.id, task, time: s.startTime, s, sw, received: true, optional});
  }
  // cartellino rosso "compiti di recupero": si aggiungono i compiti di recupero, senza stelle
  if (redOn(cards, ds)?.effect === 'extra'){
    Object.values(tasks).filter(t => t.punishment).forEach(t =>
      items.push({key: `extra-${t.id}-${kid}`, task: t, time: t.defaultTime || times.evening, pun: true}));
  }
  return items.sort((a, b) => a.time.localeCompare(b.time));
}

// stelle di un compito del calendario (0 con il rosso "niente stelle" e per i compiti di recupero)
export function pointsFor(item, cards, rules, ds){
  if (item.pun) return 0;
  if (redOn(cards, ds)?.effect === 'nostars') return 0;
  return (item.task.points || 1) + (item.received ? rules.swapFavor : 0);
}

// nell'app gli altri file sono script normali: lo trovano qui
globalThis.BeBeansGioco = Object.freeze({
  VERSIONE_GIOCO, FUSO_PREDEFINITO, REGOLE_PREDEFINITE, ORARI_PREDEFINITI, regoleDi, orariDi,
  addDays, isoWeekday, quarterKey, oggi, isTeamSched, redOn, streakBonusFor, itemsFor, pointsFor,
});
