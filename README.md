# Compiti di casa

App web (PWA) per i compiti quotidiani dei figli, trasformati in un gioco con stelle, serie, cartellini e premi.
Dati e accessi su Firebase (Firestore e Authentication); pubblicata su GitHub Pages. Versione e novità: `CHANGELOG.md`.

**Filosofia del progetto**: [`docs/filosofia.md`](docs/filosofia.md) — responsabilità, cooperazione e gestione dei guadagni. È il riferimento per le scelte di prodotto: leggerlo prima di proporre o sviluppare nuove funzioni.

## Come sono organizzati i file

| File | Contenuto |
|---|---|
| `index.html` | struttura di tutte le schermate e delle finestre |
| `css/base.css`, `css/app.css` | stile generale; schede, bacheca, squadre, guida |
| `js/firebase.js` | configurazione Firebase e librerie (unico modulo, caricato per primo) |
| `js/config.js` | **versione**, registro e popup delle novità (`NEWS`), impostazioni predefinite, icone |
| `js/util.js` | date gg/mm/aaaa, testi, salvataggi a piccoli gruppi, messaggi |
| `js/state.js` | stato dell'app e dispositivo attivato |
| `js/game.js` | regole del gioco: stelle, serie, cartellini, chiusura dei giorni |
| `js/auth.js` | accesso genitori, scelta del figlio e PIN, uscita automatica |
| `js/register.js` | registrazione guidata e invito del secondo genitore |
| `js/data.js` | dati in tempo reale e navigazione tra le viste |
| `js/kid.js` | giornata del figlio, scambi, bacheca, proposte, negozio, estratto conto |
| `js/parent.js` | pagina Genitori e le sue schede |
| `js/verify.js` | scheda Da verificare: griglia per giorno e fascia, Tutto ok, contestazione con Annulla |
| `js/edit.js` | finestra di modifica di compiti e assegnazioni |
| `js/collab.js` | compiti di squadra: segna, conferma, stelle a tutti |
| `js/setup.js` | Setup: famiglia, figli, genitori, dispositivo, eliminazione |
| `js/help.js` | guida, popup delle novità, informativa privacy, scelta icone |
| `js/main.js` | avvio (ultimo file) |
| `sw.js` | funzionamento offline e aggiornamenti (generato) |
| `firestore.rules` | regole di sicurezza da incollare in Firebase (non serve sul sito) |
| `tests/` | test automatici delle regole con l'emulatore di Firebase: `cd tests && npm test` prima di pubblicare le regole (vedi `tests/README.md`) |

I file `js/` diversi da `firebase.js` sono script normali caricati in ordine e condividono gli stessi nomi:
non serve nessuno strumento di compilazione, il browser li legge così come sono.
Nella pagina pubblicata ogni file ha `?v=<versione>` nel nome, così a ogni versione i telefoni scaricano quelli nuovi.
