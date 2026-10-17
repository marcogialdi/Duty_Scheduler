# Compiti di casa – Registro delle versioni

Numerazione `MAGGIORE.MINORE.CORREZIONE`: si resta su `0.x` durante la prova; `1.0.0` sarà la prima versione da prodotto.
Nuove funzioni → aumenta il secondo numero; solo correzioni → il terzo.

A ogni rilascio (dalla 0.9.0): aggiornare `APP_VERSION`, `APP_DATE` e `CHANGELOG` in `js/config.js`, questo file e,
se le regole cambiano, l'intestazione di `firestore.rules`. Pagina e service worker prendono la versione da soli (`build.py`).

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
