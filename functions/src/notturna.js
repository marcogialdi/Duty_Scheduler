/* Lavoro di mezzanotte (fase 1 della migrazione): per ogni famiglia chiude il giorno appena finito.

   Due modi, scelti dall'interruttore della famiglia (families/{fid}.server.chiusura):
   - spento (predefinito) → IN OMBRA: il server calcola la chiusura e la scrive in kids/{kid}/shadow/{giorno},
     che l'app ignora; i giorni già chiusi dai telefoni vengono confrontati con quello che hanno scritto;
   - acceso → DAVVERO: il server scrive le stesse voci dell'app (perfect_, streak_, miss_) e lo stato del figlio,
     in una transazione che controlla lastClosed come fa l'app, così chi arriva secondo si ferma.

   Alla fine scrive il rapporto in admin/reports/days/{giorno}: famiglie controllate, differenze, errori,
   versioni dell'app in uso. Lo legge ogni mattina .github/workflows/rapporto.yml. */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { oggi, addDays, regoleDi, orariDi, FUSO_PREDEFINITO } from '../shared/gioco.js';
import { calcolaChiusura, primoGiorno, noStarsNow, medalProgress } from './chiusura.js';

export const PERCORSO_RAPPORTI = 'admin/reports/days';
const MAX_DETTAGLI = 200;
const VOCI_CHIUSURA = ['perfect', 'streak', 'missed'];
const CAMPI_STATO = ['streak', 'bestStreak', 'mornStreak', 'mornBest', 'perfMonth', 'perfMonthN', 'perfMonthBest', 'comeback', 'punOk', 'punDone'];

export async function notte(db, adesso = new Date()){
  const inizio = Date.now();
  const giorno = oggi(FUSO_PREDEFINITO, adesso), ieri = addDays(giorno, -1);
  const r = {
    giorno, ieri, avviatoIl: Timestamp.fromDate(adesso),
    famiglie: 0, figli: 0,
    ombra: {figli: 0, giorni: 0},
    chiusure: {famiglie: 0, figli: 0, giorni: 0, voci: 0, giaChiusi: 0},
    confronto: {giorni: 0, uguali: 0, spiegate: 0, differenze: 0, inAttesa: 0},
    dettagli: [], errori: [], versioni: {},
  };
  const fams = await db.collection('families').get();
  for (const f of fams.docs){
    try { await famiglia(db, f, ieri, r, adesso); }
    catch(e){ r.errori.push({famiglia: f.id, messaggio: String(e?.message || e).slice(0, 300)}); }
  }
  try { r.versioni = await versioniApp(db); }
  catch(e){ r.errori.push({famiglia: '-', messaggio: 'versioni dell\'app: ' + String(e?.message || e).slice(0, 200)}); }
  r.dettagliTroncati = r.dettagli.length > MAX_DETTAGLI;
  r.dettagli = r.dettagli.slice(0, MAX_DETTAGLI);
  r.durataMs = Date.now() - inizio;
  r.scrittoIl = FieldValue.serverTimestamp();
  await db.collection(PERCORSO_RAPPORTI).doc(giorno).set(r);
  return r;
}

async function famiglia(db, fSnap, ieri, r, adesso){
  const f = fSnap.data() || {}, fref = fSnap.ref;
  const kids = (f.kids || []).map(k => k?.id).filter(Boolean);
  if (!kids.length) return;
  r.famiglie++;
  const davvero = f.server?.chiusura === true;
  const [tasksS, schedS] = await Promise.all([fref.collection('tasks').get(), fref.collection('schedule').get()]);
  const fam = {
    tasks: Object.fromEntries(tasksS.docs.map(d => [d.id, {id: d.id, ...d.data()}])),
    sched: schedS.docs.map(d => ({id: d.id, ...d.data()})),
    times: orariDi(f), rules: regoleDi(f),
  };
  const figli = await Promise.all(kids.map(async kid => {
    const kref = fref.collection('kids').doc(kid);
    const [ks, cs, os] = await Promise.all([kref.get(), kref.collection('cards').get(),
      davvero ? null : kref.collection('shadow').doc('stato').get()]);
    return {kid, kref, stato: ks.exists ? ks.data() : null, cards: cs.docs.map(d => ({id: d.id, ...d.data()})),
            ombra: os?.exists ? os.data() : null};
  }));
  r.figli += figli.length;

  // in ombra: prima si confrontano i giorni che i telefoni hanno chiuso nel frattempo
  if (!davvero) for (const x of figli) await confronta(fref, x, r);

  // da quale stato si parte: quello del telefono (davvero) o quello dell'ombra
  for (const x of figli) x.base = davvero ? x.stato : baseOmbra(x.stato, x.ombra, ieri);
  const inizi = figli.map(x => x.base && primoGiorno(x.base, ieri)).filter(Boolean).sort();
  let swaps = [], comps = new Map();
  if (inizi.length){
    const [sw, cp] = await Promise.all([
      fref.collection('swaps').where('date', '>=', inizi[0]).where('date', '<=', ieri).get(),
      fref.collection('completions').where('date', '>=', inizi[0]).where('date', '<=', ieri).get(),
    ]);
    swaps = sw.docs.map(d => d.data());
    comps = new Map(cp.docs.map(d => [d.id, d.data()]));
  }
  if (davvero) r.chiusure.famiglie++;
  for (const x of figli){
    if (davvero){ await chiudiDavvero(db, x, calcolaChiusura({fam, kid: x.kid, stato: x.base, cards: x.cards, swaps, comps, ieri}), r); continue; }
    if (!x.base) continue;
    const calc = calcolaChiusura({fam, kid: x.kid, stato: x.base, cards: x.cards, swaps, comps, ieri});
    await scriviOmbra(db, x, calc, r, adesso);
  }
}

/* da dove riparte l'ombra:
   - dallo stato del telefono, se il telefono è arrivato almeno dove era arrivata l'ombra (così le contestazioni,
     che azzerano la serie sul telefono, non fanno divergere l'ombra per sempre);
   - altrimenti dal proprio stato (il telefono è indietro, o ha già chiuso anche ieri);
   - da nessuno, se il figlio non è mai stato chiuso (al primo avvio ci pensa l'app) o se non c'è niente da fare. */
export function baseOmbra(stato, ombra, ieri){
  if (!stato?.lastClosed) return null;
  if (stato.lastClosed < ieri && (!ombra?.lastClosed || stato.lastClosed >= ombra.lastClosed)) return {...stato, fonte: 'telefono'};
  if (ombra?.lastClosed && ombra.lastClosed < ieri) return {...ombra, fonte: 'ombra'};
  return null;
}

async function scriviOmbra(db, x, calc, r, adesso){
  if (calc.tipo !== 'chiudi') return;
  r.ombra.figli++;
  r.ombra.giorni += calc.giorni.length;
  const batch = db.batch(), sref = x.kref.collection('shadow'), quando = Timestamp.fromDate(adesso);
  const statoDopo = {streak: calc.aggiorna.streak, ...calc.medaglie};
  calc.giorni.forEach((g, i) => batch.set(sref.doc(g.giorno), {
    ...g, calcolatoIl: quando, fonte: x.base.fonte, confrontato: false,
    // lo stato dopo la chiusura si confronta solo per l'ultimo giorno calcolato (il telefono conserva solo quello)
    ...(i === calc.giorni.length - 1 && calc.aggiorna.lastClosed === g.giorno ? {stato: statoDopo} : {}),
  }));
  batch.set(sref.doc('stato'), {lastClosed: calc.aggiorna.lastClosed, ...statoDopo, medalInit: calc.medalInit ? 1 : 0,
    fonte: x.base.fonte, aggiornatoIl: quando});
  await batch.commit();
}

const norma = (s, k) => k === 'streak' ? (s.streak || 0) : medalProgress(s)[k];

/* confronto dei giorni in ombra che il telefono ha già chiuso.
   Differenze «spiegate»: compiti contestati o segnati (offline) dopo il calcolo dell'ombra, cartellini dati dopo. */
async function confronta(fref, x, r){
  const q = await x.kref.collection('shadow').where('confrontato', '==', false).get();
  const giorni = q.docs.sort((a, b) => a.id.localeCompare(b.id));
  for (const d of giorni){
    const o = d.data(), D = o.giorno;
    if (!x.stato?.lastClosed || D > x.stato.lastClosed){ r.confronto.inAttesa++; continue; }
    const [led, cp] = await Promise.all([
      x.kref.collection('ledger').where('date', '==', D).get(),
      fref.collection('completions').where('date', '==', D).get(),
    ]);
    const t0 = o.calcolatoIl?.toMillis?.() ?? 0;
    const dopo = ts => !!ts?.toMillis && ts.toMillis() > t0;
    const tel = {};
    led.docs.forEach(l => { const v = l.data(); if (VOCI_CHIUSURA.includes(v.type)) tel[l.id] = {amount: v.amount, type: v.type}; });
    const srv = o.voci || {};
    const suoi = cp.docs.map(c => c.data()).filter(c => c.doneBy === x.kid || (c.team || []).includes(x.kid));
    const cambiatoDopo = suoi.some(c => dopo(c.doneAt) || dopo(c.contestedAt) || dopo(c.completeAt));
    const cartellinoDopo = x.cards.some(c => dopo(c.createdAt));
    const diff = [];
    for (const id of new Set([...Object.keys(srv), ...Object.keys(tel)])){
      const a = srv[id]?.amount ?? null, b = tel[id]?.amount ?? null;
      if (a !== b) diff.push({voce: id, server: a, telefono: b, spiegazione: cambiatoDopo ? 'compiti cambiati dopo il calcolo' : null});
    }
    if (o.stato && x.stato.lastClosed === D){
      for (const k of CAMPI_STATO){
        const a = o.stato[k] ?? null, b = norma(x.stato, k) ?? null;
        if (a !== b) diff.push({voce: `stato.${k}`, server: a, telefono: b,
          spiegazione: cartellinoDopo ? 'cartellino dato dopo il calcolo' : cambiatoDopo ? 'compiti cambiati dopo il calcolo' : null});
      }
    }
    r.confronto.giorni++;
    let esito = 'uguale';
    if (diff.length){
      esito = diff.every(z => z.spiegazione) ? 'spiegata' : 'diversa';
      diff.forEach(z => r.dettagli.push({famiglia: fref.id, figlio: x.kid, giorno: D, ...z}));
    }
    r.confronto[{uguale: 'uguali', spiegata: 'spiegate', diversa: 'differenze'}[esito]]++;
    // i giorni uguali non servono più; gli altri restano per guardarli da vicino
    if (esito === 'uguale') await d.ref.delete();
    else await d.ref.update({confrontato: true, esito, diff, confrontatoIl: FieldValue.serverTimestamp()});
  }
}

async function chiudiDavvero(db, x, calc, r){
  const ns = noStarsNow(x.cards);
  const nsDiverso = ns.noStarsFrom !== (x.stato?.noStarsFrom || '') || ns.noStarsUntil !== (x.stato?.noStarsUntil || '');
  const firma = {closedBy: 'server', closedAt: FieldValue.serverTimestamp()};
  if (calc.tipo === 'nuovo'){ await x.kref.set({...calc.aggiorna, ...ns, ...firma}, {merge: true}); r.chiusure.figli++; return; }
  if (calc.tipo === 'niente'){
    r.chiusure.giaChiusi++;
    if (nsDiverso) await x.kref.set(ns, {merge: true});
    return;
  }
  const fatto = await db.runTransaction(async tx => {
    const cur = await tx.get(x.kref);
    if ((cur.data()?.lastClosed || '') !== calc.lastClosed) return false;     // un telefono è arrivato prima
    const ts = FieldValue.serverTimestamp();
    for (const [id, v] of calc.scritture) tx.set(x.kref.collection('ledger').doc(id), {...v, createdAt: ts});
    tx.set(x.kref, {...calc.aggiorna, ...ns, ...firma}, {merge: true});
    return true;
  });
  if (!fatto){ r.chiusure.giaChiusi++; return; }
  r.chiusure.figli++;
  r.chiusure.giorni += calc.giorni.length;
  r.chiusure.voci += calc.scritture.length;
}

// quante persone usano ogni versione dell'app (dall'ultimo accesso): serve a decidere quando chiudere le regole
async function versioniApp(db){
  const s = await db.collection('members').select('appVersion', 'role').get();
  const v = {};
  s.docs.forEach(d => {
    const {appVersion, role} = d.data();
    const k = (appVersion || 'prima della 0.17.0').replace(/\./g, '_');      // i punti non vanno nei nomi dei campi
    v[k] ??= {genitori: 0, figli: 0};
    v[k][role === 'kid' ? 'figli' : 'genitori']++;
  });
  return v;
}
