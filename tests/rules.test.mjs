/* Compiti di casa · test delle regole Firestore (../firestore.rules) con l'emulatore.
   Si lanciano con `npm test` da questa cartella (vedi README.md).
   Ogni prova dice cosa deve succedere: "consentito" o "negato". I casi negati sono gli attacchi
   corretti nelle versioni 0.12.x: se uno torna "consentito", una regola si è allentata. */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-compiti',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 },
});

// date nel formato dell'app (aaaa-mm-gg), in UTC come il server
const iso = ms => new Date(ms).toISOString().slice(0, 10);
const OGGI = iso(Date.now()), IERI = iso(Date.now() - 864e5);
const F = 'fam1';

/* ---------- dati di partenza (scritti senza regole) ----------
   genitore "par" (fondatore), figli kA, kB; compiti, assegnazioni, scambi, invito */
await env.withSecurityRulesDisabled(async c => {
  const db = c.firestore();
  const put = (path, data) => setDoc(doc(db, ...path), data);
  await put(['members', 'par'], {familyId: F, role: 'parent'});
  await put(['members', 'ka'], {familyId: F, role: 'kid', kidId: 'kA'});
  await put(['members', 'kb'], {familyId: F, role: 'kid', kidId: 'kB'});
  await put(['families', F], {createdBy: 'par', rules: {swapFavor: 1}, kids: []});
  await put(['families', F, 'tasks', 't1'], {points: 2});
  await put(['families', F, 'tasks', 'tpun'], {points: 1, punishment: true});
  await put(['families', F, 'tasks', 'tb'], {points: 1, board: true, maxPerDay: 2});
  await put(['families', F, 'tasks', 'tc'], {points: 2, collab: true});
  await put(['families', F, 'tasks', 'tc2'], {points: 5, collab: true});
  await put(['families', F, 'schedule', 's1'], {taskId: 't1', owner: 'kA'});
  await put(['families', F, 'schedule', 's2'], {taskId: 't1', owner: 'kB'});
  await put(['families', F, 'schedule', 's3'], {taskId: 't1', owner: 'kB'});
  await put(['families', F, 'schedule', 's4'], {taskId: 't1', owner: 'kA'});
  await put(['families', F, 'schedule', 's5'], {taskId: 't1', owner: 'kA'});
  await put(['families', F, 'schedule', 'st'], {taskId: 'tc', owner: 'team', team: ['kA', 'kB']});
  await put(['families', F, 'schedule', 'st2'], {taskId: 'tc', owner: 'team', team: ['kA', 'kB']});
  await put(['families', F, 'swaps', 's3_' + OGGI], {scheduleId: 's3', date: OGGI, fromOwner: 'kB', toOwner: 'kA', status: 'accepted'});
  await put(['families', F, 'swaps', 's4_' + OGGI], {scheduleId: 's4', date: OGGI, fromOwner: 'kA', toOwner: 'kB', status: 'accepted'});
  await put(['families', F, 'rewards', 'r1'], {title: 'Gelato', cost: 20});
  await put(['invites', 'INVITO01'], {familyId: F, expiresAt: Timestamp.fromMillis(Date.now() + 864e5)});
});

const as = uid => env.authenticatedContext(uid).firestore();
const kid = as('ka'), par = as('par');
let ok = 0, ko = 0;
async function prova(nome, consentito, operazione){
  try { await (consentito ? assertSucceeds(operazione) : assertFails(operazione)); ok++; console.log('ok    ', nome); }
  catch(e){ ko++; console.log('ERRORE', nome, '→ atteso', consentito ? 'consentito' : 'negato'); }
}
// il figlio kA segna un compito: completamento + stelle nello stesso salvataggio, come fa l'app
function segna(scheduleId, taskId, date, points, extra = {}){
  const cid = `${scheduleId}_${date}`, b = writeBatch(kid);
  b.set(doc(kid, 'families', F, 'completions', cid), {scheduleId, taskId, date, doneBy: 'kA', points, doneAt: serverTimestamp(), ...extra});
  b.set(doc(kid, 'families', F, 'kids', 'kA', 'ledger', 'done_' + cid), {kid: 'kA', amount: points, type: 'task', completionId: cid, date, reason: 'test'});
  return b.commit();
}

console.log('\n— Compiti segnati dai figli (0.12.1)');
await prova('segna un proprio compito', true, segna('s1', 't1', OGGI, 2));
await prova('compito inventato, con stelle', false, segna('inventato', 't1', OGGI, 2));
await prova('compito di un fratello', false, segna('s2', 't1', OGGI, 2));
await prova('compito ricevuto con uno scambio accettato', true, segna('s3', 't1', OGGI, 3));
await prova('compito proprio ceduto con uno scambio', false, segna('s4', 't1', OGGI, 2));
await prova('compito diverso da quello assegnato', false, segna('s2', 'tpun', OGGI, 1));
await prova('data vecchia', false, segna('s1', 't1', '2020-01-01', 2));
await prova('data non valida', false, segna('s1', 't1', '<img src=x>', 2));
await prova('compito di recupero a 0 stelle', true, segna('extra-tpun-kA', 'tpun', OGGI, 0));
await prova('compito di recupero con stelle', false, segna('extra-tpun-kA', 'tpun', IERI, 1));
await prova('lavoretto extra della bacheca', true, segna('x-tb-1', 'tb', OGGI, 1, {slot: 1, board: true}));

console.log('\n— Compiti di squadra');
await prova('segna un compito di squadra', true, setDoc(doc(kid, 'families', F, 'completions', 'st_' + OGGI),
  {scheduleId: 'st', taskId: 'tc', date: OGGI, doneBy: 'kA', points: 2, collab: true, team: ['kA', 'kB'], confirmed: ['kA']}));
await prova('squadra con un compito più ricco (0.12.5)', false, setDoc(doc(kid, 'families', F, 'completions', 'st_' + IERI),
  {scheduleId: 'st', taskId: 'tc2', date: IERI, doneBy: 'kA', points: 6, collab: true, team: ['kA', 'kB'], confirmed: ['kA']}));

console.log('\n— Proposte e premi');
const prop = id => doc(kid, 'families', F, 'kids', 'kA', 'proposals', id);
await prova('proposta normale', true, setDoc(prop('p1'), {kid: 'kA', title: 'Ho apparecchiato', date: OGGI, status: 'pending'}));
await prova('proposta con codice nella data', false, setDoc(prop('p2'), {kid: 'kA', title: 'Ho apparecchiato', date: '<img src=x onerror=alert(1)>', status: 'pending'}));
await prova('proposta con codice nell\'id', false, setDoc(prop('a" onclick="x'), {kid: 'kA', title: 'Ho apparecchiato', date: OGGI, status: 'pending'}));
await prova('annulla cambiando anche il titolo (0.13.0)', false, updateDoc(prop('p1'), {status: 'cancelled', title: 'Altro'}));
await prova('annulla una proposta', true, updateDoc(prop('p1'), {status: 'cancelled'}));
const red = doc(kid, 'families', F, 'kids', 'kA', 'redemptions', 'q1');
await prova('chiede un premio al suo prezzo', true, setDoc(red, {kid: 'kA', rewardId: 'r1', title: 'Gelato', cost: 20, status: 'pending'}));
await prova('annulla cambiando anche il premio (0.13.0)', false, updateDoc(red, {status: 'cancelled', rewardId: 'altro'}));
await prova('annulla la richiesta di premio', true, updateDoc(red, {status: 'cancelled'}));

console.log('\n— Scambi');
await prova('chiede lo scambio di un proprio compito', true, setDoc(doc(kid, 'families', F, 'swaps', 's1_' + OGGI),
  {scheduleId: 's1', date: OGGI, fromOwner: 'kA', toOwner: 'kB', status: 'pending'}));
await prova('chiede lo scambio del compito di un fratello (0.12.5)', false, setDoc(doc(kid, 'families', F, 'swaps', 's2_' + OGGI),
  {scheduleId: 's2', date: OGGI, fromOwner: 'kA', toOwner: 'kC', status: 'pending'}));

console.log('\n— Account e inviti');
await prova('un figlio cancella il proprio account in famiglia', false, deleteDoc(doc(kid, 'members', 'ka')));
await prova('un genitore toglie un figlio', true, deleteDoc(doc(par, 'members', 'kb')));
function entra(uid, cancellaInvito = true){
  const db = as(uid), b = writeBatch(db);
  b.set(doc(db, 'members', uid), {familyId: F, role: 'parent', invite: 'INVITO01', name: 'N'});
  if (cancellaInvito) b.delete(doc(db, 'invites', 'INVITO01'));
  return b.commit();
}
await prova('entra con l\'invito senza consumarlo', false, entra('u0', false));
await prova('entra con l\'invito', true, entra('u1'));
await prova('secondo ingresso con lo stesso invito', false, entra('u2'));

console.log('\n— Cartellino rosso "niente stelle" (0.12.2)');
await env.withSecurityRulesDisabled(async c => {
  const db = c.firestore();
  await setDoc(doc(db, 'families', F, 'kids', 'kA'), {noStarsFrom: OGGI, noStarsUntil: OGGI, lastClosed: IERI});
  await setDoc(doc(db, 'families', F, 'completions', 'st2_' + OGGI),
    {scheduleId: 'st2', taskId: 'tc', date: OGGI, doneBy: 'kB', points: 2, collab: true, team: ['kA', 'kB'], confirmed: ['kA', 'kB']});
});
await prova('compito con stelle durante il rosso', false, segna('s5', 't1', OGGI, 2));
await prova('compito a 0 stelle durante il rosso', true, segna('s5', 't1', OGGI, 0));
await prova('lavoretto extra con stelle durante il rosso', false, segna('x-tb-2', 'tb', OGGI, 1, {slot: 2, board: true}));
const squadra = (k, amount) => setDoc(doc(kid, 'families', F, 'kids', k, 'ledger', 'collab_st2_' + OGGI),
  {kid: k, amount, type: 'collab', completionId: 'st2_' + OGGI, date: OGGI});
await prova('stelle di squadra a sé durante il rosso', false, squadra('kA', 2));
await prova('0 stelle di squadra a sé durante il rosso', true, squadra('kA', 0));
await prova('0 stelle a un compagno senza rosso (0.12.5)', false, squadra('kB', 0));
await prova('stelle giuste a un compagno senza rosso', true, squadra('kB', 2));

console.log('\n— Giorni chiusi e fondatore della famiglia (0.12.5)');
await env.withSecurityRulesDisabled(async c => {
  const db = c.firestore();
  await setDoc(doc(db, 'families', F, 'completions', 's1_' + IERI), {scheduleId: 's1', taskId: 't1', date: IERI, doneBy: 'kA', points: 2});
  await deleteDoc(doc(db, 'members', 'par'));
});
await prova('toglie la spunta di un giorno già chiuso', false, deleteDoc(doc(kid, 'families', F, 'completions', 's1_' + IERI)));
{ const b = writeBatch(kid);
  b.delete(doc(kid, 'families', F, 'completions', 's1_' + OGGI));
  b.delete(doc(kid, 'families', F, 'kids', 'kA', 'ledger', 'done_s1_' + OGGI));
  await prova('toglie la spunta di oggi', true, b.commit()); }
await prova('il fondatore rimosso si riaggiunge', false, setDoc(doc(as('par'), 'members', 'par'), {familyId: F, role: 'parent'}));
{ const db = as('nuovo'), b = writeBatch(db);
  b.set(doc(db, 'families', 'fam2'), {createdBy: 'nuovo', kids: []});
  b.set(doc(db, 'members', 'nuovo'), {familyId: 'fam2', role: 'parent'});
  await prova('un nuovo genitore crea la sua famiglia', true, b.commit()); }

console.log(`\n${ok} ok, ${ko} errori`);
await env.cleanup();
process.exit(ko ? 1 : 0);
