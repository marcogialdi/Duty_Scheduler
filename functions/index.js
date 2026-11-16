/* BeBeans · Cloud Functions. Piano e decisioni in docs/migrazione.md.
   Ogni funzione vive in src/; qui si dichiarano soltanto, con le opzioni comuni.
   Le regole del gioco sono in shared/gioco.js, copia di js/shared/gioco.js dell'app (npm run condiviso). */
import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall } from 'firebase-functions/v2/https';
import { REGIONE, MAX_ISTANZE } from './src/opzioni.js';
import { ping as pingHandler } from './src/ping.js';

setGlobalOptions({ region: REGIONE, maxInstances: MAX_ISTANZE });

// fase 0: prova del collegamento dall'app (solo utenti con accesso, solo dalla pagina pubblicata grazie ad App Check)
export const ping = onCall({ enforceAppCheck: true, maxInstances: 2 }, request => pingHandler(request));
