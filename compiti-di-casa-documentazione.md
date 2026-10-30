# Compiti di casa – Documentazione di progetto

Versione app 0.7.2 · aggiornata al 17/10/2026 · Documento vivo: https://claude.ai/code/artifact/f6b5aada-f0eb-4617-8ac4-e1afd50f7542

## Panoramica

"Compiti di casa" è una web app installabile (PWA) che trasforma i compiti quotidiani dei figli in un gioco: ogni compito fatto vale stelle, le stelle si spendono in premi decisi dai genitori, e chi imbroglia viene penalizzato più di chi ammette di non aver fatto il compito.

- **Utenti**: famiglie con 1–4 figli. I genitori configurano compiti, premi e regole; i figli vedono la propria giornata e segnano i compiti fatti.
- **Origine**: nata per Riccardo e Tommaso, poi resa generica (nomi, orari, categorie e regole configurabili).
- **Stato al 17/10/2026**: versione di prova multi-famiglia, pronta per un test con 3–4 famiglie di amici. Gira su GitHub Pages + Firebase (piano gratuito Spark).
- **Principio del gioco**: dire la verità conviene sempre. Un compito non fatto costa 1 stella; un compito dichiarato fatto ma non fatto costa le stelle restituite più il doppio del valore, la serie e un cartellino giallo.

## Cronologia

| Data | Versione | Cosa è cambiato |
| --- | --- | --- |
| 30/10/2026 | 0.13.0 – Setup a schede e test delle regole | ⚙️ Setup diviso in schede (Famiglia e orari · Figli · Genitori · Regole del gioco · Questo dispositivo); nella guida dei ragazzi come cambiare il PIN; annullando una proposta o una richiesta di premio il figlio cambia solo lo stato; test automatici delle regole con l'emulatore in `tests/`. Regole 0.13.0 |
| 26–27/10/2026 | 0.12.1–0.12.5 – sicurezza | Due revisioni di sicurezza (manuale e scansione Claude Security): stelle solo per compiti veri, propri e di questi giorni; date e codici controllati (niente XSS); inviti monouso; cartellino rosso "niente stelle" applicato dalle regole; App Check con Google Cloud Fraud Defense; dati dei figli controllati prima di mostrarli e Content-Security-Policy; fondatore rimosso, scambi, compiti di squadra e giorni chiusi protetti dalle regole. Regole 0.12.5 |
| 26/10/2026 | 0.12.0 – Da verificare rifatta | «Da verificare» per giorno e fascia con griglia compiti × figli, «Tutto ok ✓», contestazione con un tocco e Annulla, filtro «In scadenza», popup delle novità. Regole 0.12.0 |
| 23/10/2026 | 0.11.0 – inserire e modificare meglio | Compito più volte al giorno (una fascia per orario); «Modifica il compito» ed elenco delle assegnazioni in Gestione compiti; ✏️ sulla giornata del figlio per i genitori; avviso sui titoli doppi e «Unisci» per i doppioni; premi modificabili e sospendibili; catalogo consigliato di 21 premi (50 ⭐ = 1 €, fino al contributo bici da 100 €). Regole invariate (0.9.0) |
| 22/10/2026 | 0.10.0 – fasce più chiare | «Da verificare» e «Compiti assegnati» divisi per figlio e per fascia (Mattina, Pomeriggio, Sera); squadra e lavoretti extra a parte; nella giornata dei ragazzi fasce richiudibili con un tocco, chiuse da sole se vuote, fatte o passate senza obbligatori da fare; la scelta a mano resta per figlio e giorno sul dispositivo. Regole invariate (0.9.0) |
| 17/10/2026 | 0.9.0 – compiti di squadra e file separati | Compiti di squadra 🤝: un facoltativo con «Collaborazione» vale per una squadra di figli; uno segna, gli altri confermano, le stelle arrivano a tutti solo a conferme complete; il genitore può confermare; «Non è vero!» dà il giallo a tutta la squadra. App divisa in file per funzione (css/, js/) con la versione nel nome dei file e controlli automatici all'assemblaggio. Regole Firestore 0.9.0 da ripubblicare |
| 17/10/2026 | 0.8.0 – schede nella pagina Genitori | Pagina Genitori divisa in 8 schede (Situazione, Da verificare, Richieste premi, Proposte ragazzi, Gestione compiti, Compiti assegnati, Bacheca extra, Compiti recupero) con numero rosso sulle schede che chiedono una decisione; "Primi passi" richiudibile; in "Da verificare" tempo rimasto per contestare (rosso sotto le 6 ore), voci ordinate per scadenza. Dati e regole invariati (0.7.0) |
| 17/10/2026 | 0.7.2 – compiti di recupero | "Compiti punizione" rinominati "compiti di recupero" 🔄; scambio tra fratelli con icona 🤝; controllo automatico sull'assemblaggio della pagina. Dati e regole invariati |
| 17/10/2026 | 0.7.1 – cambio del tipo di compito | Nella modifica si cambia il tipo (pianificato, facoltativo, lavoretto extra, punizione) con avviso sulle conseguenze; regole Firestore invariate (0.7.0) |
| 17/10/2026 | 0.7.0 – compiti fuori programma + versione | A: compiti facoltativi; B: bacheca dei lavoretti extra con limite giornaliero condiviso; C: proposte dei ragazzi con stelle solo dopo approvazione; tipo di compito nel modulo, nuovi esempi, guida e regole aggiornate |
| 17/10/2026 | 0.6.0 – correzioni test | Conferma password in registrazione e invito; salvataggi grandi divisi in gruppi da 6 per il limite di verifiche delle regole Firebase; messaggi d'errore che indicano il passaggio bloccato; rimando dal vecchio `compiti.html` a `compiti/` |
| 17/10/2026 | 0.5.0 – multi-famiglia + PWA | Livello "famiglie" nel database, registrazione guidata in 4 passi con consenso privacy, invito del secondo genitore con codice, attivazione del dispositivo dei figli, icone emoji dei compiti e avatar dei figli, guida integrata, checklist "Primi passi", eliminazione famiglia, PWA installabile, cache offline, saldo calcolato lato server |
| 17/10/2026 | 0.4.0 – usabilità | Modifica di compiti e assegnazioni in una finestra dedicata, descrizione del compito, date gg/mm/aaaa, riquadro "Obiettivo del giorno" con barra di avanzamento, layout per smartphone e tablet |
| 16/10/2026 | 0.3.0 – account e Setup | Login con Firebase Authentication (genitori email+password, figli PIN a 6 cifre), pagina Setup (figli fino a 4, genitori, orari, categorie, regole), regole di sicurezza per ruolo |
| 16/10/2026 | 0.2.0 – gioco | Stelle, giornata perfetta, serie, penalità, contestazione "Non è vero!", cartellini gialli/rossi, negozio premi, estratto conto |
| 16/10/2026 | 0.1.1 – Firebase | Passaggio da Supabase a Firebase Firestore (limite di 2 progetti gratuiti su Supabase) |
| 16/10/2026 | 0.1.0 – prima pagina | Pagina HTML con tab Riccardo/Tommaso, compiti per fascia, categorie colorate, scambio compiti con accettazione, sezione genitori; database Supabase |

**Regola delle versioni.** Numerazione `MAGGIORE.MINORE.CORREZIONE`: `0.x` durante la prova, `1.0.0` alla prima versione da prodotto; nuove funzioni aumentano il secondo numero, le sole correzioni il terzo. Il numero si vede in fondo all'app e nella Guida (Novità), in `sw.js`, nella prima riga di `firestore.rules` e in `CHANGELOG.md`. A ogni rilascio si aggiornano tutti insieme.

## Funzionalità

### Accesso e famiglia
- Benvenuto: crea famiglia, entra come genitore, ho un codice d'invito.
- Registrazione guidata in 4 passi: account (con conferma password), nome famiglia, figli (icona, colore, PIN diversi tra fratelli), orari + esempi + consenso privacy.
- Secondo genitore: codice d'invito di 8 caratteri valido 7 giorni, condivisibile con link `?invito=CODICE`.
- Attivazione dispositivo (Setup): solo genitori, dispositivo personale di un figlio (si apre sul suo PIN), tablet di famiglia ("Chi sei?" + PIN).
- Uscita automatica dei figli dopo 10 minuti di inattività (configurabile); il figlio può cambiare il proprio PIN.

### Giornata del figlio
- Punteggio: stelle disponibili (e prenotate), serie, gialli attivi, rossi nel trimestre.
- Obiettivo del giorno: barra a tacche, percentuale, bonus in palio, prossimo compito con orario.
- Compiti divisi in Mattina, Pomeriggio, Sera, con icona, orario, categoria colorata, stelle e descrizione.
- Spunta solo nel giorno corrente; navigazione tra i giorni.
- Scambi: "Chiedi a…" un fratello, che accetta o rifiuta; chi accetta prende stelle +1.
- Negozio premi con richiesta da approvare; "Le mie stelle": ultimi 40 movimenti e regole del gioco.

### Compiti fuori programma: A, B e C

Non tutto ha un giorno fisso (es. buttare la pattumiera). Per non rompere la giornata perfetta ci sono tre strumenti complementari, scelti dal tipo di compito nel modulo "Nuovo compito".

| | A · Facoltativo ✨ | B · Lavoretto extra in bacheca 🧹 | C · Proposta del ragazzo 💡 |
| --- | --- | --- | --- |
| Quando usarlo | capita di solito in certi giorni, ma non sempre | serve ogni tanto, senza giorno né orario | iniziativa spontanea non prevista |
| Chi lo crea | genitore (Tipo "Facoltativo", anche cambiando il tipo con ✏️) | genitore (Tipo "Lavoretto extra in bacheca") | il figlio, dalla sua giornata (max 3 al giorno) |
| Dove lo vede il figlio | tra i compiti, con l'etichetta "facoltativo" | sezione "Lavoretti extra" sotto i compiti | sezione "Hai fatto qualcos'altro di utile?" |
| Stelle | quelle del compito, subito | quelle del lavoretto, subito con "L'ho fatto!" | nessuna finché il genitore non approva (1–5) |
| Limiti | giorni e orario come un compito pianificato | max N volte al giorno in tutto; chi arriva prima lo segna | approvazione o rifiuto del genitore |
| Giornata perfetta, serie, penalità | non conta, nessuna penalità se saltato | non conta | non conta |
| Controllo | contestabile 48 ore | contestabile 48 ore | approvazione preventiva |
| Primo cartellino rosso | 0 stelle | 0 stelle | decide il genitore |

Un imbroglio su un facoltativo o lavoretto extra dà il cartellino giallo ma non annulla la giornata perfetta. Una proposta ricorrente conviene aggiungerla alla bacheca.

**Compiti di squadra 🤝 (dalla 0.9.0).** Un facoltativo con la casella *Collaborazione* diventa uno solo per una squadra di almeno 2 figli, con un obiettivo comune (es. «Tenere in ordine la camera»). Uno lo segna (nessuna stella), gli altri toccano *Confermo, l'abbiamo fatto*: a conferme complete ognuno riceve le stelle del compito. Chi l'ha segnato può togliere la spunta finché nessuno ha confermato; senza tutte le conferme nessuno prende stelle, ma nessuno ne perde. Il genitore vede in «Da verificare» chi deve confermare e può confermare lui. Mentire richiede complicità: «Non è vero!» dà il cartellino giallo a tutta la squadra. Non si scambia.

### Genitori
- Checklist "Primi passi" richiudibile (aperta finché manca qualcosa) e banner per attivare il dispositivo.
- **Schede** (dalla 0.8.0): Situazione · Da verificare · Richieste premi · Proposte ragazzi · Gestione compiti · Compiti assegnati · Bacheca extra · Compiti recupero. Un numero rosso indica verifiche, premi o proposte in attesa; l'app ricorda l'ultima scheda aperta.
- Situazione di ogni figlio con bonus o penalità manuali; "Da verificare" (ultime 48 ore, "Non è vero!", con il tempo rimasto per contestare); richieste premi.
- Nuovo compito con icona suggerita dal titolo, descrizione, categoria, 1–5 stelle, assegnazione a uno o a tutti, giorni, date gg/mm/aaaa.
- Modifica di compito e assegnazione in una finestra (sospendi, riattiva, elimina); compiti di recupero; catalogo premi; bonus o penalità manuali con motivo.

### Setup
- Questo dispositivo; figli (aggiungi, rinomina, colore, avatar, nuovo PIN, rimuovi); genitori e inviti.
- Nome famiglia, uscita automatica, orari e fasce, categorie e colori, tutti i numeri delle regole.
- Elimina famiglia con conferma del nome.
- Guida integrata (❓), con versione semplificata per i ragazzi.

## Regolamento del gioco

| Evento | Effetto (valore predefinito) |
| --- | --- |
| Compito fatto | + stelle del compito (1–5), subito alla spunta |
| Giornata perfetta | +3 ⭐ |
| Serie di giornate perfette | +5 a 3 giorni, +15 a 7, +40 a 14, poi +15 ogni 7 giorni; un giorno mancato azzera la serie |
| Scambio accettato | chi accetta prende le stelle del compito +1; chi cede non prende nulla |
| Compito non fatto a fine giornata | −1 ⭐ e serie azzerata |
| Imbroglio contestato (entro 48 ore) | restituisce le stelle, perde 2× il valore, perde serie e giornata perfetta, cartellino giallo |
| 3 gialli in 14 giorni | cartellino rosso; i gialli si azzerano |
| 1° rosso nel trimestre | per 3 giorni i compiti non danno stelle né bonus |
| Dal 2° rosso nel trimestre | per 3 giorni compiti di recupero 🔄, senza stelle |
| Premio richiesto | stelle prenotate; scalate all'approvazione |
| Bonus o penalità manuale | importo libero con motivo |
| A · Facoltativo fatto / saltato | fatto: + stelle; saltato: nessun effetto |
| B · Lavoretto extra | + stelle entro il limite giornaliero condiviso; non conta per la giornata perfetta |
| C · Proposta approvata | 1–5 ⭐ scelte dal genitore; nessuna stella prima |

I conti di fine giornata li calcola il dispositivo di un genitore alla prima apertura del giorno dopo (nessun server notturno), con id fissi che impediscono doppi conteggi, fino a 60 giorni arretrati.

## Architettura tecnica

Nessun server da gestire: la pagina arriva da GitHub Pages e parla direttamente con Firebase (Authentication + Firestore), con costo zero per il test.

- Frontend (dalla 0.9.0): HTML, `css/` (2 fogli) e `js/` (15 file per funzione: config, util, state, game, auth, register, data, kid, parent, edit, collab, setup, help, main + firebase.js). Nessun framework né build: `firebase.js` è l'unico modulo ES (Firebase JS SDK 12.9.0 dal CDN di Google), gli altri sono script normali caricati in ordine che condividono lo stato. Ogni file pubblicato ha `?v=versione` nel nome. Elenco nel `README.md`.
- Database: Cloud Firestore in tempo reale con cache persistente sul dispositivo (apertura istantanea, offline, sincronizzazione al ritorno della rete).
- Accessi: Firebase Authentication; una seconda istanza in memoria crea gli account dei figli senza scollegare il genitore.
- PWA: manifest, service worker (rete prima per la pagina, cache prima per librerie, icone e file dell'app con la versione nel nome), icone Android/iPhone, pulsante "Installa".
- Efficienza: saldo calcolato dal server con una somma; storico limitato a 40 movimenti; scambi e spunte letti solo per il giorno visualizzato; nessun indice composto.
- Sul dispositivo resta solo ciò che non può essere alterato a proprio vantaggio (famiglia e figli attivati, ultima scheda, ultimo saldo, preferenze). Stelle, compiti e cartellini vivono solo sul server.
- Prima versione (16/10/2026) su Supabase, abbandonato per il limite di 2 progetti gratuiti.

## Modello dati (Firestore)

| Percorso | Contenuto | Chi scrive |
| --- | --- | --- |
| `members/{uid}` | familyId, role, kidId, name, email, consentAt, invite | genitore fondatore, genitore invitato, genitori per i figli |
| `invites/{codice}` | familyId, familyName, createdBy, expiresAt | genitori |
| `families/{fid}` | name, times, categories, rules, kids[], createdBy, consentAt, lastDeviceAt | genitori |
| `…/tasks/{id}` | title, icon, description, categoryId, points, optional (A), collab (squadra), board + maxPerDay (B), punishment (compito di recupero), defaultTime | genitori |
| `…/schedule/{id}` | taskId, owner (kidId o "team"), team [kidId…], startTime, weekdays, startDate, endDate, active | genitori |
| `…/swaps/{scheduleId_data}` | scheduleId, date, fromOwner, toOwner, status | figli coinvolti, genitori |
| `…/completions/{scheduleId_data}` | scheduleId, taskId, date, doneBy, points, doneAt, contested; squadra: collab, team, confirmed, completeAt, parentConfirmed; bacheca: scheduleId = x-<compito>-<n>, slot, board | figlio (oggi, i suoi), genitori |
| `…/rewards/{id}` | title, cost, active | genitori |
| `…/kids/{kidId}` | streak, lastClosed | genitori |
| `…/kids/{kidId}/ledger/{id}` | kid, amount, type (task, collab, perfect, streak, missed, cheat, reward, manual, proposal), reason, date, createdAt, completionId | figlio "task" (sue) e "collab" (anche dei compagni, a conferme complete), genitori |
| `…/kids/{kidId}/cards/{id}` | type, date, from, until, nth, effect | genitori |
| `…/kids/{kidId}/redemptions/{id}` | rewardId, title, cost, status | figlio (richiesta, annullo), genitori |
| `…/kids/{kidId}/proposals/{id}` | kid, title, date, status, points (solo all'approvazione) | figlio (proposta, annullo), genitori |

## Sicurezza

- Genitori: email e password. Figli: PIN di 6 cifre come password di un account con email sintetica `{fid}.{kidId}.{versione}@kids.<dominio>`.
- Nuovo PIN dal genitore: nuovo account (versione +1), il vecchio perde i permessi.
- Il dispositivo attivato salva famiglia e figli in locale: "Chi sei?" non legge il database.
- Regole Firestore: ogni richiesta verifica famiglia e ruolo in `members/{uid}`; famiglie isolate; il primo genitore si registra solo creando la famiglia, il secondo solo con invito valido; i figli scrivono solo le proprie azioni con punti coerenti e leggono solo i propri punteggi.
- Compiti di squadra: segna solo un membro della squadra dell'assegnazione, e solo il compito di quell'assegnazione; un compagno aggiunge solo la propria conferma; chi ha segnato toglie la spunta solo finché mancano conferme; stelle di squadra (`collab_…`) scrivibili da un membro anche per i compagni, solo a conferme complete, non contestate e pari esattamente al valore del compito (0 solo con il rosso "niente stelle").
- Dalla 0.12.x: un figlio segna solo assegnazioni vere, sue o ricevute da uno scambio del titolare, con data vicina a oggi; toglie la spunta solo nei giorni non ancora chiusi; propone lo scambio solo dei propri compiti; annullando una richiesta cambia solo lo stato. Inviti monouso; un fondatore rimosso non rientra da solo. Date e codici dei documenti scritti dai figli controllati; colore, icona e codice dei figli controllati nell'app (`cleanKids`); Content-Security-Policy; App Check (Google Cloud Fraud Defense).
- Test: `tests/` contiene le prove automatiche delle regole con l'emulatore (`npm test`, vedi `tests/README.md`); vanno lanciate prima di ogni pubblicazione delle regole.
- Limite Firebase: ~20 verifiche per salvataggio di gruppo → gruppi da 6; stelle di squadra scritte una per figlio, con recupero automatico senza doppioni se qualcosa si interrompe.
- Limiti accettati: un figlio esperto può guadagnare al massimo +1 stella indebita per compito (fino al bonus di scambio); gli account dei figli restano in Authentication dopo l'eliminazione; le regole non possono controllare i singoli campi della lista `kids` della famiglia (lo fa l'app); il PIN di 6 cifre si può provare a indovinare dall'app vera, con i rallentamenti di Firebase.

## Privacy e dati dei minori

- Oggi: informativa breve in app, consenso obbligatorio registrato in `consentAt`, eliminazione famiglia completa (tranne account Authentication dei figli), soprannomi consigliati, nessuna email dei figli. Da completare: `CONTACT` in cima allo script.
- Prima di un prodotto: titolare del trattamento, informativa completa, consenso dei genitori per i minori, database in UE e accordo con Google, cancellazione account lato server, regole degli store per app per bambini.

## Installazione e manutenzione

| File | Ruolo |
| --- | --- |
| `index.html` | struttura delle schermate |
| `css/`, `js/` | stile e logica, un file per funzione (vedi `README.md`) |
| `README.md` | elenco dei file |
| `compiti/manifest.webmanifest` | installazione |
| `compiti/sw.js` | service worker |
| `compiti/icons/` | icone 192, 512, maskable 512, apple-touch 180 |
| `firestore.rules` | regole di sicurezza |
| `tests/` | test automatici delle regole (non serve sul sito) |
| `compiti.html` | rimando al nuovo indirizzo |

1. Firestore in modalità produzione (località europea consigliata).
2. Authentication › Email/password attivo.
3. Firestore › Regole: lanciare i test (`cd tests && npm test`), poi pubblicare `firestore.rules`.
4. `firebaseConfig` del progetto `duty-scheduler-bdd9e` già in `js/firebase.js`.

Pubblicazione: cartella `compiti` su GitHub Pages → `https://<utente>.github.io/<repository>/compiti/`. Aggiornare: caricare tutto il contenuto dello zip, comprese le cartelle `css/` e `js/`. La versione si cambia solo in `js/config.js`; l'assemblaggio la porta nei nomi dei file e nel service worker e blocca il pacchetto se trova errori (pagina incompleta, sintassi, nomi doppi, elementi mancanti, registro versioni, ordine nelle regole). Costi: piano Spark gratuito, ampiamente sotto i limiti.

## Problemi incontrati e soluzioni

| Data | Problema | Soluzione |
| --- | --- | --- |
| 17/10/2026 | "Permesso negato" alla creazione famiglia con regole corrette | Causa probabile: limite di verifiche per salvataggio di gruppo (esempi ~40 documenti). Gruppi da 6, messaggio col passaggio bloccato. Da confermare nel test reale |
| 17/10/2026 | Mancava la conferma password | Aggiunta |
| 17/10/2026 | Il genitore rientrava sul Setup | Il Setup non viene più ricordato |
| 17/10/2026 | La pagina tornava in cima a ogni aggiornamento | Scorrimento solo al cambio schermata |
| 17/10/2026 | La registrazione poteva azzerare la famiglia appena creata | Evento di accesso ignorato durante la registrazione |
| 17/10/2026 | Pagina genitori vuota con login più veloce della configurazione | Controlli su configurazione non caricata |
| 17/10/2026 | Su telefono date tagliate, giorni su due righe | Date su una colonna, giorni su 7 colonne, icona ✏️ |
| 16/10/2026 | Limite 2 progetti gratuiti Supabase | Passaggio a Firebase |
| 16/10/2026 | App web non trovata nelle impostazioni Firebase | "Le tue app" è in fondo alla scheda Generali |

Test: logica di gioco con test automatici; percorso utente completo con Firebase simulato su 360, 390 e 820 px. Regole Firestore non provate con l'emulatore ufficiale: verificarle nel test reale.

## Analisi di mercato (17/10/2026)

| App | Punti chiave | Prezzo |
| --- | --- | --- |
| Chorsee | ~12.000 recensioni (4,6); premi, foto come prova, rotazione | 8,99 $/mese o 39,99 $/anno |
| Joon | missioni, animaletto virtuale, verifica genitore | 12,99 $/mese |
| S'moresUp | penalità per ritardo, rotazione, premi | 9,99 $/mese |
| Choresy | approvazione prima del pagamento | gratuita |
| HousePoints | mercato di scambio compiti tra fratelli | 6,99 $/mese |
| Compito e Ricompensa | in italiano, compiti e premi | gratuita con acquisti in-app |
| BusyKid, GoHenry, Rooster Money | paghetta reale e carta prepagata | abbonamento |

Differenziatori: scambio tra fratelli con favore, serie con bonus crescenti, sistema anti-imbroglio con cartellini (assente nei concorrenti analizzati), app in italiano pensata per bambini. Rischio: la parte distintiva è la più severa; il test deve dire se motiva o scoraggia.

Fonti: https://apps.apple.com/app/id1611068600 · https://apps.apple.com/us/app/id1259710957 · https://mwm.ai/apps/house-points/6751644793 · https://apps.apple.com/it/app/compito-e-ricompensa/id6741204526 · https://www.educationalappstore.com/blog/a-buyers-guide-to-chore-apps · https://heynori.com/article/family-operations-system/best-family-chore-apps

## Limiti noti e roadmap

Limiti: conti di fine giornata legati all'apertura di un genitore; nessuna notifica push; account dei figli non cancellati; non presente sugli store. Risolti: regole verificate con emulatore (`tests/`, dalla 0.13.0); stelle di squadra a un compagno nel primo rosso (dalla 0.12.2, controllate dalle regole dalla 0.12.5).

1. Test con 3–4 famiglie (ora).
2. Server leggero (Cloud Functions, piano Blaze): chiusura notturna, notifiche push, cancellazione completa, stelle calcolate lato server.
3. Codice da prodotto: file già divisi (0.9.0), test delle regole con emulatore (0.13.0); poi moduli ES e build (Vite), monitoraggio errori.
4. Privacy e legale: consulenza GDPR, informativa completa, database UE.
5. Distribuzione: PWA; eventualmente store con Capacitor (Google ~25 $ una tantum, Apple ~99 $/anno, Mac per iOS).

**Backlog.** Le idee e gli sviluppi proposti, con il loro stato, sono ora in un documento a parte: [`docs/backlog.md`](docs/backlog.md).
