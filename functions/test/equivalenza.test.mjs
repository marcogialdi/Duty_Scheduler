/* Equivalenza tra la chiusura dei giorni dell'app (closeKid in js/game.js, medalDay in js/medals.js)
   e quella del server (src/chiusura.js), su famiglie generate a caso.
   Il codice dell'app è letto dai suoi file ed eseguito con un finto database: se qualcuno cambia uno dei due
   calcoli senza l'altro, questo test lo dice. Va tolto quando closeKid esce dall'app (fine della fase 1). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as G from '../shared/gioco.js';
import { calcolaChiusura, primoGiorno } from '../src/chiusura.js';

const leggi = p => readFileSync(new URL(`../../js/${p}`, import.meta.url), 'utf8');
const medals = leggi('medals.js');
const medalCode = medals.match(/^const bestStreakOf = .*$/m)[0] + '\n'
  + medals.slice(medals.indexOf('/* ---------- progressi che si contano'), medals.indexOf('/* ---------- primo avvio'));
const gameCode = leggi('game.js');

/* l'app in un recinto: finto Firestore in memoria con le sole operazioni usate da closeKid */
function appRecinto(){
  const ctx = {globalThis: null, BeBeansGioco: globalThis.BeBeansGioco, console};
  ctx.globalThis = ctx;
  const src = `
    const db = {}; let fam = null, data = null, fid = 'f', me = null, loaded = {};
    let ORA = '', DB = {};
    const R = () => fam.rules, T = () => fam.times;
    const cardsOf = k => data.cards[k] || [];
    const isParent = () => true, kidsList = () => [];
    const slotOf = t => t < T().afternoon ? 'Mattina' : t < T().evening ? 'Pomeriggio' : 'Sera';
    const isTeamSched = s => s?.owner === 'team';
    const today = () => ORA, addDays = BeBeansGioco.addDays, quarterKey = BeBeansGioco.quarterKey;
    const serverTimestamp = () => 'TS';
    const dref = (...p) => p.join('/'), col = (...p) => p.join('/');
    const where = (f, op, v) => ({f, op, v});
    const query = (c, ...w) => ({c, w});
    const snap = p => ({exists: () => p in DB, data: () => DB[p]});
    async function getDoc(p){ return snap(p); }
    async function setDoc(p, v, o){ DB[p] = o?.merge ? {...(DB[p] || {}), ...v} : v; }
    async function getDocs(q){
      const ok = d => q.w.every(({f, op, v}) => op === '>=' ? d[f] >= v : op === '<=' ? d[f] <= v : d[f] === v);
      const pre = q.c + '/';
      return {docs: Object.keys(DB).filter(p => p.startsWith(pre) && !p.slice(pre.length).includes('/') && ok(DB[p]))
        .map(p => ({id: p.slice(pre.length), data: () => DB[p]}))};
    }
    async function runTransaction(_db, fn){
      const scritti = [];
      await fn({get: async p => snap(p), set: (p, v) => scritti.push(['set', p, v]), update: (p, v) => scritti.push(['update', p, v])});
      for (const [op, p, v] of scritti) DB[p] = op === 'update' ? {...DB[p], ...v} : v;
    }
    const docs = s => s.docs.map(d => ({id: d.id, ...d.data()}));
    const checkMedals = () => {};
    ${gameCode}
    ${medalCode}
    globalThis.prova = async (stato) => { fam = stato.fam; data = stato.data; ORA = stato.oggi; DB = stato.db; await closeKid(stato.kid); return DB; };
  `;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.prova;
}

let seme = 11;
const rnd = n => { seme = (seme * 1103515245 + 12345) % 2147483648; return Math.floor(seme / 65536) % n; };   // bit alti: quelli bassi si ripetono
const KIDS = ['kA', 'kB'];
const OGGI = '2026-11-16';

function famigliaACaso(){
  const tasks = {};
  for (let i = 0; i < 6; i++) tasks['t' + i] = {id: 't' + i, title: 'Compito ' + i, points: rnd(4),
    optional: !rnd(5), punishment: !rnd(6), board: !rnd(8), defaultTime: rnd(2) ? '07:30' : undefined};
  tasks.t5.punishment = true;                    // sempre almeno un compito di recupero, per il cartellino rosso «recupero»
  const sched = [];
  for (let i = 0; i < 8; i++){
    const team = !rnd(6);
    sched.push({id: 's' + i, taskId: 't' + rnd(6), active: !!rnd(6), owner: team ? 'team' : KIDS[rnd(2)], team: team ? KIDS : undefined,
      weekdays: [1, 2, 3, 4, 5, 6, 7].filter(() => rnd(3)), startDate: G.addDays(OGGI, -rnd(80)),
      endDate: rnd(4) ? undefined : G.addDays(OGGI, -rnd(40)), startTime: ['07:00', '08:15', '12:59', '13:00', '17:30', '19:00', '20:45'][rnd(7)]});
  }
  const rules = {...G.REGOLE_PREDEFINITE, perfectDay: 1 + rnd(4), missed: -rnd(3), streak3: rnd(10)};
  const times = {...G.ORARI_PREDEFINITI};
  const cards = {};
  for (const k of KIDS){
    cards[k] = [];
    for (let i = 0; i < rnd(3); i++){
      const f = G.addDays(OGGI, -rnd(50));
      cards[k].push({id: 'c' + i, type: rnd(3) ? 'red' : 'yellow', effect: rnd(2) ? 'nostars' : 'extra', from: f, until: G.addDays(f, rnd(4)), date: G.addDays(f, -1)});
    }
  }
  return {tasks, sched, rules, times, cards};
}

test('chiusura dei giorni: server e app scrivono le stesse cose (2.000 famiglie a caso)', async () => {
  const prova = appRecinto();
  const ieri = G.addDays(OGGI, -1);
  let giorni = 0;
  const tipi = {perfect: 0, streak: 0, missed: 0}, medaglie = {comeback: 0, punDone: 0, mornBest: 0, perfMonthBest: 0};
  for (let n = 0; n < 2000; n++){
    const f = famigliaACaso(), kid = KIDS[rnd(2)];
    const db = {};
    // stato del figlio: a volte mai chiuso, a volte già chiuso fino a ieri, a volte indietro di molti giorni (oltre i 60)
    const r = rnd(10);
    const stato = r === 0 ? undefined : {
      lastClosed: r === 1 ? ieri : G.addDays(OGGI, -(2 + rnd(r <= 4 ? 90 : 10))), streak: rnd(20),
      bestStreak: rnd(25), mornStreak: rnd(5), mornBest: rnd(8), perfMonth: rnd(2) ? '2026-11' : '2026-10', perfMonthN: rnd(5),
      perfMonthBest: rnd(10), comeback: !rnd(4), punOk: [null, true, false][rnd(3)], punDone: !rnd(5), medalInit: rnd(3) ? 1 : undefined,
      noStarsFrom: '', noStarsUntil: ''};
    if (stato) db[`kids/${kid}`] = stato;
    const da = primoGiorno(stato, ieri) || G.addDays(ieri, -59);
    const swaps = [], comps = new Map();
    for (let i = 0; i < 6; i++){
      const s = {scheduleId: 's' + rnd(8), date: G.addDays(OGGI, -1 - rnd(15)), status: ['pending', 'accepted', 'rejected'][rnd(3)], fromOwner: KIDS[rnd(2)], toOwner: KIDS[rnd(2)]};
      db[`swaps/${s.scheduleId}_${s.date}`] = s;
      if (s.date >= da && s.date <= ieri) swaps.push(s);
    }
    if (rnd(3)){
      // figlio diligente: fa quasi tutti i compiti del giorno (servono serie lunghe, mesi perfetti, recuperi completati)
      const tutti = Object.entries(db).filter(([p]) => p.startsWith('swaps/')).map(([, v]) => v);
      const fg = {tasks: f.tasks, sched: f.sched, cards: f.cards[kid], times: f.times};
      for (let ds = G.addDays(OGGI, -90); ds <= ieri; ds = G.addDays(ds, 1))
        for (const it of G.itemsFor(fg, kid, ds, tutti)) if (rnd(25)) db[`completions/${it.key}_${ds}`] = {date: ds, doneBy: kid, contested: !rnd(40) || undefined};
    } else {
      for (let i = 0; i < 40; i++){
        const date = G.addDays(OGGI, -1 - rnd(15)), sid = rnd(5) ? 's' + rnd(8) : `extra-t${rnd(6)}-${kid}`;
        db[`completions/${sid}_${date}`] = {date, doneBy: kid, contested: !rnd(8) || undefined};
      }
    }
    for (const [p, c] of Object.entries(db)) if (p.startsWith('completions/') && c.date >= da && c.date <= ieri) comps.set(p.slice(12), c);

    const server = calcolaChiusura({fam: {tasks: f.tasks, sched: f.sched, times: f.times, rules: f.rules}, kid,
      stato: stato && {...stato}, cards: f.cards[kid], swaps, comps, ieri});
    const dopo = await prova({fam: {rules: f.rules, times: f.times}, data: {tasks: f.tasks, sched: f.sched, cards: f.cards}, oggi: OGGI, kid, db: structuredClone(db)});

    // voci scritte dall'app nello storico
    const app = Object.fromEntries(Object.entries(dopo).filter(([p]) => p.startsWith(`kids/${kid}/ledger/`))
      .map(([p, v]) => { const {createdAt, ...r} = v; return [p.split('/').pop(), r]; }));
    const srv = server.tipo === 'chiudi' ? Object.fromEntries(server.scritture) : {};
    assert.deepEqual(srv, app, `voci diverse (famiglia ${n})`);
    // stato del figlio dopo la chiusura (serie, giorno chiuso, progressi delle medaglie)
    const appStato = {...dopo[`kids/${kid}`]};
    if (server.tipo === 'chiudi' || server.tipo === 'nuovo'){
      for (const [k, v] of Object.entries(server.aggiorna)) assert.deepEqual(appStato[k], v, `campo ${k} diverso (famiglia ${n})`);
    } else assert.deepEqual(appStato, {...stato, ...appStato}, `stato toccato senza motivo (famiglia ${n})`);
    if (server.tipo === 'chiudi'){
      giorni += server.giorni.length;
      server.scritture.forEach(([, v]) => tipi[v.type]++);
      if (server.aggiorna.comeback && !stato.comeback) medaglie.comeback++;
      if (server.aggiorna.punDone && !stato.punDone) medaglie.punDone++;
      if (server.aggiorna.mornBest > (stato.mornBest || 0)) medaglie.mornBest++;
      if (server.aggiorna.perfMonthBest > (stato.perfMonthBest || 0)) medaglie.perfMonthBest++;
    }
  }
  // i casi generati devono coprire tutte le strade del calcolo
  const casi = JSON.stringify({giorni, tipi, medaglie});
  assert.ok(giorni > 3000, `troppo pochi giorni: ${casi}`);
  for (const [k, n] of Object.entries({...tipi, ...medaglie})) assert.ok(n >= 10, `troppo pochi casi di ${k}: ${casi}`);
  console.log('# casi coperti:', casi);
});
