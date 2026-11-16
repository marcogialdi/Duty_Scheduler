# Test delle regole Firestore e delle Cloud Functions

Questi test controllano le regole di sicurezza (`../firestore.rules`) e le Cloud Functions (`../functions`) prima di pubblicarle.
Su GitHub partono da soli a ogni modifica (`.github/workflows/test.yml`); se uno fallisce, non si pubblica nulla.
Lavorano su una copia finta di Firestore (l'emulatore): non toccano il Firebase vero e non costano nulla.

Ogni prova dice cosa deve succedere, per esempio:
- un figlio segna un proprio compito → **consentito**;
- un figlio segna un compito inventato per prendersi stelle → **negato**;
- un genitore entra con un codice d'invito già usato → **negato**.

Se una prova dà `ERRORE`, una regola non fa più quello che dovrebbe: non pubblicare le regole finché non torna tutto `ok`.

## Come si lanciano

Servono [Node.js](https://nodejs.org) 20 o più recente e Java 11 o più recente (l'emulatore è scritto in Java).

```
cd tests
npm install            # solo la prima volta
npm test               # regole di Firestore
npm run test:functions # Cloud Functions nell'emulatore (installa anche le dipendenze di ../functions)
```

Alla fine compare `68 ok, 0 errori` per le regole e `4 ok, 0 errori` per le funzioni (i numeri crescono quando si aggiungono prove).
I test unitari del modulo condiviso e delle funzioni sono in `../functions/test/` (`cd ../functions && npm test`).

## Quando lanciarli

- Ogni volta che cambia `firestore.rules` o una funzione in `../functions` (su GitHub partono comunque da soli).
- Quando si aggiunge una funzione che scrive dati nuovi da parte dei figli: aggiungere anche le prove
  in `rules.test.mjs` (una che deve riuscire e una che deve fallire).

- Quando si aggiunge una Cloud Function: una prova in `functions.test.mjs` che la chiami nell'emulatore.

Questa cartella non serve all'app: il sito non la usa e i telefoni non la scaricano.
