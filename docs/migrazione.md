# Migrazione BeBeans: la logica del gioco dal telefono al server

Copia di lavoro del documento di progetto «Migrazione BeBeans» (claude.ai, 16/11/2026), per chi sviluppa nel repository.
Il documento su claude.ai resta il riferimento per le decisioni; qui c'è tutto quello che serve per lavorare.

## Istruzioni per chi sviluppa (anche Claude Code)

Questa sezione dice come lavorare sulla migrazione; il resto del documento spiega cosa fare e perché.

- **Una fase alla volta, su un ramo** (`migrazione/fase-N`), da unire su `main` solo con i test verdi.
- **Decisioni già prese:** piano Blaze attivo; funzioni in **JavaScript** (Node, ES module); regione **`europe-west1`** (il database è in `eur3`); fuso **`Europe/Rome`** per i lavori a orario; `maxInstances` basso su ogni funzione.
- **Regola d'oro:** ogni fase passa da calcolo in ombra, confronto, interruttore per famiglia, e solo alla fine chiusura delle regole (vedi «Convivenza durante la migrazione»). Nessun ragazzo deve mai vedere un numero sbagliato.
- **Compatibilità:** il server scrive gli stessi documenti, con gli stessi id fissi e la stessa forma, che oggi scrive l'app (`perfect_<figlio>_<giorno>`, `streak_…`, `miss_…`, `done_<completamento>`, `collab_<completamento>`, `cheat_…`, ecc.). Una versione vecchia dell'app deve continuare a mostrarli correttamente.
- **Dopo ogni fase:** aggiornare `CHANGELOG.md`, `README.md`, il backlog (`docs/backlog.md`) e lo stato delle fasi in fondo a questo file.

## Obiettivo

Spostare le regole del gioco dal telefono a Cloud Functions su Firebase, a pezzi e senza riscrivere l'interfaccia, prima di aprire BeBeans a molte più famiglie di prova. Il telefono si limita a dire cosa è successo («ho fatto questo compito», «approvo questa richiesta»); stelle, serie, cartellini e medaglie li calcola e li scrive solo il server.

Le ragioni sono quattro:

- **Integrità.** Nessun dispositivo, nemmeno uno manomesso, può scrivere stelle, cartellini o medaglie: le regole di Firestore lo vietano a tutti tranne che al server.
- **Riservatezza delle regole del gioco.** Formule, bonus, soglie dei cartellini e condizioni delle medaglie smettono di viaggiare nel codice scaricato dal browser.
- **Automatismi.** La chiusura della giornata, le scadenze delle 48 ore, i promemoria e le email partono a orario, anche se nessuno apre l'app.
- **Meno letture e regole più semplici.** Un riepilogo per figlio sostituisce la rilettura dello storico; spariscono i compromessi nati dai limiti delle regole.

La riscrittura in React, se si farà, viene dopo: con la logica sul server diventa la ricostruzione della sola parte visiva.

## Situazione attuale (0.16.2)

Oggi tutta la logica gira nel browser: circa 3.200 righe in 17 file JavaScript, più 325 righe di regole Firestore che fanno da arbitro. Il database è Firestore (`eur3`), l'accesso Firebase Authentication con App Check, il sito è su Firebase Hosting (app.bebeans.it) con pubblicazione da GitHub Actions (`.github/workflows/firebase-hosting.yml`).

Le regole sono già severe con i figli. Un figlio può scrivere solo le stelle del compito che ha appena segnato, pari al valore del compito; non può contestare, verificare, approvare premi né assegnarsi cartellini o medaglie. I punti deboli sono altrove:

- **La chiusura dei giorni dipende da chi apre l'app.** Giornate perfette, serie, penalità per i compiti non fatti e progressi delle medaglie si calcolano solo quando un genitore apre l'app (`closeDays` in `js/game.js`). Se nessun genitore entra per giorni, il conto si ferma; al rientro si recuperano al massimo 60 giorni.
- **I genitori possono scrivere qualsiasi movimento.** Le regole concedono ai genitori ogni scrittura su stelle, cartellini e medaglie: corretto per fiducia, ma chi ha l'account di un genitore può scrivere valori arbitrari, e un errore del codice può farlo senza che nessuno se ne accorga.
- **Le regole del gioco sono nel codice scaricato.** Bonus delle serie, moltiplicatore degli imbrogli, soglie dei cartellini e condizioni delle 32 medaglie si leggono aprendo gli strumenti per sviluppatori.
- **Compromessi dovuti ai limiti delle regole.** Scritture a blocchi da 6 (`chunkedBatch`) per stare sotto i circa 20 accessi per operazione; stelle di squadra scritte una per figlio, con `collabRepair` che recupera quelle perse se l'app si chiude a metà; il rosso «niente stelle» copiato sullo stato del figlio perché le regole possano leggerlo.
- **Letture.** All'apertura ogni dispositivo si iscrive a compiti, calendario, premi, ultimi 40 movimenti, cartellini, medaglie e richieste di ogni figlio; il genitore anche ai completamenti degli ultimi 3 giorni. Misura del 16/11/2026: circa 1.200 letture per famiglia attiva al giorno.

## Inventario della logica

L'inventario conta sedici blocchi: undici passano al server (il calendario del giorno in copia condivisa), uno è nuovo e nasce già sul server, quattro restano nell'interfaccia perché sono presentazione o scelte dell'utente. Le fasi sono quelle del piano più sotto.

| Logica | Oggi (file) | Chi la esegue oggi | Destinazione | Fase |
| --- | --- | --- | --- | --- |
| Chiusura del giorno: giornata perfetta, serie, bonus, penalità dei non fatti | `game.js` closeDays / closeKid | genitore, all'apertura | funzione notturna per famiglia | 1 |
| Scadenza delle 48 ore per la verifica | `verify.js` | interfaccia del genitore | funzione notturna | 1 |
| Stelle del compito segnato | `kid.js` + regole | figlio | trigger su nuovo completamento | 2 |
| Stelle dei compiti di squadra e recupero (`collabRepair`) | `collab.js` | ultimo che conferma | trigger su conferma completa | 2 |
| Stelle dei lavoretti extra | `kid.js` renderBoard | figlio / genitore | trigger su completamento | 2 |
| Contestazione: penalità, cartellino giallo, rosso, giornata annullata | `parent.js` contest / contestTeam | genitore | funzione chiamabile «contesta» | 3 |
| Approvazione, rifiuto e annullo dei premi con controllo del saldo | `parent.js`, `medals.js` requestReward | genitore / figlio | funzioni chiamabili | 4 |
| Proposte dei ragazzi approvate | `parent.js` | genitore | funzione chiamabile | 4 |
| Saldo e stelle prenotate | `game.js` refreshBalance / reserved | ogni dispositivo | riepilogo per figlio mantenuto dal server | 2 |
| Medaglie: progressi, verifica e assegnazione | `medals.js` checkMedals | genitore, ogni 6 ore | dentro chiusura notturna e trigger | 5 |
| Obiettivo del figlio | `medals.js` setGoal | figlio | resta nell'app (scelta dell'utente) | — |
| Scambi tra fratelli | regole + `kid.js` | figli | resta nell'app, regole invariate | — |
| Calendario dei compiti del giorno (`itemsFor`) | `game.js` | ogni dispositivo | condiviso: copia sul server per i calcoli | 1 |
| Formattazione valuta, popup, guide, novità | `game.js`, `help.js`, `config.js` | ogni dispositivo | resta nell'app | — |
| Creazione famiglia, inviti, figli e PIN | `register.js`, `setup.js` | genitore | resta nell'app; in seguito email di benvenuto | 6 |
| Promemoria e attivazione nuove famiglie | non esiste | — | funzioni a orario + email | 6 |

## Architettura obiettivo

Il telefono diventa un'interfaccia sottile: scrive solo fatti e richieste, e legge riepiloghi già calcolati. Tutto ciò che vale stelle passa da Cloud Functions in `europe-west1`.

```
 App BeBeans (telefono)          Firestore + regole                Cloud Functions (europe-west1)
 - mostra giornata, negozio  →   - il telefono scrive solo     →   - trigger: stelle a ogni compito
 - segna, conferma, chiede   ←     fatti: completamenti,       ←   - chiamabili: contesta, approva
 - legge riepiloghi              conferme, richieste               - regole del gioco solo qui
 - nessuna formula del gioco   - stelle, cartellini, medaglie,         |
        |                        riepiloghi: scritti solo              v
        |                        dal server                    Lavori a orario (Europe/Rome)
        +---- azioni dei genitori (chiamata diretta) ---->     - mezzanotte: chiusura del giorno, medaglie
                                                               - ogni ora: scadenze delle 48 ore
                                                               - mattina: promemoria ed email
```

Tre tipi di funzione coprono tutto:

- **Trigger su Firestore.** Partono da soli quando cambia un documento: un compito segnato, una squadra che completa le conferme. Scrivono stelle e aggiornano il riepilogo del figlio. Scrittura idempotente con id fisso (`done_<id>`, `collab_<id>`), quindi mai stelle doppie anche se il trigger riparte.
- **Funzioni chiamabili.** Le azioni dei genitori con conseguenze (contestare, approvare o rifiutare un premio o una proposta) diventano chiamate dirette: il server controlla permessi e saldo e scrive tutto in una transazione.
- **Lavori a orario.** A mezzanotte, ora italiana, chiudono il giorno per ogni famiglia; ogni ora fanno scadere le verifiche oltre le 48 ore; al mattino mandano promemoria ed email.

**Riepilogo per figlio.** Un documento `kids/{kid}/summary` mantenuto solo dal server: saldo, stelle prenotate, serie, giornate perfette del mese, contatori per le medaglie. Il telefono legge quello invece di sommare lo storico.

**Regole.** Le scritture su stelle, cartellini, medaglie e riepiloghi diventano vietate a tutti i client, genitori compresi; le regole di completamenti, scambi, richieste e obiettivo restano, semplificate.

**Regole del gioco condivise.** Il calcolo dei compiti del giorno (`itemsFor`) e le costanti del gioco servono sia all'app sia al server: vanno in un modulo unico (ES module) usato da entrambi, per non avere due versioni che divergono.

Note tecniche per l'implementazione:

```js
// functions/index.js
import { setGlobalOptions } from 'firebase-functions/v2';
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

// lavori a orario sempre con il fuso italiano
onSchedule({ schedule: '5 0 * * *', timeZone: 'Europe/Rome' }, chiudiGiornata);

// lato app, per le funzioni chiamabili
const functions = getFunctions(fbApp, 'europe-west1');
```

## Convivenza durante la migrazione

Resta una sola app con un solo database: il server si affianca un pezzo alla volta, e ogni passo si può annullare con un interruttore.

- **Interruttore per famiglia.** Il documento della famiglia ha una sezione `server` (per esempio `{chiusura: true, stelle: false}`); se una voce è accesa l'app non fa quel calcolo e lascia fare al server. Ordine di accensione: famiglia di prova, famiglia BeBeans, Iorizzo, tutte.
- **Calcolo in ombra.** Prima dell'accensione il server scrive i propri risultati in `kids/{kid}/shadow`, che l'app ignora; i conti vengono confrontati con quelli scritti dai telefoni.
- **Niente doppioni.** Server e telefono scrivono gli stessi documenti con gli stessi id fissi (`perfect_<figlio>_<giorno>`, `collab_<compito>`); la chiusura controlla in transazione la data dell'ultima chiusura, quindi chi arriva secondo si ferma.
- **Telefoni con versioni vecchie.** L'app salva la propria versione nel profilo; una «versione minima» nel database fa comparire «Aggiorna BeBeans» sotto soglia. Le regole che vietano le scritture si chiudono solo quando tutti i dispositivi attivi sono aggiornati.
- **Dove si prova.** Emulatore Firebase nei test automatici; canale di anteprima di Firebase Hosting (indirizzo temporaneo, stesso database) con una famiglia di prova.

**Verifica automatica, senza promemoria.** Il confronto non dipende da nessuno che si ricordi di farlo:

1. Dopo la chiusura di mezzanotte, una funzione `confronta` mette a paragone ombra e conti dei telefoni per ogni famiglia e scrive un rapporto giornaliero in `admin/reports/{giorno}`: famiglie controllate, differenze trovate, dettaglio di ogni differenza.
2. Alle 7 una procedura pianificata di GitHub Actions legge il rapporto: se ci sono differenze apre una segnalazione (issue) nel repository, e GitHub manda un'email a Marco; se è tutto in ordine non succede nulla. Serve un ruolo di sola lettura del database sull'account `github-deploy`.
3. La pagina Statistiche riservata mostra l'ultimo rapporto e lo storico.

Così un errore emerge la mattina dopo, prima che i ragazzi lo notino, e il passaggio all'interruttore successivo si decide guardando una settimana di rapporti puliti.

## Piano a fasi

La migrazione procede per fasi; l'app resta sempre funzionante e ogni fase si può fermare senza danni. La regola è la stessa per tutte: prima il server calcola «in ombra» accanto al telefono, si confrontano i risultati per alcuni giorni, poi il telefono smette di farlo e le regole chiudono la porta.

0. **Preparazione.** Passaggio a Blaze con avvisi di budget a 5 € e 20 € (fatto). Repository privato dopo lo spegnimento del vecchio indirizzo (21/11/2026). Cartella `functions/` con Node, in `europe-west1`. Ruoli aggiuntivi all'account `github-deploy` e pubblicazione di funzioni e regole da GitHub Actions. Modulo condiviso con calendario del giorno e regole del gioco. Test con l'emulatore Firebase, estendendo `tests/rules.test.mjs`.
   - Fatto quando: una funzione di prova risponde da app.bebeans.it e i test girano su GitHub a ogni modifica.
1. **Chiusura notturna.** Funzione a mezzanotte per ogni famiglia: giornate perfette, serie e bonus, penalità dei non fatti, progressi delle medaglie; ogni ora, scadenza delle verifiche oltre le 48 ore. Una settimana in ombra, poi `closeDays` esce dall'app.
   - Fatto quando: i conti di una settimana coincidono con quelli calcolati dai telefoni e una famiglia che non apre l'app per tre giorni li trova chiusi.
2. **Stelle e riepilogo.** Trigger sui completamenti per compiti singoli, di squadra e lavoretti extra; nasce `kids/{kid}/summary` con saldo e stelle prenotate. Spariscono `collabRepair` e la scrittura delle stelle dal telefono.
   - Fatto quando: le regole vietano ai figli ogni scrittura nei movimenti e il saldo letto dal riepilogo coincide con la somma dello storico.
3. **Contestazioni.** Funzione chiamabile «contesta»: penalità, giornata annullata, cartellino giallo, rosso e «niente stelle» in un'unica transazione, anche per le squadre.
   - Fatto quando: `contest` e `contestTeam` escono da `parent.js` e i cartellini non si scrivono più dal telefono.
4. **Premi e proposte.** Funzioni chiamabili per richiesta, annullo, approvazione e rifiuto, con controllo del saldo sul server; stesso schema per le proposte dei ragazzi.
   - Fatto quando: non si può approvare un premio senza stelle sufficienti nemmeno con un dispositivo manomesso.
5. **Medaglie.** Le 32 condizioni passano sul server, valutate a mezzanotte e dopo le azioni che contano; nell'app restano nomi, icone e testi.
   - Fatto quando: `checkMedals` esce dall'app e le medaglie arrivano anche se nessun genitore apre l'app.
6. **Attivazione e chiusura lavori.** Email di benvenuto, promemoria alle famiglie ferme, contatori di attivazione e pagina statistiche riservata. Le regole vietano anche ai genitori di scrivere stelle, cartellini, medaglie e riepiloghi; il codice pubblicato viene minificato; si rimuove il codice morto.
   - Fatto quando: nessun dispositivo scrive più un dato che vale stelle, e le regole del gioco non compaiono nel codice scaricato.

Durante tutte le fasi le nuove funzioni dell'app continuano: il backlog non si ferma, ma ciò che tocca stelle o cartellini nasce già sul server.

## Costi, Blaze e pubblicazione

Il passaggio a Blaze costa zero finché si resta nelle quote gratuite, che con Blaze restano; con 50.000 famiglie la spesa stimata è sotto 1 centesimo per famiglia al mese.

Stima mensile in USD con i prezzi Firestore delle regioni USA ([Firestore pricing](https://cloud.google.com/firestore/pricing)): 0,03 $ ogni 100.000 letture e 0,09 $ ogni 100.000 scritture oltre la quota giornaliera di 50.000 e 20.000; le regioni europee possono costare di più (margine prudente: fino al doppio). Ipotesi dalla misura del 16/11/2026: 1.200 letture e 60 scritture per famiglia attiva al giorno, 300 letture dopo la migrazione, 60% delle famiglie attive ogni giorno.

| Famiglie iscritte | Attive al giorno | Costo oggi | Costo dopo la migrazione |
| --- | --- | --- | --- |
| 65 | 40 | 0 $ | 0 $ |
| 800 | 500 | ~5 $ | ~1 $ |
| 8.000 | 5.000 | ~70 $ | ~30 $ |
| 50.000 | 30.000 | ~430 $ | ~185 $ |

**Protezioni sul conto.** I budget di Google avvisano ma non bloccano: avvisi via email a 5 € e 20 € al mese, controllo settimanale della scheda Utilizzo, e `maxInstances` su ogni funzione.

**Pubblicazione.** Tutto parte da GitHub Actions: sito, regole di Firestore e funzioni a ogni modifica di `main`, con i test dell'emulatore prima.

## Rischi e mitigazioni

| Rischio | Effetto | Mitigazione |
| --- | --- | --- |
| Conti diversi tra telefono e server | stelle in più o in meno, fiducia persa | calcolo in ombra e confronto prima di ogni passaggio; id fissi per evitare doppioni |
| Stelle che arrivano con un attimo di ritardo | il ragazzo pensa che non abbia funzionato | l'app mostra subito «fatto» e le stelle in arrivo |
| Uso senza rete | azioni che restano in coda | i completamenti restano scritture Firestore, che funzionano offline; solo le azioni dei genitori richiedono rete |
| Fuso orario e mezzanotte | giorno chiuso troppo presto o tardi | chiusura con ora di Roma; in futuro il fuso della famiglia |
| Errore che rilegge dati in ciclo | costi inattesi | avvisi di budget, `maxInstances`, test con l'emulatore |
| Due versioni dell'app durante il passaggio | un telefono vecchio scrive ancora stelle | le regole si chiudono solo dopo l'aggiornamento; l'app avvisa chi ha una versione vecchia |
| Logica duplicata tra app e server | regole che divergono nel tempo | modulo condiviso per calendario e regole del gioco |

## Stato

| Voce | Stato |
| --- | --- |
| Piano Blaze e avvisi di budget | fatto |
| Regione delle funzioni: `europe-west1` (database `eur3`) | deciso |
| Linguaggio: JavaScript | deciso |
| Repository privato | dopo il 21/11/2026 |
| Ruoli aggiuntivi per `github-deploy` | assegnati il 16/11/2026 (elenco in [`pubblicazione.md`](pubblicazione.md)); quelli della fase 1 si aggiungono quando servono |
| Fase 0 | **fatta** in 0.16.3 (16/11/2026): modulo condiviso `js/shared/gioco.js`, cartella `functions/` con `ping`, test su GitHub a ogni modifica, pubblicazione di regole, funzioni e sito da GitHub Actions. Verificata da app.bebeans.it: «risponde ✓ (europe-west1, oggi a Roma è il 16/11/2026)» |
| Fase 1 | da avviare |
| Fasi 2–6 | da fare |

Note dalla fase 0, per le fasi successive:
- Le date del modulo condiviso sono calcolate in UTC sulle stringhe `aaaa-mm-gg`, quindi danno lo stesso risultato sul telefono e sul server; il giorno corrente si prende sempre con `oggi('Europe/Rome')`. Le funzioni girano in UTC: mai usare `new Date()` per stabilire il giorno.
- Nell'emulatore le funzioni girano con `TZ=UTC`, come in produzione.
- La «versione minima» dell'app e la versione salvata nel profilo (vedi «Convivenza durante la migrazione») non sono ancora fatte: servono prima di chiudere le regole, conviene farle nella fase 1.
- `firebase-tools` 13 non funziona con `firebase-functions` 7: i test e la pubblicazione usano la 15.
