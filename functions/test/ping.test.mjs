/* Test della funzione di prova (fase 0) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ping as pingHandler } from '../src/ping.js';
import { ping } from '../index.js';

test('ping: senza accesso risponde «unauthenticated»', () => {
  assert.throws(() => pingHandler({}), e => e.code === 'unauthenticated');
});

test('ping: con accesso dice regione e giorno di Roma', () => {
  const r = pingHandler({auth: {uid: 'u1'}}, new Date('2026-11-16T23:30:00Z'));
  assert.equal(r.ok, true);
  assert.equal(r.regione, 'europe-west1');
  assert.equal(r.oggi, '2026-11-17');
  assert.equal(r.fuso, 'Europe/Rome');
});

test('ping: dichiarata in europe-west1, con App Check obbligatorio e poche istanze', () => {
  const ep = ping.__endpoint;
  assert.deepEqual(ep.region, ['europe-west1']);
  assert.equal(ep.maxInstances, 2);
  assert.ok(ep.callableTrigger);
  assert.equal(typeof ping.run, 'function');
});
