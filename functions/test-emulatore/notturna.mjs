/* BeBeans · prova del lavoro di mezzanotte (src/notturna.js) su Firestore dell'emulatore.
   Si lancia da tests/ con `npm run test:functions` (l'emulatore imposta FIRESTORE_EMULATOR_HOST).
   Racconta tre notti di una famiglia «in ombra» e di una famiglia con l'interruttore acceso. */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { notte, PERCORSO_RAPPORTI } from '../src/notturna.js';
import { calcolaChiusura } from '../src/chiusura.js';
import { REGOLE_PREDEFINITE, ORARI_PREDEFINITI } from '../shared/gioco.js';

if (!process.env.FIRESTORE_EMULATOR_HOST) { console.error('Serve l\'emulatore di Firestore (npm run test:functions in tests/)'); process.exit(1); }
initializeApp({projectId: 'demo-compiti'});
const db = getFirestore();

let ok = 0, errori = 0;
async function prova(nome, fn){
  try { await fn(); ok++; console.log('  ok     ', nome); }
  catch(e){ errori++; console.log('  ERRORE ', nome, '→', e.message); }
}
const uguale = (a, b, cosa) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${cosa}: atteso ${JSON.stringify(b)}, trovato ${JSON.stringify(a)}`); };
const vero = (x, cosa) => { if (!x) throw new Error(cosa); };

// mezzanotte e cinque a Roma (ora solare: UTC+1)
const notteDel = giorno => new Date(`${giorno}T00:05:00+01:00`);
const fam = id => db.collection('families').doc(id);
const kidRef = (f, k) => fam(f).collection('kids').doc(k);
const voci = async (f, k) => Object.fromEntries((await kidRef(f, k).collection('ledger').get()).docs.map(d => [d.id, d.data().amount]));
const rapporto = async giorno => (await db.collection(PERCORSO_RAPPORTI).doc(giorno).get()).data();

/* ---------- dati ----------
   famiglia OMBRA: interruttore spento, kA con un compito al giorno (2 ⭐), chiuso dal telefono fino al 14/11
   famiglia VERA:  interruttore acceso, kB come sopra chiuso fino al 15/11, kC mai chiuso */
const compito = {title: 'Letto', points: 2};
const ogniGiorno = owner => ({taskId: 't1', owner, active: true, weekdays: [1, 2, 3, 4, 5, 6, 7], startDate: '2026-11-01', startTime: '07:00'});
await fam('ombra').set({name: 'Ombra', kids: [{id: 'kA'}], rules: {...REGOLE_PREDEFINITE}, times: {...ORARI_PREDEFINITI}});
await fam('ombra').collection('tasks').doc('t1').set(compito);
await fam('ombra').collection('schedule').doc('s1').set(ogniGiorno('kA'));
await kidRef('ombra', 'kA').set({lastClosed: '2026-11-14', streak: 2, medalInit: 1});
await fam('vera').set({name: 'Vera', kids: [{id: 'kB'}, {id: 'kC'}], server: {chiusura: true}});
await fam('vera').collection('tasks').doc('t1').set(compito);
await fam('vera').collection('schedule').doc('s1').set(ogniGiorno('kB'));
await kidRef('vera', 'kB').set({lastClosed: '2026-11-15', streak: 6});
const fatto = (f, k, ds, extra = {}) => fam(f).collection('completions').doc(`s1_${ds}`)
  .set({scheduleId: 's1', taskId: 't1', date: ds, doneBy: k, points: 2, doneAt: Timestamp.fromDate(new Date(`${ds}T08:00:00+01:00`)), ...extra});
await fatto('ombra', 'kA', '2026-11-15');
await fatto('ombra', 'kA', '2026-11-16');
await fatto('vera', 'kB', '2026-11-16');

// il telefono che chiude i giorni: lo stesso calcolo dell'app (provato uguale in functions/test/equivalenza.test.mjs)
async function telefonoChiude(f, k, ieri, cambia = x => x){
  const ks = (await kidRef(f, k).get()).data();
  const comps = new Map((await fam(f).collection('completions').get()).docs.map(d => [d.id, d.data()]));
  const sched = (await fam(f).collection('schedule').get()).docs.map(d => ({id: d.id, ...d.data()}));
  const c = calcolaChiusura({fam: {tasks: {t1: {id: 't1', ...compito}}, sched, times: ORARI_PREDEFINITI, rules: REGOLE_PREDEFINITE},
    kid: k, stato: ks, cards: [], swaps: [], comps, ieri});
  const b = db.batch();
  for (const [id, v] of c.scritture) b.set(kidRef(f, k).collection('ledger').doc(id), cambia({...v}));
  b.set(kidRef(f, k), c.aggiorna, {merge: true});
  await b.commit();
}

console.log('Lavoro di mezzanotte nell\'emulatore');

/* ---------- notte del 17/11: si chiude il 16 ---------- */
const r1 = await notte(db, notteDel('2026-11-17'));
await prova('il rapporto del 17/11 è scritto, con giorno e famiglie', async () => {
  const r = await rapporto('2026-11-17');
  uguale([r.giorno, r.ieri, r.famiglie, r.figli, r.errori.length], ['2026-11-17', '2026-11-16', 2, 3, 0], 'rapporto');
});
await prova('ombra: calcolati il 15 e il 16 a partire dallo stato del telefono', async () => {
  const s = kidRef('ombra', 'kA').collection('shadow');
  const [d15, d16, st] = await Promise.all([s.doc('2026-11-15').get(), s.doc('2026-11-16').get(), s.doc('stato').get()]);
  uguale(d15.data().voci, {'perfect_kA_2026-11-15': {amount: 3, type: 'perfect'}, 'streak_kA_2026-11-15': {amount: 5, type: 'streak'}}, 'voci del 15');
  uguale([d16.data().serie, d16.data().fonte, d16.data().stato.streak], [4, 'telefono', 4], 'serie del 16');
  uguale([st.data().lastClosed, st.data().streak], ['2026-11-16', 4], 'stato dell\'ombra');
  uguale(r1.ombra, {figli: 1, giorni: 2}, 'conteggio dell\'ombra');
});
await prova('ombra: nessuna voce vera scritta, il telefono non è toccato', async () => {
  uguale(await voci('ombra', 'kA'), {}, 'storico');
  uguale((await kidRef('ombra', 'kA').get()).data().lastClosed, '2026-11-14', 'lastClosed del telefono');
});
await prova('interruttore acceso: il 16 chiuso davvero, con le stesse voci dell\'app', async () => {
  uguale(await voci('vera', 'kB'), {'perfect_kB_2026-11-16': 3, 'streak_kB_2026-11-16': 15}, 'storico di kB');
  const kB = (await kidRef('vera', 'kB').get()).data();
  uguale([kB.lastClosed, kB.streak, kB.closedBy, kB.bestStreak], ['2026-11-16', 7, 'server', 7], 'stato di kB');
  vero((await kidRef('vera', 'kB').collection('ledger').doc('streak_kB_2026-11-16').get()).data().createdAt, 'manca createdAt');
});
await prova('interruttore acceso: un figlio mai chiuso parte da ieri, come nell\'app', async () => {
  const kC = (await kidRef('vera', 'kC').get()).data();
  uguale([kC.lastClosed, kC.streak, kC.closedBy], ['2026-11-16', 0, 'server'], 'stato di kC');
});
await prova('stessa notte rilanciata (riprova automatica): niente doppioni', async () => {
  const r = await notte(db, notteDel('2026-11-17'));
  uguale(await voci('vera', 'kB'), {'perfect_kB_2026-11-16': 3, 'streak_kB_2026-11-16': 15}, 'storico di kB');
  uguale([r.chiusure.figli, r.chiusure.giaChiusi], [0, 2], 'chiusure alla seconda volta');
});

/* ---------- di giorno il telefono chiude il 15 e il 16 come l'app ---------- */
await telefonoChiude('ombra', 'kA', '2026-11-16');

/* ---------- notte del 18/11: confronto del 15 e del 16, ombra del 17 ---------- */
const r2 = await notte(db, notteDel('2026-11-18'));
await prova('confronto: il 15 e il 16 coincidono con il telefono', async () => {
  uguale(r2.confronto, {giorni: 2, uguali: 2, spiegate: 0, differenze: 0, inAttesa: 0}, 'confronto');
  uguale(r2.dettagli, [], 'dettagli');
});
await prova('confronto: i giorni uguali escono dall\'ombra', async () => {
  vero(!(await kidRef('ombra', 'kA').collection('shadow').doc('2026-11-15').get()).exists, 'il 15 è ancora in ombra');
});
await prova('ombra del 17: compito non fatto, serie azzerata', async () => {
  const d = (await kidRef('ombra', 'kA').collection('shadow').doc('2026-11-17').get()).data();
  uguale([d.voci, d.serie], [{'miss_s1_2026-11-17': {amount: -1, type: 'missed'}}, 0], 'il 17');
});
await prova('interruttore acceso: la seconda notte chiude il 17', async () => {
  const kB = (await kidRef('vera', 'kB').get()).data();
  uguale([kB.lastClosed, kB.streak], ['2026-11-17', 0], 'stato di kB');
  uguale((await voci('vera', 'kB'))['miss_s1_2026-11-17'], -1, 'penalità del 17');
});

/* ---------- il telefono chiude il 17 sbagliando l'importo; il 18 il compito è fatto ma contestato dopo mezzanotte ---------- */
await telefonoChiude('ombra', 'kA', '2026-11-17', v => ({...v, amount: -2}));
await fatto('ombra', 'kA', '2026-11-18');
const r3 = await notte(db, notteDel('2026-11-19'));
await prova('confronto: un importo diverso diventa una differenza da guardare', async () => {
  uguale([r3.confronto.differenze, r3.confronto.giorni], [1, 1], 'confronto');
  const d = r3.dettagli.find(x => x.voce === 'miss_s1_2026-11-17');
  uguale([d.famiglia, d.figlio, d.giorno, d.server, d.telefono, d.spiegazione], ['ombra', 'kA', '2026-11-17', -1, -2, null], 'dettaglio');
  const o = (await kidRef('ombra', 'kA').collection('shadow').doc('2026-11-17').get()).data();
  uguale([o.confrontato, o.esito], [true, 'diversa'], 'il 17 resta in ombra per guardarlo');
});
await prova('il 18 non ancora chiuso dal telefono: in attesa', async () => {
  uguale(r3.confronto.inAttesa, 0, 'in attesa (il 18 è appena stato calcolato)');
  const d = (await kidRef('ombra', 'kA').collection('shadow').doc('2026-11-18').get()).data();
  uguale(d.voci['perfect_kA_2026-11-18']?.amount, 3, 'giornata perfetta in ombra');
});
// il genitore contesta il compito del 18 dopo mezzanotte, poi apre l'app e chiude il 18
await fatto('ombra', 'kA', '2026-11-18', {contested: true, contestedAt: Timestamp.fromDate(new Date('2026-11-19T07:00:00+01:00'))});
await kidRef('ombra', 'kA').collection('cards').doc('yellow_s1_2026-11-18').set({type: 'yellow', date: '2026-11-19', createdAt: Timestamp.fromDate(new Date('2026-11-19T07:00:00+01:00'))});
await telefonoChiude('ombra', 'kA', '2026-11-18');
const r4 = await notte(db, notteDel('2026-11-20'));
await prova('contestazione dopo il calcolo: differenza spiegata, non un allarme', async () => {
  uguale([r4.confronto.spiegate, r4.confronto.differenze], [1, 0], 'confronto');
  vero(r4.dettagli.length && r4.dettagli.every(x => x.giorno === '2026-11-18' && x.spiegazione), 'dettagli spiegati');
});
await prova('versioni dell\'app nel rapporto', async () => {
  await db.collection('members').doc('u1').set({familyId: 'ombra', role: 'parent', appVersion: '0.17.0'});
  await db.collection('members').doc('u2').set({familyId: 'ombra', role: 'kid'});
  const r = await notte(db, notteDel('2026-11-21'));
  uguale(r.versioni, {'0_17_0': {genitori: 1, figli: 0}, 'prima della 0_17_0': {genitori: 0, figli: 1}}, 'versioni');
});

/* ---------- la lettura del mattino (scripts/rapporto.mjs, usata da .github/workflows/rapporto.yml) ---------- */
const { execFileSync } = await import('node:child_process');
const { readFileSync, mkdtempSync } = await import('node:fs');
const { tmpdir } = await import('node:os');
const cartella = mkdtempSync(tmpdir() + '/rapporto-');
const mattino = giorno => {
  const out = `${cartella}/out-${giorno}`, file = `${cartella}/${giorno}.md`;
  execFileSync('node', [new URL('../scripts/rapporto.mjs', import.meta.url).pathname, giorno],
    {env: {...process.env, GCLOUD_PROJECT: 'demo-compiti', RAPPORTO_FILE: file, GITHUB_OUTPUT: out}, stdio: 'pipe'});
  return {uscita: readFileSync(out, 'utf8'), testo: readFileSync(file, 'utf8')};
};
await prova('mattino: una differenza apre una segnalazione con la tabella', async () => {
  const m = mattino('2026-11-19');
  vero(m.uscita.includes('problema=true') && m.uscita.includes('titolo=Migrazione: notte del 19/11/2026, 1 differenza'), m.uscita);
  vero(m.testo.includes('| ombra | kA | 17/11/2026 | `miss_s1_2026-11-17` | -1 | -2 |'), 'tabella delle differenze');
});
await prova('mattino: solo differenze spiegate, nessuna segnalazione', async () => {
  const m = mattino('2026-11-20');
  vero(m.uscita.includes('problema=false') && m.testo.includes('Differenze spiegate'), m.uscita);
});
await prova('mattino: rapporto mancante, segnalazione', async () => {
  vero(mattino('2026-12-25').uscita.includes('problema=true\ntitolo=Migrazione: manca il rapporto della notte del 25/12/2026'), 'rapporto mancante');
});

console.log(`\n${ok} ok, ${errori} errori`);
process.exit(errori ? 1 : 0);
