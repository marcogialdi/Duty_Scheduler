/* Funzione di prova della fase 0: dice che il server risponde, da quale regione e che giorno è a Roma.
   Serve a controllare il collegamento app → server (App Check, accesso, regione); non legge né scrive dati. */
import { HttpsError } from 'firebase-functions/v2/https';
import { oggi, VERSIONE_GIOCO, FUSO_PREDEFINITO } from '../shared/gioco.js';
import { REGIONE } from './opzioni.js';

export function ping(request, adesso = new Date()){
  if (!request.auth) throw new HttpsError('unauthenticated', 'Serve l\'accesso a BeBeans.');
  return {
    ok: true,
    regione: REGIONE,
    fuso: FUSO_PREDEFINITO,
    oggi: oggi(FUSO_PREDEFINITO, adesso),
    versioneGioco: VERSIONE_GIOCO,
    ora: adesso.toISOString(),
  };
}
