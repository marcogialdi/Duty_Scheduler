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
    <details ${open ? 'open' : ''}><summary>🆕 Novità · versione ${APP_VERSION}</summary>
      <ul>${CHANGELOG.slice(0, 4).map(([v, d, t]) => `<li><b>${v}</b> (${fmtDate(d)}): ${esc(t)}</li>`).join('')}</ul>
      <p style="color:var(--muted);font-size:.85rem">Se un altro dispositivo mostra un numero diverso, chiudi e riapri l'app con la connessione attiva: si aggiorna da sola.</p></details>`;
function openHelp(section){
  const kid = me?.role === 'kid';
  const forKids = `
    <details ${kid ? 'open' : ''}><summary>🧒 Per i ragazzi: come funziona</summary>
      <ol><li>Tocca il tuo nome e inserisci il tuo <b>PIN</b> segreto.</li>
      <li>Fai i compiti e tocca il <b>cerchio</b> accanto a ognuno: ricevi subito le ⭐.</li>
      <li>Tocca il nome di una fascia (<b>Mattina, Pomeriggio, Sera</b>) per chiuderla o riaprirla. Quando hai fatto tutto si chiude da sola: se la tocchi di nuovo, l'app si ricorda la tua scelta per quel giorno.</li>
      <li>Fatti tutti? È una <b>giornata perfetta</b>: stelle bonus! Più giorni di fila = serie 🔥.</li>
      <li>Non hai voglia di un compito? <b>🤝 Chiedi</b> a un fratello: se accetta, lo fa lui e guadagna le stelle.</li>
      <li>Sotto i compiti trovi i <b>🧹 lavoretti extra</b>: fai la pattumiera o un altro lavoretto e tocca "L'ho fatto!" per avere stelle in più.</li>
      <li>Hai aiutato in un altro modo? Scrivilo in <b>💡 Hai fatto qualcos'altro?</b>: se mamma e papà sono d'accordo, ti danno delle stelle.</li>
      <li>Un compito con <b>🤝</b> è <b>di squadra</b>: organizzatevi e fatelo insieme. Uno lo segna, gli altri toccano "Confermo, l'abbiamo fatto": le stelle arrivano a tutti solo quando avete confermato tutti.</li>
      <li>Con le stelle compri i premi nel <b>🎁 Negozio</b>.</li>
      <li>Attenzione: segnare un compito che non hai fatto costa caro (cartellino giallo 🟨). Dire la verità conviene sempre!</li></ol>
      ${fam ? `<p><b>Le regole complete:</b></p><ul>${gameRules().map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
    </details>`;
  $('helpBody').innerHTML = kid ? forKids + newsHtml(section === 'news') : newsHtml(section === 'news') + `
    <details><summary>🧭 Come è organizzata la pagina Genitori</summary>
      <p>In alto trovi <b>Primi passi</b> (si chiude con un tocco) e sotto le <b>schede</b>: Situazione (punteggi e bonus a mano), Da verificare, Richieste premi (con il catalogo),
      Proposte ragazzi, Gestione compiti (nuovo compito), Compiti assegnati, Bacheca extra, Compiti recupero.
      Il <b>numero rosso</b> su una scheda indica quante cose aspettano una tua decisione.</p>
      <p><b>Da verificare</b> e <b>Compiti assegnati</b> sono divisi per figlio e, dentro, per fascia (🌅 Mattina, ☀️ Pomeriggio, 🌙 Sera). In "Da verificare" compiti di squadra e lavoretti extra stanno in un gruppo a parte e ogni voce mostra quanto tempo resta per contestarla.</p>
      <p>Nella giornata dei ragazzi le fasce si chiudono con un tocco sul nome; quelle già fatte, o già passate senza compiti obbligatori da fare, si chiudono da sole.</p></details>
    <details open><summary>🚀 Primi passi</summary>
      <ol><li><b>Figli</b>: in ⚙️ Setup aggiungi ogni figlio con nome, icona, colore e un PIN di 6 cifre (diverso per ciascuno).</li>
      <li><b>Compiti</b>: in 👪 Genitori controlla i compiti di esempio o creane di nuovi. Tocca ✏️ per modificarli.</li>
      <li><b>Premi</b>: nel Catalogo premi decidi cosa si può "comprare" con le stelle.</li>
      <li><b>Dispositivi</b>: attiva il telefono o il tablet dei figli (vedi sotto).</li>
      <li><b>Altro genitore</b>: in Setup › Genitori crea un codice d'invito e mandaglielo.</li></ol></details>
    <details><summary>📱 Attivare il dispositivo dei figli</summary>
      <p>Sul telefono o tablet che useranno i figli:</p>
      <ol><li>Apri l'app ed entra come genitore.</li><li>Vai in ⚙️ Setup › <b>Questo dispositivo</b>.</li>
      <li>Scegli <b>Dispositivo personale</b> (si apre sul PIN di quel figlio) oppure <b>Tablet di famiglia</b> (ognuno tocca il suo nome).</li>
      <li>Premi Salva ed <b>Esci</b>: da ora all'apertura compare l'accesso dei figli.</li></ol>
      <p>Il tuo telefono lascialo su "Solo genitori". I figli escono da soli dopo ${fam?.rules?.autoLogoutMin ?? 10} minuti di inattività (si cambia in Setup).</p></details>
    <details><summary>📲 Installarla come app</summary>
      <p><b>iPhone e iPad</b>: apri il link con <b>Safari</b> › tocca Condividi <b>⬆️</b> › <b>Aggiungi alla schermata Home</b>.</p>
      <p><b>Android</b>: apri con <b>Chrome</b> › menu <b>⋮</b> › <b>Installa app</b> (o il pulsante 📲 Installa in alto).</p>
      <p>Si apre a schermo intero come un'app e funziona anche con connessione debole.</p></details>
    <details><summary>📝 Compiti e assegnazioni</summary>
      <ul><li>Un <b>compito</b> (es. "Lavare i denti") può essere assegnato a più figli, con orari e giorni diversi.</li>
      <li>L'<b>icona</b> si sceglie da sola dal titolo; toccala per cambiarla. Le stelle vanno da 1 a 5.</li>
      <li>"Dal / Al" servono per compiti temporanei (es. durante le vacanze). Le date si scrivono gg/mm/aaaa.</li>
      <li>Con ✏️ modifichi tutto, sospendi un compito per un po' o lo elimini. La ✏️ c'è in "Compiti assegnati" e, per voi genitori, anche su ogni compito della giornata di un figlio.</li>
      <li><b>Titolo, stelle, icona e descrizione</b> appartengono al compito e cambiano in <b>tutte</b> le sue assegnazioni. In Gestione compiti scegli il compito nel menu "Compito" e tocca <b>Modifica il compito</b>: vedi anche tutte le sue assegnazioni.</li>
      <li><b>🔁 Più volte al giorno</b>: nel nuovo compito spunta la casella e scegli le fasce (Mattina, Pomeriggio, Sera), ognuna con il suo orario. Ogni ripetizione si spunta e vale stelle a sé.</li>
      <li><b>Niente doppioni</b>: se scrivi un titolo che esiste già, l'app ti propone di usare quello. Se ci sono già compiti con lo stesso nome, in "Compiti assegnati" trovi <b>Unisci</b>: le assegnazioni passano a un solo compito, lo storico delle stelle non cambia.</li>
      <li>I <b>compiti di recupero 🔄</b> compaiono solo durante un cartellino rosso: servono a rimediare e tornare in pari.</li></ul></details>
    <details><summary>⭐ Il gioco: stelle, serie e cartellini</summary>
      <ul>${fam ? gameRules().map(x => `<li>${x}</li>`).join('') : ''}</ul>
      <p>Tutti i numeri si possono cambiare in ⚙️ Setup › Regole del gioco.</p></details>
    <details><summary>🧩 Tre modi per i compiti "fuori programma"</summary>
      <p>Non tutto ha un giorno fisso. Per non rovinare la giornata perfetta ci sono tre strumenti, da usare insieme:</p>
      <p><b>A · Compito facoltativo ✨</b> — un compito pianificato (con giorni e orario) che dà stelle se fatto, ma <b>non conta</b> per giornata perfetta, serie e penalità.
        Usalo per cose che di solito capitano in certi giorni ma non sempre (es. "aiutare con la spesa del sabato").
        Come: Nuovo compito › Tipo <b>Facoltativo</b>; oppure ✏️ su un compito esistente › Tipo <b>Facoltativo</b>.</p>
      <p><b>B · Bacheca dei lavoretti extra 🧹</b> — lavoretti <b>senza giorno né orario</b> (es. buttare la pattumiera). Compaiono sotto i compiti di ogni figlio;
        chi lo fa tocca "L'ho fatto!" e riceve subito le stelle. Decidi quante volte al giorno si può fare <b>in tutto</b> (es. 1): chi arriva prima lo segna e per gli altri risulta "già fatto".
        Non contano per la giornata perfetta e si contestano come gli altri compiti.
        Come: Nuovo compito › Tipo <b>Lavoretto extra in bacheca</b>; li trovi e modifichi nel pannello "Bacheca lavoretti extra".</p>
      <p><b>Hai sbagliato tipo?</b> Tocca ✏️ sul compito e cambia <b>Tipo di compito</b>: l'app ti dice cosa succede (es. passando a lavoretto extra giorni e orari vengono tolti; passando a pianificato scegli a chi assegnarlo e quando).</p>
      <p><b>🤝 Compiti di squadra (collaborazione)</b> — un compito facoltativo con la casella <b>Collaborazione</b> spuntata diventa <b>uno solo per una squadra</b> di figli (almeno 2), con un unico obiettivo (es. "Tenere in ordine la camera").
        Funziona così: uno lo segna come fatto, gli altri vedono "l'ha segnato" e toccano <b>Confermo, l'abbiamo fatto</b>. <b>Le stelle arrivano a tutti</b>, nella stessa quantità, <b>solo quando hanno confermato tutti</b>;
        se a fine giornata manca una conferma, nessuno prende stelle (ma nessuno ne perde: è un facoltativo). Chi l'ha segnato può togliere la spunta finché nessun altro ha confermato.
        In "Da verificare" vedi quelli in attesa di conferma e puoi <b>confermare tu</b> se sai che è stato fatto. Se invece non era vero, "Non è vero!" vale per <b>tutta la squadra</b>: ognuno ha confermato, quindi ognuno prende il cartellino giallo.
        Come: Nuovo compito › Tipo <b>Facoltativo</b> › spunta <b>🤝 Collaborazione</b> e scegli la squadra; oppure ✏️ su un facoltativo esistente. Li trovi in "Compiti assegnati" › Compiti di squadra.</p>
      <p><b>C · Proposte dei ragazzi 💡</b> — per le iniziative spontanee che non sono in nessuna lista. Il figlio scrive cosa ha fatto (max 3 proposte al giorno);
        <b>nessuna stella finché un genitore non approva</b>. Nel pannello "Proposte dei ragazzi" scegli quante stelle dare (1–5) e premi Approva, oppure No.
        Se una proposta torna spesso, conviene aggiungerla alla bacheca.</p>
      <p>Durante il primo cartellino rosso del trimestre anche facoltativi e lavoretti extra non danno stelle; le proposte le valuti tu.</p></details>
    <details><summary>🔍 Controlli: "Non è vero!"</summary>
      <p>Nella scheda Genitori, "Da verificare" mostra i compiti spuntati nelle ultime ${fam?.rules?.contestHours ?? 48} ore.
      Se scopri che uno non è stato fatto, premi <b>Non è vero!</b>: il figlio restituisce le stelle, ne perde altre, perde la serie e prende un cartellino giallo.
      Il primo cartellino rosso del trimestre toglie le stelle per alcuni giorni; dal secondo arrivano i compiti di recupero 🔄.</p></details>
    <details><summary>🎁 Premi</summary>
      <p>I figli chiedono un premio dal Negozio; le stelle restano "prenotate" finché non approvate o rifiutate dalla scheda Genitori.
      Come trasformare i premi virtuali in reali lo decidete voi: il catalogo è vostro.</p>
      <p>Nel <b>Catalogo premi</b> tocca ✏️ per cambiare nome e costo, oppure <b>Sospendi</b> per toglierlo dal negozio per un po'. Le richieste già fatte restano al prezzo di allora.
      Il <b>catalogo consigliato</b> ha 21 premi: 10 senza costi (film, amico a casa…) e 11 con un valore in euro (${EUR_STARS} ⭐ = 1 €), fino al contributo di 100 € per la bici.</p></details>
    <details><summary>❓ Domande frequenti</summary>
      <ul><li><b>Un figlio ha dimenticato il PIN?</b> Setup › Figli › Nuovo PIN. Se invece lo vuole cambiare lui, dal suo accesso tocca 🔢 PIN.</li>
      <li><b>Quando arrivano bonus e penalità di fine giornata?</b> Vengono calcolati quando un genitore apre l'app il giorno dopo: apritela almeno una volta al giorno.</li>
      <li><b>Senza connessione?</b> L'app si apre e mostra i dati salvati; le spunte vengono inviate appena torna la rete.</li>
      <li><b>Come cancello tutto?</b> Setup › Elimina famiglia: cancella definitivamente tutti i dati.</li></ul></details>
    ${forKids}`;
  $('helpDlg').querySelector('h2').textContent = `❓ Guida · versione ${APP_VERSION}`;
  if (section === 'news') $('helpBody').querySelectorAll('details').forEach((d, i) => d.open = i === (kid ? 1 : 0));
  $('helpDlg').showModal();
}
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
    <p><b>I tuoi diritti:</b> puoi vedere e correggere tutto dall'app e cancellare definitivamente la famiglia e i dati da ⚙️ Setup › Elimina famiglia.
      Per qualsiasi richiesta scrivi a chi gestisce la prova.</p>
    <p><b>Consiglio:</b> per i figli usate soprannomi.</p>`;
  $('privDlg').showModal();
}
