# Compiti di casa – Registro delle versioni

Numerazione `MAGGIORE.MINORE.CORREZIONE`: si resta su `0.x` durante la prova; `1.0.0` sarà la prima versione da prodotto.
Nuove funzioni → aumenta il secondo numero; solo correzioni → il terzo.

A ogni rilascio (dalla 0.9.0): aggiornare `APP_VERSION`, `APP_DATE` e `CHANGELOG` in `js/config.js`, questo file e,
se le regole cambiano, l'intestazione di `firestore.rules`. Pagina e service worker prendono la versione da soli (`build.py`).

## 0.12.5 · 27/10/2026
Correzioni di sicurezza dalla scansione del 27/10/2026 sulla 0.12.4 (tutte richiedevano un account della famiglia).
- **Dati dei figli controllati prima di mostrarli**: colore, icona e codice di ogni figlio, letti dal documento della famiglia o dal dispositivo, passano da `cleanKids` (`js/util.js`): solo codici di lettere e cifre, colori `#rrggbb` e icone della lista; la schermata "Chi sei?" escapa tutto con `esc()`.
- **Content-Security-Policy** in `index.html`: gli script si caricano solo dal sito e dai domini di Firebase e reCAPTCHA; niente script scritti dentro la pagina.
- **Fondatore rimosso**: `founding()` vale solo quando la famiglia nasce nello stesso salvataggio, quindi un fondatore rimosso da un altro genitore non può rientrare da solo.
- **Scambi**: un figlio può proporre lo scambio solo delle proprie assegnazioni, e un compito ricevuto vale solo se lo scambio viene dal titolare.
- **Compiti di squadra**: il compito segnato deve essere quello dell'assegnazione di squadra; le stelle di un compagno si scrivono solo per l'importo esatto (0 solo con il rosso "niente stelle").
- **Giorni chiusi**: un figlio può togliere la spunta solo nei giorni non ancora chiusi dal genitore.
- **Regole Firestore 0.12.5: vanno ripubblicate.**
- Da tenere presente: le regole non possono controllare i campi dentro la lista `kids` della famiglia; la protezione è nell'app (`cleanKids`, `esc()`, CSP).

## 0.12.4 · 26/10/2026
- **App Check attivo**: chiave Fraud Defense del sito in `APP_CHECK_SITE_KEY` (`js/firebase.js`). L'applicazione obbligatoria (Enforce) si attiva in Console Firebase › App Check solo dopo qualche giorno di metriche "verificate". Regole Firestore invariate (0.12.2).

## 0.12.3 · 26/10/2026
- **App Check con Google Cloud Fraud Defense** (ex reCAPTCHA Enterprise) al posto di reCAPTCHA v3: la chiave in `APP_CHECK_SITE_KEY` (`js/firebase.js`) è ora una chiave Fraud Defense di tipo Sito web. Vuota = spento. Regole Firestore invariate (0.12.2).

## 0.12.2 · 26/10/2026
Correzioni di sicurezza.
- **Rosso "niente stelle" controllato dalle regole**: quando il genitore dà il rosso, la data di inizio e di fine si salvano anche su `kids/{kid}` (`noStarsFrom`, `noStarsUntil`); in quei giorni le regole accettano dal figlio solo compiti e stelle di squadra a 0. I rossi dati prima si allineano da soli alla prima apertura di un genitore.
- **App Check (facoltativo)**: con una chiave in `APP_CHECK_SITE_KEY` (`js/firebase.js`) solo la pagina pubblicata può usare Firebase; uno script esterno non può provare i PIN a raffica. Vuota = spento.
- **Regole Firestore 0.12.2: vanno ripubblicate.**

## 0.12.1 · 26/10/2026
Correzioni di sicurezza.
- **Stelle solo per compiti veri**: un figlio può segnare solo un'assegnazione che esiste, sua (o ricevuta con uno scambio accettato), con il compito giusto e una data vicina a oggi; i compiti di recupero valgono 0 stelle. Prima, scrivendo direttamente nel database, poteva crearsi compiti finti con stelle, invisibili in "Da verificare".
- **Niente codice dai dati**: date e codici dei documenti scritti dai figli (proposte, richieste di premi, scambi, movimenti) sono controllati dalle regole e mostrati sempre come testo (`fmtDate`, `esc`).
- **Inviti monouso**: chi entra con un codice d'invito lo cancella nello stesso salvataggio; un figlio non può più cancellare il proprio account in famiglia per rientrare come genitore.
- **Regole Firestore 0.12.1: vanno ripubblicate.** Finché non lo sono, l'app funziona ma le correzioni lato database non sono attive.

## 0.12.0 · 26/10/2026
- **Da verificare per giorno**: i compiti sono divisi per giorno (Oggi, Ieri…) e poi per fascia (🌅 Mattina, ☀️ Pomeriggio, 🌙 Sera).
- **Griglia compiti × figli**: in ogni fascia i compiti sono nelle righe e i figli nelle colonne; ✓ con l'orario se fatto, — se non fatto, 🟨 se contestato, 👍 se confermato. Compiti di squadra e lavoretti extra in righe compatte sotto ogni giorno. Tolto il conto alla rovescia su ogni voce.
- **Tutto ok ✓**: conferma in un tocco tutti i compiti aperti di un gruppo (campo `verified` sul completamento); spariscono dalla lista, non si possono più contestare e il figlio non può più togliere la spunta. I ragazzi vedono "👍 controllato".
- **Contestazione con un tocco**: al posto dei pulsanti "Non è vero!" si tocca la ✓; per 5 secondi resta "Annulla" (barra in basso o nuovo tocco sulla casella), poi partono penalità e cartellino. Le contestazioni partono una alla volta; se l'app va in secondo piano partono subito.
- **Filtro "In scadenza"**: solo i gruppi con compiti che tra meno di 6 ore non si potranno più contestare; l'intestazione del gruppo dice quanto manca.
- **Popup delle novità** all'apertura, diverso per figli e genitori, con "Chiudi" e la spunta "Ho letto": la versione letta si salva in `members/{uid}.newsSeen` (vale su tutti i dispositivi, anche sul tablet di famiglia); chi ha saltato versioni vede tutte le novità non lette; i nuovi account partono già "letti"; il nuovo PIN di un figlio conserva le novità lette. Testi in `NEWS` (js/config.js).
- Nuovo file `js/verify.js` (scheda Da verificare).
- **Regole Firestore 0.12.0: vanno ripubblicate** (ognuno aggiorna solo il proprio `newsSeen`; un compito confermato non si può più togliere). Finché non sono pubblicate l'app funziona, ma la spunta "Ho letto" dei figli resta salvata solo sul dispositivo.

## 0.11.0 · 23/10/2026
- **Più volte al giorno**: nel nuovo compito la casella "🔁 Più volte al giorno" fa scegliere Mattina, Pomeriggio e Sera, ognuna con il suo orario; si crea un'assegnazione per fascia.
- **Modifica da Gestione compiti**: scelto un compito esistente compaiono "✏️ Modifica il compito" (titolo, stelle, icona, descrizione, tipo: valgono per tutte le assegnazioni) e l'elenco delle sue assegnazioni, ognuna modificabile.
- **Modifica rapida**: guardando la giornata di un figlio, i genitori hanno una ✏️ su ogni compito e lavoretto extra.
- **Doppioni**: avviso quando si crea un compito con un titolo già esistente, con "Usa quello esistente"; in "Compiti assegnati" il riquadro "Unisci" riunisce i compiti con lo stesso nome, senza toccare lo storico delle stelle.
- **Premi**: nome e costo modificabili, "Sospendi / Riattiva" per toglierli dal negozio senza eliminarli; catalogo consigliato di 21 premi (50 ⭐ = 1 €, fino al contributo di 100 € per la bici), caricato anche con gli esempi.
- Eliminare un compito ora elimina anche le sue assegnazioni.
- Regole Firestore invariate (0.9.0).

## 0.10.0 · 22/10/2026
- **Da verificare** raggruppato per figlio e poi per fascia (🌅 Mattina, ☀️ Pomeriggio, 🌙 Sera); compiti di squadra e lavoretti extra in un gruppo a parte. Ogni voce mostra anche l'orario del compito.
- **Compiti assegnati** diviso per figlio e per fascia, con orari della fascia e numero di compiti.
- **Fasce richiudibili** nella giornata dei ragazzi: un tocco sul nome chiude o riapre la fascia; da chiusa mostra quanti compiti mancano. Si chiude da sola se è vuota, tutta fatta o già passata senza obbligatori da fare. La scelta fatta a mano resta per quel figlio e quel giorno sul dispositivo.
- Regole Firestore invariate (0.9.0).

## 0.9.0 · 17/10/2026
- **Compiti di squadra 🤝**: un compito facoltativo con "Collaborazione" vale per una squadra di figli (almeno 2). Uno lo segna, gli altri confermano "l'abbiamo fatto"; le stelle arrivano a tutti, uguali, solo quando hanno confermato tutti. Chi ha segnato può togliere la spunta finché nessuno ha confermato.
- In "Da verificare" i compiti di squadra in attesa mostrano chi deve ancora confermare, con "Confermo io" per il genitore; "Non è vero!" dà il cartellino giallo a tutta la squadra.
- Nella modifica si attiva o toglie la collaborazione: le assegnazioni separate diventano una sola di squadra, e viceversa.
- Esempio nuovo: "Riordinare il salotto insieme".
- L'app è divisa in file per funzione (`js/`, `css/`); i file hanno la versione nel nome, così i telefoni scaricano solo le versioni nuove.
- **Regole Firestore 0.9.0: vanno ripubblicate.**

## 0.8.0 · 17/10/2026
- Pagina Genitori divisa in schede: Situazione (con bonus a mano), Da verificare, Richieste premi (con catalogo), Proposte ragazzi, Gestione compiti, Compiti assegnati, Bacheca extra, Compiti recupero.
- Numero rosso sulle schede con cose da decidere (verifiche, premi, proposte).
- "Primi passi" richiudibile; resta aperto finché manca qualcosa, poi ricorda la scelta.
- In "Da verificare" ogni voce mostra il tempo rimasto per contestarla (in rosso sotto le 6 ore), ordinate dalla più vicina alla scadenza.
- Regole Firestore invariate (0.7.0).

## 0.7.2 · 17/10/2026
- I "compiti punizione" si chiamano ora **compiti di recupero 🔄**: stesso meccanismo (solo durante il cartellino rosso, senza stelle), tono più educativo.
- Lo scambio tra fratelli usa l'icona 🤝 ("Chiedi a…") per non confondersi con il recupero.
- Nessun cambio ai dati: i compiti già creati restano validi. Regole Firestore invariate (0.7.0).

## 0.7.1 · 17/10/2026
- Nella finestra di modifica si può cambiare il tipo di compito (pianificato, facoltativo, lavoretto extra, punizione), con l'avviso di cosa succede: passando a lavoretto extra o punizione le assegnazioni vengono tolte; passando a pianificato o facoltativo si crea l'assegnazione.
- Regole Firestore invariate (restano 0.7.0).

## 0.7.0 · 17/10/2026
- A: compiti facoltativi (danno stelle, non contano per giornata perfetta, serie e penalità).
- B: bacheca dei lavoretti extra, senza orario, con limite giornaliero condiviso tra fratelli.
- C: proposte libere dei ragazzi, stelle solo dopo l'approvazione del genitore.
- Numero di versione visibile in fondo all'app e nella Guida ("Novità").
- Regole Firestore aggiornate (bacheca e proposte): **da ripubblicare**.

## 0.6.0 · 17/10/2026
- Conferma password in registrazione e invito.
- Salvataggi grandi divisi in gruppi da 6 (limite di verifiche delle regole Firebase).
- Messaggi d'errore che indicano il passaggio bloccato; rimando dal vecchio `compiti.html`.

## 0.5.0 · 17/10/2026
- Più famiglie, registrazione guidata con consenso, invito del secondo genitore, attivazione dei dispositivi dei figli.
- Icone dei compiti e avatar dei figli, Guida integrata, checklist "Primi passi", elimina famiglia.
- App installabile (PWA), cache offline, saldo calcolato dal server.

## 0.4.0 · 17/10/2026
- Modifica di compiti e assegnazioni, descrizione, date gg/mm/aaaa, "Obiettivo del giorno", layout per telefono e tablet.

## 0.3.0 · 16/10/2026
- Accesso con Firebase Authentication (genitori email e password, figli PIN), pagina Setup, regole per ruolo.

## 0.2.0 · 16/10/2026
- Il gioco: stelle, giornata perfetta, serie, contestazione, cartellini gialli e rossi, negozio premi.

## 0.1.1 · 16/10/2026
- Passaggio da Supabase a Firebase Firestore.

## 0.1.0 · 16/10/2026
- Prima pagina: compiti di Riccardo e Tommaso per fascia, categorie, scambi, sezione genitori (Supabase).
