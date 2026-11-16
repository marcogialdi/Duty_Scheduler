/* Test del modulo condiviso (shared/gioco.js, copia di js/shared/gioco.js): calendario del giorno, serie, stelle, date. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../shared/gioco.js';

test('date: giorni, settimane e trimestri non dipendono dal fuso del computer', () => {
  assert.equal(G.addDays('2026-03-28', 1), '2026-03-29');
  assert.equal(G.addDays('2026-03-29', 1), '2026-03-30');      // cambio dell'ora legale
  assert.equal(G.addDays('2026-10-25', 1), '2026-10-26');      // ritorno all'ora solare
  assert.equal(G.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(G.addDays('2028-03-01', -1), '2028-02-29');     // bisestile
  assert.equal(G.isoWeekday('2026-11-16'), 1);                  // lunedì
  assert.equal(G.isoWeekday('2026-11-22'), 7);                  // domenica
  assert.equal(G.quarterKey('2026-11-16'), '2026Q4');
  assert.equal(G.quarterKey('2026-01-01'), '2026Q1');
});

test('oggi: la data è quella italiana, non quella UTC del server', () => {
  // 23:30 UTC del 16/11 = 00:30 del 17/11 a Roma (ora solare)
  assert.equal(G.oggi('Europe/Rome', new Date('2026-11-16T23:30:00Z')), '2026-11-17');
  assert.equal(G.oggi('UTC', new Date('2026-11-16T23:30:00Z')), '2026-11-16');
  // 22:30 UTC del 30/06 = 00:30 del 01/07 a Roma (ora legale)
  assert.equal(G.oggi('Europe/Rome', new Date('2026-06-30T22:30:00Z')), '2026-07-01');
  assert.equal(G.oggi(undefined, new Date('2026-06-30T21:30:00Z')), '2026-06-30');
});

test('serie: bonus a 3, 7, 14 giorni e poi ogni 7', () => {
  const r = G.REGOLE_PREDEFINITE;
  const bonus = [1, 2, 3, 7, 14, 15, 21, 28, 29].map(n => G.streakBonusFor(n, r));
  assert.deepEqual(bonus, [0, 0, 5, 15, 40, 0, 15, 15, 0]);
});

test('regole e orari della famiglia: predefiniti completati da quelli salvati', () => {
  assert.equal(G.regoleDi({rules: {perfectDay: 10}}).perfectDay, 10);
  assert.equal(G.regoleDi({rules: {perfectDay: 10}}).missed, -1);
  assert.equal(G.regoleDi(null).streak3, 5);
  assert.equal(G.orariDi({times: {evening: '18:00'}}).evening, '18:00');
  assert.equal(G.orariDi({}).wake, '06:50');
});

/* famiglia di prova: lunedì 16/11/2026 */
const LUN = '2026-11-16', MAR = '2026-11-17';
const tasks = {
  t1: {id: 't1', title: 'Letto', points: 2},
  t2: {id: 't2', title: 'Lettura', points: 3, optional: true},
  tc: {id: 'tc', title: 'Tavola', points: 4},
  tb: {id: 'tb', title: 'Pattumiera', points: 1, board: true},
  tp: {id: 'tp', title: 'Recupero', points: 5, punishment: true, defaultTime: '17:00'},
  tq: {id: 'tq', title: 'Recupero sera', punishment: true},
};
const base = {active: true, weekdays: [1, 2, 3, 4, 5], startDate: '2026-11-01'};
const sched = [
  {...base, id: 's1', taskId: 't1', owner: 'kA', startTime: '07:00'},
  {...base, id: 's2', taskId: 't2', owner: 'kA', startTime: '16:00'},
  {...base, id: 's3', taskId: 't1', owner: 'kB', startTime: '07:15'},
  {...base, id: 'st', taskId: 'tc', owner: 'team', team: ['kA', 'kB'], startTime: '19:30'},
  {...base, id: 'sb', taskId: 'tb', owner: 'kA', startTime: '10:00'},                     // lavoretto extra: mai nel calendario
  {...base, id: 'sx', taskId: 't1', owner: 'kA', startTime: '08:00', active: false},       // sospesa
  {...base, id: 'se', taskId: 't1', owner: 'kA', startTime: '09:00', endDate: '2026-11-15'}, // finita ieri
  {...base, id: 'sf', taskId: 't1', owner: 'kA', startTime: '09:30', startDate: MAR},       // comincia domani
  {...base, id: 'sw', taskId: 't1', owner: 'kA', startTime: '06:00', weekdays: [6, 7]},     // solo nel fine settimana
];
const fam = (cards = []) => ({tasks, sched, cards, times: G.ORARI_PREDEFINITI});
const keys = list => list.map(i => i.key);

test('calendario: assegnazioni attive del giorno, in ordine di orario', () => {
  const it = G.itemsFor(fam(), 'kA', LUN, []);
  assert.deepEqual(keys(it), ['s1', 's2', 'st']);
  assert.equal(it[1].optional, true);
  assert.equal(it[2].collab, true);
  assert.equal(it[2].optional, true);                    // la squadra non conta per la giornata perfetta
  assert.deepEqual(keys(G.itemsFor(fam(), 'kB', LUN, [])), ['s3', 'st']);
  assert.deepEqual(keys(G.itemsFor(fam(), 'kA', '2026-11-21', [])), ['sw']);   // sabato
  assert.deepEqual(keys(G.itemsFor(fam(), 'kA', MAR, [])), ['s1', 'sf', 's2', 'st']);
});

test('calendario: scambi tra fratelli', () => {
  const accettato = [{scheduleId: 's3', date: LUN, status: 'accepted', toOwner: 'kA'}];
  const kA = G.itemsFor(fam(), 'kA', LUN, accettato);
  assert.deepEqual(keys(kA), ['s1', 's3', 's2', 'st']);
  assert.equal(kA[1].received, true);
  assert.deepEqual(keys(G.itemsFor(fam(), 'kB', LUN, accettato)), ['st']);
  // in attesa: resta a chi l'aveva; altro giorno o rifiutato: non conta
  const attesa = [{scheduleId: 's3', date: LUN, status: 'pending', toOwner: 'kA'}];
  assert.deepEqual(keys(G.itemsFor(fam(), 'kB', LUN, attesa)), ['s3', 'st']);
  assert.equal(G.itemsFor(fam(), 'kB', LUN, attesa)[0].sw.status, 'pending');
  assert.deepEqual(keys(G.itemsFor(fam(), 'kA', MAR, accettato)).includes('s3'), false);
  assert.deepEqual(keys(G.itemsFor(fam(), 'kB', LUN, [{...accettato[0], status: 'rejected'}])), ['s3', 'st']);
});

test('cartellino rosso: compiti di recupero e niente stelle', () => {
  const extra = [{type: 'red', effect: 'extra', from: LUN, until: MAR, date: LUN}];
  const it = G.itemsFor(fam(extra), 'kA', LUN, []);
  assert.deepEqual(keys(it), ['s1', 's2', 'extra-tp-kA', 'extra-tq-kA', 'st']);
  assert.equal(it[3].time, G.ORARI_PREDEFINITI.evening);  // senza orario: la sera (19:00)
  assert.equal(G.pointsFor(it[2], extra, G.REGOLE_PREDEFINITE, LUN), 0);
  assert.deepEqual(keys(G.itemsFor(fam(extra), 'kA', '2026-11-18', [])), ['s1', 'sf', 's2', 'st']);   // rosso finito

  const nostars = [{type: 'red', effect: 'nostars', from: LUN, until: LUN, date: LUN}];
  const s1 = G.itemsFor(fam(nostars), 'kA', LUN, [])[0];
  assert.equal(G.pointsFor(s1, nostars, G.REGOLE_PREDEFINITE, LUN), 0);
  assert.equal(G.pointsFor(s1, nostars, G.REGOLE_PREDEFINITE, MAR), 2);
  assert.equal(G.pointsFor(s1, [{type: 'yellow', from: LUN, until: LUN}], G.REGOLE_PREDEFINITE, LUN), 2);
});

test('stelle: valore del compito, più il favore per lo scambio accettato', () => {
  const r = {...G.REGOLE_PREDEFINITE, swapFavor: 2};
  const kA = G.itemsFor(fam(), 'kA', LUN, [{scheduleId: 's3', date: LUN, status: 'accepted', toOwner: 'kA'}]);
  assert.equal(G.pointsFor(kA[0], [], r, LUN), 2);
  assert.equal(G.pointsFor(kA[1], [], r, LUN), 4);
  assert.equal(G.pointsFor({task: {points: 0}}, [], r, LUN), 1);   // compito senza stelle: 1, come nell'app
});

test('nell\'app il modulo si trova in globalThis.BeBeansGioco', () => {
  assert.equal(globalThis.BeBeansGioco.itemsFor, G.itemsFor);
  assert.ok(Object.isFrozen(globalThis.BeBeansGioco));
});
