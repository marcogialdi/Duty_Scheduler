/* BeBeans · Cloud Functions. Piano e decisioni in docs/migrazione.md.
   Ogni funzione vive in src/; qui si dichiarano soltanto, con le opzioni comuni.
   Le regole del gioco sono in shared/gioco.js, copia di js/shared/gioco.js dell'app (npm run condiviso). */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions, logger } from 'firebase-functions/v2';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { REGIONE, MAX_ISTANZE } from './src/opzioni.js';
import { FUSO_PREDEFINITO } from './shared/gioco.js';
import { ping as pingHandler } from './src/ping.js';
import { notte } from './src/notturna.js';

initializeApp();
setGlobalOptions({ region: REGIONE, maxInstances: MAX_ISTANZE });

// fase 0: prova del collegamento dall'app (solo utenti con accesso, solo dalla pagina pubblicata grazie ad App Check)
export const ping = onCall({ enforceAppCheck: true, maxInstances: 2 }, request => pingHandler(request));

// fase 1: alle 00:05 ora italiana chiude il giorno appena finito per ogni famiglia (in ombra o davvero) e scrive il rapporto
export const chiusuraNotturna = onSchedule({
  schedule: '5 0 * * *', timeZone: FUSO_PREDEFINITO,
  timeoutSeconds: 540, memory: '512MiB', maxInstances: 1, retryCount: 1,
}, async () => {
  const r = await notte(getFirestore());
  logger.info('Chiusura notturna', {giorno: r.giorno, famiglie: r.famiglie, figli: r.figli, ombra: r.ombra,
    chiusure: r.chiusure, confronto: r.confronto, errori: r.errori.length, durataMs: r.durataMs});
});
