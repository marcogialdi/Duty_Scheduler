# Compiti di casa – Backlog

Idee e sviluppi proposti per l'app, con il loro stato. Aggiornato al 30/10/2026 (versione 0.14.0).

Questo documento raccoglie la sezione «Possibili sviluppi (backlog)» che prima era in fondo alla [documentazione di progetto](../compiti-di-casa-documentazione.md). Ogni nuova idea va confrontata con la [filosofia del progetto](filosofia.md): deve servire almeno uno dei tre obiettivi (responsabilità, cooperazione, gestione dei guadagni). L'ordine in cui sviluppare le voci aperte è nella [roadmap evolutiva](https://claude.ai/artifact/PBUdhmMP3JW7j9n86Ksg7X).

**Stati**: *Da valutare* (idea registrata, non ancora decisa) · *Rinviato* (decisa, ma non ora) · *Fatto in x.y.z* (rilasciata in quella versione).

## Da fare

| Idea | Descrizione | Proposta il | Stato |
| --- | --- | --- | --- |
| Preparare l'app alle lingue | Spostare tutti i testi (pulsanti, messaggi, guida, regole, inviti) in un dizionario italiano, con date e valute per paese; traduzioni dopo il lancio in Italia: inglese e spagnolo, poi tedesco e francese. Analisi nel documento «Pubblicazione sugli store e modello economico» (https://claude.ai/artifact/8wtnm2ayZrs52diVAW4WbV) | 22/10/2026 | Da valutare |
| Gruppi richiudibili in Da verificare | Gruppi chiusi di default con un riassunto nell'intestazione (es. «🌅 Mattina lun 26 · Ricky 7 · Tommy 5 ▸»); in cima i gruppi con compiti in scadenza | 26/10/2026 | Rinviato |
| Il mio obiettivo 🎯 | Il figlio sceglie nel 🎁 Negozio il premio che vuole raggiungere: se le stelle bastano parte la richiesta, se non bastano diventa il suo obiettivo, con una barra di avanzamento nella sua giornata e in «Le mie stelle»; le stelle restano spendibili per qualsiasi premio. Dettaglio in [Il mio obiettivo](#il-mio-obiettivo--proposta-aggiornata-il-30102026). Prerequisito del regalo di compleanno, sviluppabile prima | 27/10/2026 | Da valutare (definita il 30/10/2026) |
| Tagli della valuta 🪐 | Le stelle si mostrano in tre tagli: ⭐ stella, 🪐 pianeta = 100 ⭐, 🌌 galassia = 1.000 ⭐ (es. 2.345 ⭐ → 2 🌌 3 🪐 45 ⭐). Dettaglio in [Tagli della valuta](#tagli-della-valuta--proposta-27102026) | 27/10/2026 | Da valutare |
| Regalo di compleanno 🎂 | Il giorno del compleanno il figlio riceve gli auguri con un pop-up e un regalo in stelle che lo fa avanzare verso il premio scelto come obiettivo; le stelle dipendono da un punteggio sul comportamento degli ultimi 12 mesi, entro un minimo e un massimo decisi dai genitori. Dettaglio in [Regalo di compleanno – algoritmo](#regalo-di-compleanno--algoritmo-proposta-del-27102026). Regalo in € da valutare | 27/10/2026 | Da valutare |
| Medaglie 🏅 | 32 medaglie per piccoli traguardi (es. «Prima giornata perfetta», «Settimana perfetta»), 8 per area: costanza, onestà e fiducia, cooperazione e iniziativa, gestione dei guadagni. Assegnate solo in automatico dall'app, una volta sola, senza livelli e senza stelle. Dettaglio in [Medaglie](#medaglie--proposta-del-30102026) | 30/10/2026 | Da valutare (definita il 30/10/2026) |

## Fatto

| Idea | Descrizione | Proposta il | Stato |
| --- | --- | --- | --- |
| Schede nella pagina Genitori | Troppo scorrimento: dividere in schede (es. Oggi · Compiti · Premi · Proposte) | 17/10/2026 | Fatto in 0.8.0 |
| Compiti collaborativi | Compiti per più figli insieme: le stelle arrivano a tutti solo se ognuno fa la sua parte | 17/10/2026 | Fatto in 0.9.0 |
| Fasce chiare in Gestione compiti | Nella pagina Genitori distinguere bene Mattina 🌅, Pomeriggio ☀️ e Sera 🌙 (intestazione con orari e numero di compiti, separazione visiva), come nella giornata dei ragazzi | 17/10/2026 | Fatto in 0.10.0 |
| Fasce richiudibili | Nella giornata dei ragazzi chiudere e riaprire Mattina 🌅, Pomeriggio ☀️ e Sera 🌙 toccando l'intestazione (resta visibile con il conteggio, es. 4/6); la fascia completata o passata si chiude da sola e il dispositivo ricorda la scelta | 19/10/2026 | Fatto in 0.10.0 |
| «Da verificare» raggruppato | Raggruppare i compiti prima per figlio e poi per fascia (Mattina 🌅, Pomeriggio ☀️, Sera 🌙); compiti di squadra e lavoretti extra in un gruppo a parte | 21/10/2026 | Fatto in 0.10.0 |
| Compito ripetuto nella giornata | Nel modulo scegliere le fasce in cui il compito si ripete, ognuna col suo orario (es. Lavare i denti 07:00, 14:15, 20:50); si crea un'assegnazione per fascia, ognuna si spunta e vale stelle a sé | 22/10/2026 | Fatto in 0.11.0 |
| Modifica dei premi del catalogo | Cambiare nome e costo, sospendere e riattivare un premio (le richieste già fatte mantengono il prezzo di allora) | 22/10/2026 | Fatto in 0.11.0 |
| Modifica rapida dalla giornata del figlio | Guardando la giornata di un figlio, una ✏️ su ogni compito (solo per i genitori) apre la finestra di modifica, senza cercarlo in Compiti assegnati | 22/10/2026 | Fatto in 0.11.0 |
| Modifica da Gestione compiti | Scegliendo un compito esistente nel menu «Compito», offrire «Modifica il compito» e mostrare le sue assegnazioni, ognuna modificabile | 22/10/2026 | Fatto in 0.11.0 |
| Avviso sui compiti doppi | Creando un compito con un titolo già esistente (anche con maiuscole o spazi diversi), proporre di aggiungere un'assegnazione al compito esistente | 22/10/2026 | Fatto in 0.11.0 |
| Unisci compiti doppi | Unire compiti con lo stesso nome in uno solo, spostando tutte le assegnazioni; storico delle stelle invariato | 22/10/2026 | Fatto in 0.11.0 |
| «Da verificare» per giorno | Raggruppare prima per giorno (Oggi · Ieri · Sabato…), poi per fascia, con i compiti in ordine di orario: il genitore ripercorre la giornata invece di inseguire le scadenze | 26/10/2026 | Fatto in 0.12.0 |
| Griglia routine in Da verificare | Per ogni giorno e fascia, una tabella con i compiti nelle righe e i figli nelle colonne: ✓ con l'orario se fatto, — se non fatto; toccando una ✓ si contesta | 26/10/2026 | Fatto in 0.12.0 (compiti pianificati) |
| Righe compatte in Da verificare | Una riga sola per compito: emoji, nome, ora, ⭐; badge arancione «scade tra X h» solo sotto le 6 ore; «Facoltativo» come piccolo tag | 26/10/2026 | Fatto in 0.12.0 (squadra e lavoretti extra) |
| «Tutto ok» per gruppo | Un pulsante «Tutto ok ✓» su ogni gruppo conferma subito i compiti e li toglie dalla lista, senza aspettare le 48 ore | 26/10/2026 | Fatto in 0.12.0 (definitivo) |
| Contestazione più discreta | Al posto dei pulsanti rossi «Non è vero!», un tocco sulla ✓ e un avviso «Annulla» per qualche secondo; il rosso solo sul compito contestato | 26/10/2026 | Fatto in 0.12.0 (tocco sulla ✓ + Annulla 5 s) |
| Filtri in Da verificare | Filtri rapidi in alto: per figlio · Squadra · In scadenza | 26/10/2026 | Fatto in 0.12.0 (solo «In scadenza») |
| Novità all'apertura | Popup con le novità della versione, diverse per figli e genitori, con «Ho letto»; stato in `members/{uid}.newsSeen`, valido per persona su ogni dispositivo; chi ha saltato versioni vede le novità arretrate | 26/10/2026 | Fatto in 0.12.0 |
| Schede nella pagina Setup | Dividere il Setup in schede: Famiglia e orari · Figli · Genitori · Regole del gioco · Questo dispositivo | 17/10/2026 | Fatto in 0.13.0 |
| Guida contestuale | La guida si apre sulla sezione della schermata in uso (Setup → Attivare il dispositivo, Da verificare → Controlli, squadra → Compiti di squadra) e, prima dell'accesso, mostra solo registrazione, invito e accesso; ❓ accanto ad alcuni titoli | 17/10/2026 | Fatto in 0.14.0 |
| Cambio PIN nella guida ragazzi | Spiegare in «Per i ragazzi» come cambiare il PIN (pulsante 🔢 PIN: attuale, nuovo, ripeti) e cosa fare se lo dimenticano (genitori: Setup › Figli › Nuovo PIN) | 17/10/2026 | Fatto in 0.13.0 |

## Schede delle proposte

### Medaglie – proposta (del 30/10/2026)

**Idea.** Una medaglia sancisce un piccolo traguardo: «la prima giornata perfetta», «la prima settimana perfetta». Raggiunto l'obiettivo, si prende la medaglia. È un riconoscimento, non un guadagno: rende visibili i progressi su responsabilità, cooperazione e gestione dei guadagni della [filosofia](filosofia.md).

**Decisioni (30/10/2026).**
- **32 medaglie**, 8 per ciascuna delle quattro aree qui sotto.
- **Una volta sola, senza livelli** (niente bronzo, argento, oro).
- **Nessuna stella**: la medaglia non dà stelle, così non diventa una seconda valuta.
- **Solo in automatico**: le assegna l'app quando il traguardo è raggiunto; i genitori non possono assegnarle a mano.
- Proposto, da confermare: una medaglia vinta **non si perde** (anche dopo un cartellino) e tutte sono **visibili** come traguardi in grigio, nessuna segreta.

**Le 32 medaglie.** Difficoltà: 🟢 facile (prime settimane) · 🟡 media (qualche mese) · 🔴 difficile (un anno o più). Si calcolano con dati che l'app registra già (estratto conto, serie, cartellini, scambi, squadre, proposte, premi).

*✅ Costanza*

| | Medaglia | Si vince quando… | |
| --- | --- | --- | --- |
| 🌟 | Prima giornata perfetta | completa la prima giornata perfetta | 🟢 |
| 📅 | Settimana perfetta | 7 giornate perfette di fila | 🟢 |
| 🔥 | Due settimane di fuoco | serie di 14 giorni | 🟡 |
| 🏆 | Mese perfetto | serie di 30 giorni | 🔴 |
| 💯 | Cento compiti | 100 compiti fatti (non contestati) | 🟢 |
| 🎖️ | Cinquecento compiti | 500 compiti fatti (non contestati) | 🔴 |
| 🌅 | Mattiniero | 7 giorni di fila con tutti i compiti della mattina fatti | 🟡 |
| 📆 | Un mese da campione | 20 giornate perfette in un mese di calendario | 🟡 |

*🤝 Onestà e fiducia*

| | Medaglia | Si vince quando… | |
| --- | --- | --- | --- |
| 👍 | Primo «controllato» | un genitore conferma con «Tutto ok» un suo compito | 🟢 |
| 🛡️ | Parola d'oro | 50 compiti confermati da un genitore, nessuno contestato | 🟡 |
| 🕊️ | Un mese pulito | 30 giorni senza cartellini | 🟡 |
| 💎 | Fiducia totale | 90 giorni senza cartellini | 🔴 |
| 🌈 | Ripartenza | dopo un cartellino rosso, 7 giornate perfette di fila | 🟡 |
| 🔄 | Rimediato | completa tutti i compiti di recupero di un cartellino rosso | 🟡 |
| 🧭 | Trimestre senza rossi | un trimestre intero senza cartellini rossi | 🟡 |
| 👑 | Un anno d'oro | un anno senza cartellini rossi | 🔴 |

*🤗 Cooperazione e iniziativa*

| | Medaglia | Si vince quando… | |
| --- | --- | --- | --- |
| 🤲 | Primo favore | accetta per la prima volta uno scambio di un fratello | 🟢 |
| 💪 | Buon fratello | 10 scambi accettati | 🟡 |
| 👥 | Prima squadra | primo compito di squadra completato | 🟢 |
| 🧩 | Squadra affiatata | 20 compiti di squadra completati | 🟡 |
| 💡 | Prima idea | prima proposta approvata da un genitore | 🟢 |
| 🌱 | Sempre un'idea | 10 proposte approvate | 🟡 |
| 🧹 | Primo lavoretto extra | primo lavoretto della bacheca | 🟢 |
| 🦸 | Super aiutante | 50 lavoretti extra | 🔴 |

*💰 Gestione dei guadagni*

| | Medaglia | Si vince quando… | |
| --- | --- | --- | --- |
| 🎁 | Primo premio | primo premio approvato | 🟢 |
| 🐷 | Salvadanaio | arriva a 200 ⭐ di saldo | 🟢 |
| 🪐 | Primo pianeta | 100 ⭐ guadagnate in totale | 🟢 |
| 🌌 | Prima galassia | 1.000 ⭐ guadagnate in totale | 🟡 |
| ⏳ | So aspettare | 30 giorni senza spendere, con il saldo che cresce | 🟡 |
| 🎯 | Obiettivo raggiunto | raggiunge il premio scelto come obiettivo | 🟡 |
| 🚲 | Grande traguardo | ottiene un premio da almeno 1.000 ⭐ | 🔴 |
| 🏦 | Risparmiatore esperto | arriva a 2.000 ⭐ di saldo | 🔴 |

**Dipendenze.** 🎯 Obiettivo raggiunto richiede [Il mio obiettivo](#il-mio-obiettivo--proposta-aggiornata-il-30102026); 🪐 e 🌌 si legano ai [tagli della valuta](#tagli-della-valuta--proposta-27102026), ma funzionano anche senza.

**Come si vedono.**
- Bacheca «🏅 Le mie medaglie» per ogni figlio: le vinte a colori con la data, le altre in grigio con la condizione per vincerle.
- Popup di festa alla prima apertura dopo la vincita, una volta sola per medaglia.
- I genitori vedono le medaglie di ogni figlio nella Situazione.

**Dati e sicurezza.**
- Un documento per medaglia vinta: `families/{fid}/kids/{kidId}/medals/{medalId}` con `wonAt`, `source: 'app'` (in futuro altre origini, es. un partner) e `seenAt` (popup già mostrato).
- L'elenco delle 32 medaglie e delle loro condizioni sta nel codice dell'app (come le regole del gioco), non nel database.
- Assegnazione sul dispositivo del genitore, insieme ai conti di fine giornata (come serie e giornate perfette); le medaglie di oggi (es. Primo premio) anche all'apertura di un genitore. Con il server della roadmap passerà lì.
- Regole Firestore: scrive solo un genitore; il figlio legge le proprie medaglie e può aggiornare solo `seenAt`. Nessuna assegnazione manuale nell'interfaccia.
- Test in `tests/rules.test.mjs`: il figlio non può darsi una medaglia né cambiarne la data; può segnarla come vista.

**In futuro.** Il campo `source` permette medaglie di partner (sfide sponsorizzate della roadmap), con le cautele già annotate sul marketing verso i minori.

**Da decidere in sviluppo.** Conferma di «non si perde» e «nessuna medaglia segreta»; aspetto della bacheca (griglia per area); se assegnare a ritroso le medaglie già meritate con i dati esistenti al primo avvio (consigliato, con un unico popup riassuntivo).

### Il mio obiettivo – proposta (aggiornata il 30/10/2026)

**Idea.** Il risparmio diventa visibile: il figlio sceglie un premio che non può ancora permettersi e vede ogni giorno quanto gli manca. Serve l'obiettivo «gestione dei guadagni» della [filosofia](filosofia.md): scegliere tra un piacere subito e un obiettivo più grande.

**Come funziona.**
1. Il figlio apre il **🎁 Negozio** e tocca un premio.
2. **Se le stelle bastano** (saldo meno le stelle già prenotate da richieste in attesa): conferma e parte la **richiesta del premio**, come oggi. Non si può scegliere come obiettivo un premio che si può già comprare.
3. **Se le stelle non bastano**: la conferma lo imposta come **obiettivo**. Compare una barra di avanzamento nella sua giornata e in «Le mie stelle» (es. «🎯 Bici: 2.000 ⭐ su 5.000 ⭐»; con i [tagli della valuta](#tagli-della-valuta--proposta-27102026), «2 🌌 su 5 🌌»).
4. **Cambiare obiettivo**: scegliendo nel Negozio un altro premio non ancora raggiungibile, questo sostituisce il precedente (con conferma). L'obiettivo si può anche togliere.
5. **Obiettivo raggiunto**: quando il saldo disponibile arriva al prezzo, festa «Hai raggiunto il tuo obiettivo! 🎉» con il pulsante per richiederlo. Quando il genitore approva la richiesta, l'obiettivo si svuota.

**Se il premio cambia.**
- **Prezzo cambiato** dal genitore: l'obiettivo segue il prezzo nuovo; il figlio vede l'avviso «Il prezzo del tuo obiettivo è cambiato».
- **Premio sospeso o eliminato**: il figlio vede un avviso, ma l'obiettivo resta, con nome e prezzo salvati al momento della scelta; potrà sceglierne un altro quando vuole. Finché il premio è sospeso o eliminato non si può richiedere.

**Dati e sicurezza.**
- L'obiettivo si salva sul documento di stato del figlio `families/{fid}/kids/{kidId}`, campo `goal`: `{rewardId, title, cost, setAt}` (titolo e prezzo copiati per mostrarlo anche se il premio viene eliminato). **Non** in `families/{fid}.kids[]`: quella lista la scrivono solo i genitori e le regole non possono controllarne i campi.
- Regole Firestore: il figlio può cambiare **solo** il campo `goal` del proprio documento (o toglierlo); `rewardId` deve essere un premio esistente e `cost` uguale al suo prezzo. Il resto del documento (serie, rosso, giornate chiuse) resta scrivibile solo dai genitori.
- Test in `tests/rules.test.mjs`: il figlio imposta il proprio obiettivo (consentito); con un prezzo diverso da quello del catalogo, sull'obiettivo di un fratello o toccando altri campi (negato).

**Da decidere in sviluppo.** Dove mostrare l'avviso (banner nella giornata o popup una volta sola); se i genitori vedono l'obiettivo di ogni figlio nella Situazione (consigliato: aiuta a «celebrare i traguardi»).

### Regalo di compleanno – algoritmo (proposta del 27/10/2026)

**Idea.** Il giorno del compleanno, alla prima apertura, il figlio vede un pop-up di auguri con il suo regalo: un pacchetto di stelle che lo fa avanzare verso il premio che ha scelto come obiettivo. Le stelle nascono da una «pagella dell'anno» da 0 a 100 calcolata sugli ultimi 12 mesi: più alto il punteggio, più stelle, sempre dentro un minimo garantito e un massimo fissati dai genitori. Si resta nel gioco delle stelle; il regalo in euro resta un'alternativa da valutare.

**Principi.**
- Misurare il *comportamento*, non la quantità: percentuali e frequenze, non le stelle totali, così un figlio con meno compiti assegnati non è svantaggiato e le stelle già spese nel negozio premi non contano.
- Il regalo minimo è garantito: il compleanno resta una festa, il comportamento decide quanto è grande il regalo, non se c'è.
- Dire la verità conviene anche qui: un compito non fatto pesa poco, un imbroglio pesa molto (coerente con il regolamento).
- Il miglioramento viene premiato: chi chiude l'anno meglio di come l'ha iniziato prende un bonus.
- Il regalo si vede come progresso: non solo «+1.800 ⭐», ma quanto si è avvicinato il suo obiettivo.

**Le quattro voci della pagella** (dati già presenti in `ledger`, `cards` e `completions`):

| Voce | Cosa misura | Formula (punteggio 0–100) | Peso |
| --- | --- | --- | --- |
| Costanza ✅ | compiti obbligatori fatti sul totale (fatti + non fatti) | 0 sotto il 50%, 100 dal 95% in su, lineare in mezzo | 40% |
| Onestà 🤝 | imbrogli contestati ogni 100 compiti fatti; cartellini rossi | 100 − 20 per ogni imbroglio ogni 100 compiti − 15 per ogni rosso, minimo 0 | 25% |
| Giornate perfette ⭐ | giornate perfette sui giorni con compiti | 100 se almeno il 70% dei giorni, proporzionale sotto | 20% |
| Iniziativa 💡 | facoltativi fatti, lavoretti extra, proposte approvate, compiti di squadra, al mese | 100 da 8 al mese (circa 2 a settimana), proporzionale sotto | 15% |

Punteggio = 0,40 × Costanza + 0,25 × Onestà + 0,20 × Giornate perfette + 0,15 × Iniziativa.

**Bonus miglioramento.** Se la pagella degli ultimi 6 mesi supera di almeno 10 punti quella dei 6 mesi precedenti: +5 punti (massimo 100).

**Dal punteggio alle stelle.** I genitori fissano in Setup › Regole un regalo minimo e un regalo massimo in stelle (predefiniti: 500 ⭐ e 2.500 ⭐; a 50 ⭐ = 1 € valgono 10 € e 50 €, valore mostrato solo ai genitori).
- Punteggio fino a 40 → regalo minimo.
- Punteggio da 95 in su → regalo massimo.
- In mezzo: minimo + (massimo − minimo) × (punteggio − 40) / 55, arrotondato a 50 ⭐.
- Fasce mostrate al figlio: Regalo 🎁 (sotto 40), Bel regalo 🎁🎁 (40–69), Grande regalo 🎁🎁🎁 (70–89), Super regalo 🌟 (90 e oltre).

**Esempio.** Costanza 90% → 89; 1 imbroglio ogni 100 compiti, nessun rosso → 80; giornate perfette 50% → 71; iniziativa 6 al mese → 75. Punteggio = 35,6 + 20 + 14,3 + 11,3 = 81 → Grande regalo. Con 500–2.500 ⭐: 500 + 2.000 × 41/55 = 1.991 → **2.000 ⭐**. Se l'obiettivo è il contributo bici (100 € = 5.000 ⭐) e il figlio ha 2.000 ⭐, passa dal 40% all'80% della barra.

**Casi particolari.**
- Figlio nell'app da meno di 12 mesi: si usa il periodo disponibile; sotto i 60 giorni di dati, regalo a metà tra minimo e massimo e nessuna pagella mostrata.
- Giorni di primo rosso (compiti senza stelle) e di compiti di recupero: contano normalmente per Costanza (il compito va comunque fatto); il blocco delle stelle del primo rosso non si applica al regalo di compleanno.
- Le stelle del regalo si sommano al saldo come un movimento a sé e non contano per la pagella dell'anno successivo.

**Flusso.**
1. 7 giorni prima: nella pagina Genitori compare «Compleanno in arrivo» con pagella, stelle proposte e dettaglio delle voci.
2. Il genitore conferma o corregge le stelle e può aggiungere un messaggio di auguri.
3. Il giorno del compleanno, alla prima apertura del figlio: pop-up con auguri e coriandoli, fascia del regalo, «+2.000 ⭐» e la barra dell'obiettivo che avanza; poi «Ecco cosa hai fatto di bello quest'anno» con le voci migliori, senza mettere in evidenza quelle basse.
4. Le stelle arrivano con la conferma del genitore; se il genitore non conferma, al compleanno arrivano le stelle proposte. Il pop-up si mostra una volta sola e resta rivedibile da «Le mie stelle».

**Dati e sicurezza.**
- Nuovo campo per figlio in `families/{fid}.kids[]`: `birthday` in formato gg/mm (solo giorno e mese; da valutare l'anno per «Buon 10° compleanno») e `goalRewardId` (obiettivo scelto, scrivibile anche dal figlio).
- Nuovo tipo di movimento in `ledger`: `birthday`, scrivibile solo dai genitori (le regole Firestore devono impedirlo ai figli).
- Nuovo documento `…/kids/{kidId}/birthdays/{anno}`: score, voci, stars, tier, message, confirmedAt, seenAt. Scrive solo il genitore; il figlio legge il proprio e scrive solo `seenAt`.
- Calcolo sul dispositivo del genitore (come i conti di fine giornata): lettura di `ledger` e `cards` dell'ultimo anno, una volta sola.
- Privacy: la data di nascita di un minore è un dato personale; va aggiunta all'informativa.

**Da decidere.** Pesi e soglie (fissi o configurabili in Setup › Regole); minimo e massimo predefiniti in stelle; se rendere visibile durante l'anno una «pagella in corso» come incentivo; regalo in € come alternativa.

### Tagli della valuta – proposta (27/10/2026)

**Idea.** Con premi grandi (contributo bici 5.000 ⭐) e il regalo di compleanno (fino a 2.500 ⭐) i numeri diventano lunghi. Tre tagli, non di più, rendono i saldi leggibili e danno la soddisfazione di «formare» un pianeta o una galassia.

| Taglio | Vale | In euro (50 ⭐ = 1 €, solo per i genitori) |
| --- | --- | --- |
| ⭐ Stella | 1 | 0,02 € |
| 🪐 Pianeta | 100 ⭐ | 2 € |
| 🌌 Galassia | 1.000 ⭐ = 10 🪐 | 20 € |

**Regole.**
- Solo visualizzazione: nel database tutto resta in stelle (`ledger.amount`, `rewards.cost`), quindi nessuna modifica a dati, regole Firestore o conti.
- Cambio automatico: il saldo si mostra sempre nella forma più compatta, es. 2.345 ⭐ → **2 🌌 3 🪐 45 ⭐**; i tagli a zero non si mostrano (1.045 ⭐ → 1 🌌 45 ⭐).
- I compiti restano in stelle (1–5 ⭐); i tagli compaiono su saldo, costi dei premi, barra dell'obiettivo e regalo di compleanno.
- Momento di festa: quando il saldo supera una soglia di 100 compare «Hai formato un pianeta! 🪐», a 1.000 «Hai formato una galassia! 🌌» (animazione breve, una volta per soglia).
- Una spesa può «rompere» un pianeta o una galassia: il resto torna in stelle automaticamente, come il resto in monete.
- Valore educativo: i tagli seguono centinaia e migliaia, utile ai bambini per esercitarsi con il valore posizionale.
- Opzione in Setup › Regole: mostrare i tagli oppure solo le stelle (per i più piccoli).

**Esempio.** Saldo 2.000 ⭐ = 2 🌌; obiettivo bici 5.000 ⭐ = 5 🌌; la barra mostra «2 🌌 su 5 🌌». Con il regalo di compleanno da 2.000 ⭐ diventa «4 🌌 su 5 🌌».

**Da decidere.** Nomi alternativi (es. 🌙 luna, ☀️ sole) e se mostrare nel negozio premi il prezzo misto (1 🌌 5 🪐) o con i decimali (1,5 🌌; sconsigliato per i bambini).
