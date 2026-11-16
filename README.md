# BeBeans · Compiti di casa

App web (PWA) per i compiti quotidiani dei figli, trasformati in un gioco con stelle, serie, cartellini e premi.
Dati e accessi su Firebase (Firestore e Authentication); pubblicata su Firebase Hosting (app.bebeans.it) da GitHub Actions; dalla 0.16.3 una parte della logica gira su Cloud Functions. Versione e novità: `CHANGELOG.md`.

**Filosofia del progetto**: [`docs/filosofia.md`](docs/filosofia.md) — responsabilità, cooperazione e gestione dei guadagni. È il riferimento per le scelte di prodotto: leggerlo prima di proporre o sviluppare nuove funzioni.

**Backlog**: [`docs/backlog.md`](docs/backlog.md) — idee e sviluppi proposti, con il loro stato.

**Migrazione al server**: [`docs/migrazione.md`](docs/migrazione.md) — piano per spostare la logica del gioco su Cloud Functions, a fasi (fase 0 fatta in 0.16.3; fase 1, chiusura notturna, in 0.17.0).

**Pubblicazione**: [`docs/pubblicazione.md`](docs/pubblicazione.md) — test e pubblicazione da GitHub Actions, ruoli dell'account `github-deploy`.

**Licenza**: © 2026 Marco Gialdi, tutti i diritti riservati. Il codice è visibile ma non è open source: copiarlo, modificarlo, ridistribuirlo o usarlo per altri prodotti richiede un'autorizzazione scritta. Dettagli in [`LICENSE`](LICENSE).

## Marchio e colori (dalla 0.15.0)

Logo A "Fagiolo stella": fagiolo giallo con stella corallo e contorno blu notte (`icons/logo.svg`; icone dell'app in `icons/`).
I colori sono variabili in cima a `css/base.css`: per cambiarli basta toccare lì.

| Ruolo | Colore | Uso |
|---|---|---|
| Blu notte | `#1F2A44` | testo, contorni, pulsanti principali, schede attive |
| Giallo fagiolo | `#FFD54A` | sfondi, avvisi informativi, pulsanti principali nel tema scuro |
| Corallo stella | `#FF7A59` | evidenziazioni, barre, "in scadenza" (mai come colore del testo sul chiaro) |
| Corallo scuro | `#B8401F` | numeri delle stelle e testi "in scadenza" (contrasto 5,5:1 sul bianco) |
| Ardesia | `#4A5470` / `#5B6480` | testi secondari |
| Crema | `#FFF8E7` | fondo delle pagine |

Carattere **Fredoka** (500, 600, 700) per titoli, schede e pulsanti, ospitato in `fonts/` (licenza SIL OFL, `fonts/OFL.txt`):
nessun collegamento a Google Fonts. Il testo normale usa il carattere del telefono.

## Come sono organizzati i file

| File | Contenuto |
|---|---|
| `index.html` | struttura di tutte le schermate e delle finestre |
| `css/base.css`, `css/app.css` | stile generale; schede, bacheca, squadre, guida |
| `js/firebase.js` | configurazione Firebase e librerie (unico modulo, caricato per primo) |
| `js/shared/gioco.js` | **regole del gioco condivise con il server**: calendario del giorno, stelle, serie, regole predefinite, date (modulo, caricato subito dopo `firebase.js`) |
| `js/config.js` | **versione**, registro e popup delle novità (`NEWS`), impostazioni predefinite, icone |
| `js/util.js` | date gg/mm/aaaa, testi, salvataggi a piccoli gruppi, messaggi |
| `js/state.js` | stato dell'app e dispositivo attivato |
| `js/game.js` | regole del gioco legate allo stato dell'app (cartellini, saldo, chiusura dei giorni); il resto da `js/shared/gioco.js` |
| `js/auth.js` | accesso genitori, scelta del figlio e PIN, uscita automatica |
| `js/register.js` | registrazione guidata e invito del secondo genitore |
| `js/data.js` | dati in tempo reale e navigazione tra le viste |
| `js/kid.js` | giornata del figlio, scambi, bacheca, proposte, negozio, estratto conto |
| `js/parent.js` | pagina Genitori e le sue schede |
| `js/verify.js` | scheda Da verificare: griglia per giorno e fascia, Tutto ok, contestazione con Annulla |
| `js/edit.js` | finestra di modifica di compiti e assegnazioni |
| `js/collab.js` | compiti di squadra: segna, conferma, stelle a tutti |
| `js/medals.js` | medaglie (elenco, assegnazione automatica, bacheca, popup) e «Il mio obiettivo» |
| `js/setup.js` | Setup: famiglia, figli, genitori, dispositivo, eliminazione |
| `js/help.js` | guida, popup delle novità, informativa privacy, scelta icone |
| `js/main.js` | avvio (ultimo file) |
| `fonts/` | carattere Fredoka del marchio (licenza SIL OFL) |
| `icons/` | logo `logo.svg` e icone dell'app (Android, iPhone, adattabile) |
| `sw.js` | funzionamento offline e aggiornamenti (generato) |
| `firestore.rules` | regole di sicurezza (non serve sul sito); pubblicate da GitHub Actions (vedi `docs/pubblicazione.md`) |
| `functions/` | Cloud Functions (Node 22, `europe-west1`): `index.js` le dichiara, `src/` le contiene (`chiusura.js` calcolo della chiusura dei giorni, `notturna.js` lavoro di mezzanotte e rapporto, `ping.js` prova del collegamento); `test/` e `test-emulatore/` le provano; `scripts/rapporto.mjs` legge il rapporto della notte; `shared/` è una copia generata di `js/shared/gioco.js` (`npm run condiviso`) |
| `tests/` | test automatici con l'emulatore di Firebase: regole (`npm test`) e funzioni (`npm run test:functions`); girano su GitHub a ogni modifica (vedi `tests/README.md`) |

I file `js/` diversi da `firebase.js` e `shared/gioco.js` sono script normali caricati in ordine e condividono gli stessi nomi:
non serve nessuno strumento di compilazione, il browser li legge così come sono.
Nella pagina pubblicata ogni file ha `?v=<versione>` nel nome, così a ogni versione i telefoni scaricano quelli nuovi.
