# Test delle regole Firestore

Questi test controllano le regole di sicurezza (`../firestore.rules`) prima di incollarle in Firebase.
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
npm install      # solo la prima volta
npm test
```

Alla fine compare `39 ok, 0 errori` (il numero cresce quando si aggiungono prove).

## Quando lanciarli

- Ogni volta che cambia `firestore.rules`, prima di pubblicare le regole in Console Firebase.
- Quando si aggiunge una funzione che scrive dati nuovi da parte dei figli: aggiungere anche le prove
  in `rules.test.mjs` (una che deve riuscire e una che deve fallire).

Questa cartella non serve all'app: il sito non la usa e i telefoni non la scaricano.
