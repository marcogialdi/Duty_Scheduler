'use strict';
/* Compiti di casa · scelta icone, guida, novità, informativa */

/* =====================================================================
   ICONE, GUIDA, INFORMATIVA
   ===================================================================== */
let iconCb = null;
function pickIcon(groups, cur, cb){
  iconCb = cb;
  $('iconGrid').innerHTML = groups.map(([g, list]) => `<div class="igroup">${g}</div><div class="igrid">${
    list.split(' ').map(ic => `<button type="button" class="${ic === cur ? 'on' : ''}" data-ic="${ic}">${ic}</button>`).join('')}</div>`).join('');
  $('iconDlg').showModal();
}
$('iconGrid').onclick = e => { const b = e.target.closest('[data-ic]'); if (!b) return; $('iconDlg').close(); iconCb?.(b.dataset.ic); };

$('appVer').innerHTML = `<button class="link" id="verBtn">${APP_NAME} · versione ${APP_VERSION} · ${fmtDate(APP_DATE)}</button>`;
$('verBtn').onclick = () => openHelp('news');
const newsHtml = open => `
    <details data-sec="news" ${open ? 'open' : ''}><summary>🆕 Novità · versione ${APP_VERSION}</summary>
      <ul>${CHANGELOG.slice(0, 4).map(([v, d, t]) => `<li><b>${v}</b> (${fmtDate(d)}): ${esc(t)}</li>`).join('')}</ul>
      <p style="color:var(--muted);font-size:.85rem">Se un altro dispositivo mostra un numero diverso, chiudi e riapri l'app con la connessione attiva: si aggiorna da sola.</p></details>`;

/* guida contestuale (0.14.0): ogni sezione ha un codice; la guida si apre su quella della schermata in uso */
const helpSec = (id, summary, html) => `<details data-sec="${id}"><summary>${summary}</summary>${html}</details>`;
// prima dell'accesso (e senza famiglia): solo come si entra
function helpLoggedOut(){
  return helpSec('reg', '🆕 Creare la famiglia', `
      <ol><li>Tocca <b>Crea la famiglia</b> e scegli email e password: è l'account di un genitore.</li>
      <li>Dai un nome alla famiglia, poi aggiungi i figli: nome (meglio un soprannome), icona, colore e un <b>PIN di 6 cifre</b> diverso per ciascuno.</li>
      <li>Controlla gli orari di sveglia e di letto: dividono la giornata in 🌅 Mattina, ☀️ Pomeriggio e 🌙 Sera. Puoi caricare compiti e premi di esempio da modificare dopo.</li></ol>
      <p>Hai già un account ma nessuna famiglia? Entra e scegli <b>Crea una nuova famiglia</b>.</p>`) +
  helpSec('join', '✉️ Ho un codice d\'invito', `
      <p>Il secondo genitore entra con un <b>codice d'invito</b> creato dall'altro genitore in ⚙️ Setup › Genitori (oppure apre il link ricevuto).</p>
      <ul><li>Il codice vale <b>7 giorni</b> e <b>una volta sola</b>: per un'altra persona serve un codice nuovo.</li>
      <li>Scegli email e password (o entra con il tuo account) e il tuo nome: da quel momento vedi e gestisci la stessa famiglia.</li></ul>`) +
  helpSec('login', '🔑 Accesso dei genitori', `
      <p>Entra con email e password. Hai dimenticato la password? Scrivi l'email e tocca <b>Password dimenticata</b>: arriva un'email per sceglierne una nuova.</p>`) +
  helpSec('kidlogin', '🧒 Accesso dei figli', `
      <ol><li>Tocca il tuo nome e scrivi il tuo <b>PIN</b> di 6 cifre.</li>
      <li>PIN dimenticato? Chiedi a mamma o papà: te ne danno uno nuovo da ⚙️ Setup › Figli › Nuovo PIN.</li></ol>
      <p>I nomi dei figli compaiono solo su un dispositivo <b>attivato</b> da un genitore (⚙️ Setup › Questo dispositivo): tablet di famiglia o telefono personale di un figlio.</p>`) +
  helpSec('install', '📲 Installarla come app', `
      <p><b>iPhone e iPad</b>: apri il link con <b>Safari</b> › tocca Condividi <b>⬆️</b> › <b>Aggiungi alla schermata Home</b>.</p>
      <p><b>Android</b>: apri con <b>Chrome</b> › menu <b>⋮</b> › <b>Installa app</b> (o il pulsante 📲 Installa in alto).</p>
      <p>Si apre a schermo intero come un'app e funziona anche con connessione debole.</p>`);
}
function helpParent(){
  return helpSec('org', '🧭 Come è organizzata la pagina Genitori', `
      <p>In alto trovi <b>Primi passi</b> (si chiude con un tocco) e sotto le <b>schede</b>: Situazione (punteggi e bonus a mano), Da verificare, Richieste premi (con il catalogo),
      Proposte ragazzi, Gestione compiti (nuovo compito), Compiti assegnati, Bacheca extra, Compiti recupero.
      Il <b>numero rosso</b> su una scheda indica quante cose aspettano una tua decisione.</p>
      <p><b>Da verificare</b> è diviso per giorno (Oggi, Ieri…) e poi per fascia (🌅 Mattina, ☀️ Pomeriggio, 🌙 Sera): ogni fascia è una griglia con i compiti nelle righe e i figli nelle colonne. Compiti di squadra e lavoretti extra sono righe compatte sotto ogni giorno.
      <b>Compiti assegnati</b> è diviso per figlio e, dentro, per fascia.</p>
      <p>Nella giornata dei ragazzi le fasce si chiudono con un tocco sul nome; quelle già fatte, o già passate senza compiti obbligatori da fare, si chiudono da sole.</p>
      <p>Anche <b>⚙️ Setup</b> è diviso in schede: Famiglia e orari (nome, orari, categorie ed eliminazione della famiglia), Figli, Genitori, Regole del gioco, Questo dispositivo. Il pulsante <b>Salva</b> compare in Famiglia e orari e in Regole del gioco e salva entrambe.</p>`) +
    helpSec('first', '🚀 Primi passi', `
      <ol><li><b>Figli</b>: in ⚙️ Setup aggiungi ogni figlio con nome, icona, colore e un PIN di 6 cifre (diverso per ciascuno).</li>
      <li><b>Compiti</b>: in 👪 Genitori controlla i compiti di esempio o creane di nuovi. Tocca ✏️ per modificarli.</li>
      <li><b>Premi</b>: nel Catalogo premi decidi cosa si può "comprare" con le stelle.</li>
      <li><b>Dispositivi</b>: attiva il telefono o il tablet dei figli (vedi sotto).</li>
      <li><b>Altro genitore</b>: in Setup › Genitori crea un codice d'invito e mandaglielo.</li></ol>`) +
    helpSec('people', '👧👦 Figli, genitori e PIN', `
      <ul><li><b>Aggiungere un figlio</b>: ⚙️ Setup › Figli, con nome, icona, colore e un PIN di 6 cifre (fino a 4 figli).</li>
      <li><b>PIN dimenticato</b>: Setup › Figli › <b>Nuovo PIN</b>. Il PIN non è visibile a nessuno; il figlio può cambiarlo da solo dal suo accesso con 🔢 PIN.</li>
      <li><b>Togliere un figlio</b>: Setup › Figli › Rimuovi. Le sue stelle e il suo storico non si vedono più.</li>
      <li><b>L'altro genitore</b>: Setup › Genitori › <b>Crea codice d'invito</b> e mandaglielo. Il codice vale 7 giorni e per una sola persona; si può revocare finché non è stato usato.</li></ul>`) +
    helpSec('family', '🏠 Famiglia, orari e categorie', `
      <ul><li><b>Orari</b>: sveglia, inizio pomeriggio, inizio sera e ora di andare a letto dividono la giornata in 🌅 Mattina, ☀️ Pomeriggio e 🌙 Sera.</li>
      <li><b>Uscita automatica</b>: dopo quanti minuti di inattività un figlio esce da solo (0 = mai).</li>
      <li><b>Categorie</b>: nome e colore dei gruppi di compiti (es. Scuola, Casa).</li>
      <li>Premi <b>Salva</b> in fondo: salva anche le Regole del gioco.</li>
      <li><b>Elimina famiglia</b>, in fondo, cancella per sempre tutti i dati e il tuo account.</li></ul>`) +
    helpSec('device', '📱 Attivare il dispositivo dei figli', `
      <p>Sul telefono o tablet che useranno i figli:</p>
      <ol><li>Apri l'app ed entra come genitore.</li><li>Vai in ⚙️ Setup › <b>Questo dispositivo</b>.</li>
      <li>Scegli <b>Dispositivo personale</b> (si apre sul PIN di quel figlio) oppure <b>Tablet di famiglia</b> (ognuno tocca il suo nome).</li>
      <li>Premi Salva ed <b>Esci</b>: da ora all'apertura compare l'accesso dei figli.</li></ol>
      <p>Il tuo telefono lascialo su "Solo genitori". I figli escono da soli dopo ${fam?.rules?.autoLogoutMin ?? 10} minuti di inattività (si cambia in Setup › Famiglia e orari).</p>`) +
    helpSec('install', '📲 Installarla come app', `
      <p><b>iPhone e iPad</b>: apri il link con <b>Safari</b> › tocca Condividi <b>⬆️</b> › <b>Aggiungi alla schermata Home</b>.</p>
      <p><b>Android</b>: apri con <b>Chrome</b> › menu <b>⋮</b> › <b>Installa app</b> (o il pulsante 📲 Installa in alto).</p>
      <p>Si apre a schermo intero come un'app e funziona anche con connessione debole.</p>`) +
    helpSec('tasks', '📝 Compiti e assegnazioni', `
      <ul><li>Un <b>compito</b> (es. "Lavare i denti") può essere assegnato a più figli, con orari e giorni diversi.</li>
      <li>L'<b>icona</b> si sceglie da sola dal titolo; toccala per cambiarla. Le stelle vanno da 1 a 5.</li>
      <li>"Dal / Al" servono per compiti temporanei (es. durante le vacanze). Le date si scrivono gg/mm/aaaa.</li>
      <li>Con ✏️ modifichi tutto, sospendi un compito per un po' o lo elimini. La ✏️ c'è in "Compiti assegnati" e, per voi genitori, anche su ogni compito della giornata di un figlio.</li>
      <li><b>Titolo, stelle, icona e descrizione</b> appartengono al compito e cambiano in <b>tutte</b> le sue assegnazioni. In Gestione compiti scegli il compito nel menu "Compito" e tocca <b>Modifica il compito</b>: vedi anche tutte le sue assegnazioni.</li>
      <li><b>🔁 Più volte al giorno</b>: nel nuovo compito spunta la casella e scegli le fasce (Mattina, Pomeriggio, Sera), ognuna con il suo orario. Ogni ripetizione si spunta e vale stelle a sé.</li>
      <li><b>Niente doppioni</b>: se scrivi un titolo che esiste già, l'app ti propone di usare quello. Se ci sono già compiti con lo stesso nome, in "Compiti assegnati" trovi <b>Unisci</b>: le assegnazioni passano a un solo compito, lo storico delle stelle non cambia.</li>
      <li>I <b>compiti di recupero 🔄</b> compaiono solo durante un cartellino rosso: servono a rimediare e tornare in pari.</li></ul>`) +
    helpSec('game', '⭐ Il gioco: stelle, serie e cartellini', `
      <ul>${fam ? gameRules().map(x => `<li>${x}</li>`).join('') : ''}</ul>
      <p>Tutti i numeri si possono cambiare in ⚙️ Setup › Regole del gioco.</p>`) +
    helpSec('extra', '🧩 Tre modi per i compiti "fuori programma"', `
      <p>Non tutto ha un giorno fisso. Per non rovinare la giornata perfetta ci sono tre strumenti, da usare insieme:</p>
      <p><b>A · Compito facoltativo ✨</b> — un compito pianificato (con giorni e orario) che dà stelle se fatto, ma <b>non conta</b> per giornata perfetta, serie e penalità.
        Usalo per cose che di solito capitano in certi giorni ma non sempre (es. "aiutare con la spesa del sabato").
        Come: Nuovo compito › Tipo <b>Facoltativo</b>; oppure ✏️ su un compito esistente › Tipo <b>Facoltativo</b>.</p>
      <p><b>B · Bacheca dei lavoretti extra 🧹</b> — lavoretti <b>senza giorno né orario</b> (es. buttare la pattumiera). Compaiono sotto i compiti di ogni figlio;
        chi lo fa tocca "L'ho fatto!" e riceve subito le stelle. Decidi quante volte al giorno si può fare <b>in tutto</b> (es. 1): chi arriva prima lo segna e per gli altri risulta "già fatto".
        Non contano per la giornata perfetta e si contestano come gli altri compiti.
        Come: Nuovo compito › Tipo <b>Lavoretto extra in bacheca</b>; li trovi e modifichi nel pannello "Bacheca lavoretti extra".</p>
      <p><b>Hai sbagliato tipo?</b> Tocca ✏️ sul compito e cambia <b>Tipo di compito</b>: l'app ti dice cosa succede (es. passando a lavoretto extra giorni e orari vengono tolti; passando a pianificato scegli a chi assegnarlo e quando).</p>
      <p><b>🤝 Compiti di squadra</b>: un facoltativo può diventare un compito per una squadra di figli; vedi la sezione qui sotto.</p>
      <p><b>C · Proposte dei ragazzi 💡</b> — per le iniziative spontanee che non sono in nessuna lista. Il figlio scrive cosa ha fatto (max 3 proposte al giorno);
        <b>nessuna stella finché un genitore non approva</b>. Nel pannello "Proposte dei ragazzi" scegli quante stelle dare (1–5) e premi Approva, oppure No.
        Se una proposta torna spesso, conviene aggiungerla alla bacheca.</p>
      <p>Durante il primo cartellino rosso del trimestre anche facoltativi e lavoretti extra non danno stelle; le proposte le valuti tu.</p>`) +
    helpSec('team', '🤝 Compiti di squadra', `
      <p>Un compito facoltativo con la casella <b>Collaborazione</b> spuntata diventa <b>uno solo per una squadra</b> di figli (almeno 2), con un unico obiettivo (es. "Tenere in ordine la camera").
        Funziona così: uno lo segna come fatto, gli altri vedono "l'ha segnato" e toccano <b>Confermo, l'abbiamo fatto</b>. <b>Le stelle arrivano a tutti</b>, nella stessa quantità, <b>solo quando hanno confermato tutti</b>;
        se a fine giornata manca una conferma, nessuno prende stelle (ma nessuno ne perde: è un facoltativo). Chi l'ha segnato può togliere la spunta finché nessun altro ha confermato.
        In "Da verificare" vedi quelli in attesa di conferma e puoi <b>confermare tu</b> se sai che è stato fatto. Se invece non era vero, toccando la sua <b>✓</b> lo contesti per <b>tutta la squadra</b>: ognuno ha confermato, quindi ognuno prende il cartellino giallo.
        Come: Nuovo compito › Tipo <b>Facoltativo</b> › spunta <b>🤝 Collaborazione</b> e scegli la squadra; oppure ✏️ su un facoltativo esistente. Li trovi in "Compiti assegnati" › Compiti di squadra.</p>
`) +
    helpSec('checks', '🔍 Controlli: "Da verificare"', `
      <p>Nella scheda Genitori, "Da verificare" mostra i compiti spuntati nelle ultime ${fam?.rules?.contestHours ?? 48} ore, per giorno e per fascia.
      Nella griglia ogni figlio ha la sua colonna: <b>✓ con l'orario</b> = fatto, <b>—</b> = non fatto, <b>🟨</b> = contestato, <b>👍</b> = confermato.</p>
      <ul><li><b>Tutto ok ✓</b> sul gruppo: conferma in un tocco tutti i compiti del gruppo. Spariscono dalla lista senza aspettare le ${fam?.rules?.contestHours ?? 48} ore e <b>non si possono più contestare</b>; i figli vedono 👍 controllato e non possono più togliere la spunta.</li>
      <li><b>Contestare</b>: tocca la <b>✓</b> del compito non fatto. Per 5 secondi compare <b>Annulla</b> in basso (o tocca di nuovo la casella); poi il figlio restituisce le stelle, ne perde altre, perde la serie e prende un cartellino giallo.</li>
      <li><b>⏰ In scadenza</b>: mostra solo i gruppi con compiti che tra meno di 6 ore non si potranno più contestare; l'intestazione del gruppo dice quanto manca.</li></ul>
      <p>Il primo cartellino rosso del trimestre toglie le stelle per alcuni giorni; dal secondo arrivano i compiti di recupero 🔄.</p>`) +
    helpSec('prizes', '🎁 Premi', `
      <p>I figli chiedono un premio dal Negozio; le stelle restano "prenotate" finché non approvate o rifiutate dalla scheda Genitori.
      Come trasformare i premi virtuali in reali lo decidete voi: il catalogo è vostro.</p>
      <p>Nel <b>Catalogo premi</b> tocca ✏️ per cambiare nome e costo, oppure <b>Sospendi</b> per toglierlo dal negozio per un po'. Le richieste già fatte restano al prezzo di allora.
      Il <b>catalogo consigliato</b> ha 21 premi: 10 senza costi (film, amico a casa…) e 11 con un valore in euro (${EUR_STARS} ⭐ = 1 €), fino al contributo di 100 € per la bici.</p>`) +
    helpSec('faq', '❓ Domande frequenti', `
      <ul><li><b>Un figlio ha dimenticato il PIN?</b> Setup › Figli › Nuovo PIN. Se invece lo vuole cambiare lui, dal suo accesso tocca 🔢 PIN.</li>
      <li><b>Quando arrivano bonus e penalità di fine giornata?</b> Vengono calcolati quando un genitore apre l'app il giorno dopo: apritela almeno una volta al giorno.</li>
      <li><b>Senza connessione?</b> L'app si apre e mostra i dati salvati; le spunte vengono inviate appena torna la rete.</li>
      <li><b>Come cancello tutto?</b> Setup › Famiglia e orari › Elimina famiglia: cancella definitivamente tutti i dati.</li></ul>`);
}
const helpKids = () => helpSec('kids', '🧒 Per i ragazzi: come funziona', `
      <ol><li>Tocca il tuo nome e inserisci il tuo <b>PIN</b> segreto.</li>
      <li>Vuoi cambiare il PIN? Quando sei dentro tocca <b>🔢 PIN</b> in alto: scrivi il PIN attuale, poi quello nuovo (6 cifre) e ripetilo. Non dirlo a nessuno, nemmeno ai fratelli. Se lo dimentichi, chiedi a mamma o papà: te ne danno uno nuovo da ⚙️ Setup › Figli › Nuovo PIN.</li>
      <li>Fai i compiti e tocca il <b>cerchio</b> accanto a ognuno: ricevi subito le ⭐.</li>
      <li>Tocca il nome di una fascia (<b>Mattina, Pomeriggio, Sera</b>) per chiuderla o riaprirla. Quando hai fatto tutto si chiude da sola: se la tocchi di nuovo, l'app si ricorda la tua scelta per quel giorno.</li>
      <li>Fatti tutti? È una <b>giornata perfetta</b>: stelle bonus! Più giorni di fila = serie 🔥.</li>
      <li>Non hai voglia di un compito? <b>🤝 Chiedi</b> a un fratello: se accetta, lo fa lui e guadagna le stelle.</li>
      <li>Sotto i compiti trovi i <b>🧹 lavoretti extra</b>: fai la pattumiera o un altro lavoretto e tocca "L'ho fatto!" per avere stelle in più.</li>
      <li>Hai aiutato in un altro modo? Scrivilo in <b>💡 Hai fatto qualcos'altro?</b>: se mamma e papà sono d'accordo, ti danno delle stelle.</li>
      <li>Un compito con <b>🤝</b> è <b>di squadra</b>: organizzatevi e fatelo insieme. Uno lo segna, gli altri toccano "Confermo, l'abbiamo fatto": le stelle arrivano a tutti solo quando avete confermato tutti.</li>
      <li>Con le stelle compri i premi nel <b>🎁 Negozio</b>.</li>
      <li>Quando mamma o papà controllano un compito compare <b>👍 controllato</b>: da lì non si può più togliere la spunta.</li>
      <li>Attenzione: segnare un compito che non hai fatto costa caro (cartellino giallo 🟨). Dire la verità conviene sempre!</li></ol>
      ${fam ? `<p><b>Le regole complete:</b></p><ul>${gameRules().map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
    `);

// sezione della schermata in uso
const HELP_PTAB = {sit:'org', ver:'checks', prem:'prizes', prop:'extra', new:'tasks', ass:'tasks', board:'extra', rec:'game'};
const HELP_STAB = {fam:'family', kids:'people', par:'people', rules:'game', dev:'device'};
const HELP_SCREEN = {scrWelcome:'reg', scrRegister:'reg', scrNoFam:'reg', scrJoin:'join', scrParentLogin:'login', scrPick:'kidlogin', scrPin:'kidlogin'};
function helpContext(){
  if (!auth.currentUser || !me?.familyId) return HELP_SCREEN[curScreen] || 'reg';
  if (me.role === 'kid') return 'kids';
  if (view === 'setup') return HELP_STAB[stab] || 'family';
  if (view === 'parent') return HELP_PTAB[ptab] || 'org';
  return 'kids';                                 // un genitore che guarda la giornata di un figlio
}
function openHelp(section){
  const where = !auth.currentUser || !me?.familyId ? 'out' : me.role === 'kid' ? 'kid' : 'parent';
  const html = where === 'out' ? helpLoggedOut() : where === 'kid' ? helpKids() : helpParent() + helpKids();
  $('helpBody').innerHTML = `<p class="hint" style="margin:0 0 8px">Si apre sulla parte che riguarda la schermata in uso; le altre sono chiuse qui sotto.</p>`
    + html + newsHtml(false);
  $('helpDlg').querySelector('h2').textContent = `❓ Guida · versione ${APP_VERSION}`;
  const target = section || helpContext();
  const open = $('helpBody').querySelector(`[data-sec="${target}"]`) || $('helpBody').querySelector('details');
  if (open) open.open = true;
  $('helpDlg').showModal();
  open?.scrollIntoView({block:'start'});
}
// un ❓ accanto a un titolo apre la guida sulla sua sezione
document.addEventListener('click', e => {
  const b = e.target.closest('[data-helpsec]');
  if (b){ e.preventDefault(); openHelp(b.dataset.helpsec); }
});
/* =====================================================================
   NOVITÀ ALL'APERTURA (0.12.0)
   Il popup mostra le novità del proprio ruolo (figlio o genitore) non ancora lette.
   "Chiudi" senza spunta: ricompare alla prossima apertura. Con "Ho letto": si salva la versione
   in members/{uid}.newsSeen (vale per la persona su ogni dispositivo) e non ricompare più.
   Copia sul dispositivo per uid: serve finché le regole 0.12.0 non sono pubblicate (i figli non potrebbero salvare).
   ===================================================================== */
let newsShown = false;                       // in questo accesso il popup è già comparso
const newsSeenLocal = uid => store('get', `cdc.news.${uid}`) || '';
function newsFor(role, seen){
  return Object.keys(NEWS)
    .filter(v => cmpVer(v, seen) > 0 && cmpVer(v, APP_VERSION) <= 0 && (NEWS[v][role] || []).length)
    .sort((a, b) => cmpVer(b, a));
}
function maybeShowNews(){
  if (newsShown || !me?.uid || !me?.role || !fam || document.querySelector('dialog[open]')) return;
  const role = me.role === 'kid' ? 'kid' : 'parent';
  const seen = [me.newsSeen || NEWS_FIRST, newsSeenLocal(me.uid)].sort(cmpVer).pop();
  const vers = newsFor(role, seen);
  if (!vers.length) return;
  newsShown = true;
  const dateOf = v => (CHANGELOG.find(([x]) => x === v) || [])[1];
  $('newsHead').textContent = role === 'kid' ? `🆕 Novità per te, ${kidName(me.kidId)}!` : '🆕 Novità per i genitori';
  $('newsSub').textContent = vers.length === 1 ? `Versione ${vers[0]}${dateOf(vers[0]) ? ` · ${fmtDate(dateOf(vers[0]))}` : ''}`
    : `Versioni ${vers.slice().reverse().join(', ')}`;
  $('newsBody').innerHTML = vers.map(v => `${vers.length > 1 ? `<h3 class="nver">Versione ${v}</h3>` : ''}${
    NEWS[v][role].map(([ic, t, txt]) => `<div class="nitem"><span class="nic" aria-hidden="true">${ic}</span><div><b>${esc(t)}</b><p>${txt}</p></div></div>`).join('')}`).join('');
  $('newsRead').checked = false;
  $('newsDlg').showModal();
}
$('newsDlg').addEventListener('close', async () => {
  if (!$('newsRead').checked || !me?.uid) return;
  const uid = me.uid;
  store('set', `cdc.news.${uid}`, APP_VERSION);
  me.newsSeen = APP_VERSION;
  try { await updateDoc(doc(db, 'members', uid), {newsSeen: APP_VERSION}); }
  catch(e){ console.warn('Novità lette: salvate solo su questo dispositivo', e); }
});

function openPrivacy(){
  const who = CONTACT.name ? `${esc(CONTACT.name)}${CONTACT.email ? ` (<a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a>)` : ''}` : 'la persona che ti ha invitato a provare l\'app';
  $('privBody').innerHTML = `
    <p>Questa è una <b>versione di prova</b> di "Compiti di casa", usata da poche famiglie.</p>
    <p><b>Chi gestisce i dati:</b> ${who}.</p>
    <p><b>Quali dati:</b> nome ed email dei genitori; nome (o soprannome), colore e icona dei figli; compiti, orari, stelle, premi e cartellini.
      I PIN dei figli e le password non sono visibili a nessuno: sono custoditi in forma protetta dal servizio di accesso.</p>
    <p><b>Dove:</b> sui server di Google Firebase (database e servizio di accesso), oltre che in parte sul tuo dispositivo per farlo funzionare più velocemente.</p>
    <p><b>Perché:</b> solo per far funzionare l'app durante la prova. Niente pubblicità, niente profilazione, nessuna cessione a terzi.</p>
    <p><b>Per quanto:</b> fino alla fine della prova o finché non elimini la famiglia.</p>
    <p><b>I tuoi diritti:</b> puoi vedere e correggere tutto dall'app e cancellare definitivamente la famiglia e i dati da ⚙️ Setup › Famiglia e orari › Elimina famiglia.
      Per qualsiasi richiesta scrivi a chi gestisce la prova.</p>
    <p><b>Consiglio:</b> per i figli usate soprannomi.</p>`;
  $('privDlg').showModal();
}
