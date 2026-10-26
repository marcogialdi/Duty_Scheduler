'use strict';
/* Compiti di casa · versione, impostazioni predefinite, icone */

// chi organizza il test: compare nell'informativa privacy
const CONTACT = { name: '', email: '' };
const APP_NAME = 'Compiti di casa';
/* ---------- VERSIONE ----------
   Numerazione MAGGIORE.MINORE.CORREZIONE: 0.x durante la prova, 1.0.0 = prima versione da prodotto.
   Nuove funzioni → si aumenta il secondo numero; solo correzioni → il terzo.
   A ogni rilascio: aggiorna APP_VERSION, APP_DATE, CHANGELOG e NEWS qui,
   l'intestazione di firestore.rules (se cambiate) e il file CHANGELOG.md. */
const APP_VERSION = '0.12.1';
const APP_DATE = '2026-10-26';
const CHANGELOG = [
  ['0.12.1', '2026-10-26', 'Correzioni di sicurezza: si possono segnare solo i propri compiti veri e di questi giorni, i testi scritti nei dati non diventano mai codice nella pagina, ogni codice d\'invito vale per una sola persona.'],
  ['0.12.0', '2026-10-26', '"Da verificare" rifatta: per giorno e per fascia, griglia compiti × figli, "Tutto ok ✓" per confermare un gruppo in un tocco, contestazione con un tocco sulla ✓ e "Annulla", filtro "In scadenza". Popup delle novità per figli e genitori.'],
  ['0.11.0', '2026-10-23', 'Compiti più facili da inserire e correggere: più volte al giorno, modifica del compito da Gestione compiti e dalla giornata del figlio, avviso e unione dei doppioni; premi modificabili e sospendibili, catalogo consigliato di 21 premi.'],
  ['0.10.0', '2026-10-22', 'Fasce Mattina, Pomeriggio e Sera più chiare: "Da verificare" e "Compiti assegnati" divisi per figlio e per fascia; nella giornata dei ragazzi le fasce si chiudono con un tocco e quelle finite si chiudono da sole.'],
  ['0.9.0', '2026-10-17', 'Compiti di squadra 🤝: uno segna, gli altri confermano, le stelle arrivano a tutti insieme. L\'app è ora divisa in file per funzione (aggiornamenti più leggeri).'],
  ['0.8.0', '2026-10-17', 'Pagina Genitori divisa in schede con contatori; "Primi passi" richiudibile; scadenza visibile per ogni compito da verificare.'],
  ['0.7.2', '2026-10-17', 'I "compiti punizione" si chiamano ora "compiti di recupero" 🔄; lo scambio tra fratelli usa 🤝.'],
  ['0.7.1', '2026-10-17', 'Nella modifica di un compito si può cambiare il tipo (pianificato, facoltativo, lavoretto extra, recupero).'],
  ['0.7.0', '2026-10-17', 'Compiti facoltativi, bacheca dei lavoretti extra e proposte dei ragazzi; numero di versione nell\'app.'],
  ['0.6.0', '2026-10-17', 'Conferma password; salvataggi divisi in piccoli gruppi; messaggi d\'errore più chiari.'],
  ['0.5.0', '2026-10-17', 'Più famiglie, registrazione guidata, inviti, attivazione dei dispositivi, icone, guida, app installabile.'],
  ['0.4.0', '2026-10-17', 'Modifica dei compiti, date gg/mm/aaaa, obiettivo del giorno, versione per telefono e tablet.'],
  ['0.3.0', '2026-10-16', 'Accesso con password e PIN, pagina Setup.'],
  ['0.2.0', '2026-10-16', 'Il gioco: stelle, serie, cartellini, negozio premi.'],
  ['0.1.1', '2026-10-16', 'Passaggio a Firebase.'],
  ['0.1.0', '2026-10-16', 'Prima pagina dei compiti per Riccardo e Tommaso.'],
];

/* ---------- NOVITÀ ALL'APERTURA ----------
   Per ogni versione, le novità da mostrare nel popup: separate per i figli (kid) e per i genitori (parent).
   [icona, titolo, testo]. Se per un ruolo non ci sono novità, il popup per quel ruolo non si apre.
   Chi ha saltato più versioni vede tutte quelle che non ha ancora letto, dalla più recente. */
const NEWS = {
  '0.12.0': {
    kid: [
      ['👍', 'Compiti controllati', 'Quando mamma o papà controllano i tuoi compiti, accanto alla spunta compare <b>👍 controllato</b>: quel compito è confermato per sempre.'],
      ['🆕', 'Le novità per te', 'Ogni volta che l\'app migliora trovi qui cosa è cambiato. Spunta <b>Ho letto</b> e non la vedrai più fino alla prossima novità.'],
    ],
    parent: [
      ['📅', '"Da verificare" per giorno', 'I compiti sono divisi per giorno (Oggi, Ieri…) e poi per fascia: 🌅 Mattina, ☀️ Pomeriggio, 🌙 Sera.'],
      ['🔲', 'Una griglia da leggere con un\'occhiata', 'Compiti nelle righe, figli nelle colonne: <b>✓ con l\'orario</b> se è stato fatto, <b>—</b> se non è stato fatto. Squadra e lavoretti extra stanno in righe compatte, sotto ogni giorno.'],
      ['👍', 'Tutto ok ✓', 'Un tocco conferma tutti i compiti di un gruppo: spariscono dalla lista senza aspettare le 48 ore e <b>non si possono più contestare</b>. I ragazzi vedono 👍 controllato.'],
      ['🟨', 'Contestare con un tocco', 'Tocca la <b>✓</b> di un compito non vero: hai <b>5 secondi</b> per premere <b>Annulla</b> prima che arrivino penalità e cartellino.'],
      ['⏰', 'Filtro "In scadenza"', 'Mostra solo i gruppi con compiti che tra meno di 6 ore non potrai più contestare.'],
      ['🆕', 'Questa finestra', 'A ogni aggiornamento trovi qui le novità. Spunta <b>Ho letto</b> per non vederla più fino alla prossima versione.'],
    ],
  },
};
// confronto tra versioni "0.12.0" (negativo se a < b)
const cmpVer = (a, b) => { const x = String(a || '0').split('.').map(Number), y = String(b || '0').split('.').map(Number);
  for (let i = 0; i < 3; i++){ const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
// chi non ha mai segnato le novità come lette ha conosciuto l'app prima dei popup: le vede dalla 0.12.0
const NEWS_FIRST = '0.11.0';

/* ---------- impostazioni predefinite di una nuova famiglia ---------- */
const DEFAULTS = {
  name: 'La mia famiglia',
  times: {wake:'06:50', afternoon:'13:00', evening:'19:00', bed:'21:00'},
  categories: [
    {id:'c1', name:'Personali', color:'#8b5cf6'},
    {id:'c2', name:'Casa',      color:'#10b981'},
    {id:'c3', name:'Scuola',    color:'#f59e0b'},
  ],
  rules: {
    perfectDay:3, missed:-1, swapFavor:1,
    streak3:5, streak7:15, streak14:40, streakEveryBonus:15,
    cheatMultiplier:2, contestHours:48,
    yellowWindowDays:14, yellowsForRed:3, redDays:3,
    autoLogoutMin:10,
  },
  kids: [],
};
const RULE_FIELDS = [
  ['perfectDay','⭐ Giornata perfetta'], ['missed','⭐ Compito non fatto (negativo)'], ['swapFavor','⭐ Favore per chi accetta uno scambio'],
  ['streak3','⭐ Serie di 3 giorni'], ['streak7','⭐ Serie di 7 giorni'], ['streak14','⭐ Serie di 14 giorni'],
  ['streakEveryBonus','⭐ Ogni 7 giorni dopo i 14'], ['cheatMultiplier','Imbroglio: perde il valore ×'], ['contestHours','Ore per contestare'],
  ['yellowWindowDays','Giorni di validità di un giallo'], ['yellowsForRed','Gialli per un rosso'], ['redDays','Giorni di effetto del rosso'],
];
const KIND_DESC = {
  normal: 'Ha giorni e orario; conta per la giornata perfetta: se non fatto toglie stelle e interrompe la serie.',
  optional: 'Ha giorni e orario; dà stelle se fatto ma non conta per la giornata perfetta. Con "Collaborazione" diventa un compito di squadra.',
  board: 'Senza giorni né orario: il figlio lo segna quando lo fa; limite di volte al giorno tra i fratelli.',
  pun: 'Compito di recupero: compare solo durante il cartellino rosso, senza stelle, per rimediare.',
};
/* catalogo premi consigliato: 50 ⭐ = 1 €. [titolo, stelle, valore in euro se è un premio economico] */
const EUR_STARS = 50;
const CATALOG = [
  ['15 minuti in più di tablet o videogiochi', 20], ['Scegliere il dolce o il menu della cena', 30],
  ['Scegliere il film della sera', 40], ['Scegliere la musica in macchina per una settimana', 40],
  ['Stare alzato 30 minuti in più (venerdì o sabato)', 50], ['Colazione a letto la domenica', 60],
  ['Serata giochi da tavolo, scelgo io il gioco', 80], ['Invitare un amico a casa a giocare', 120],
  ['Pomeriggio del sì: decido io cosa fare insieme', 200], ['Pigiama party o dormire da un amico', 300],
  ['Una bustina di figurine', 50, 1], ['Gelato', 125, 2.5], ['Merenda al bar con mamma o papà', 150, 3],
  ['5 € nel salvadanaio', 250, 5], ['Fumetto o rivista a scelta', 250, 5], ['Biglietto del cinema', 400, 8],
  ['Ricarica per un gioco o un\'app', 500, 10], ['Libro a scelta', 600, 12], ['Pizza fuori con un genitore', 750, 15],
  ['Gioco o set di costruzioni a scelta', 1000, 20], ['🚲 Contributo per la bicicletta nuova', 5000, 100],
];
const KID_COLORS = ['#2563eb','#e11d48','#16a34a','#9333ea'];
const MAX_KIDS = 4;
const DAY_NAMES = ['','Lun','Mar','Mer','Gio','Ven','Sab','Dom'];

/* ---------- icone ---------- */
const TASK_ICONS = [
  ['Igiene', '🪥 😁 😊 🧼 🚿 🛁 🧴 💇 🚽 🤧'],
  ['Vestirsi', '👕 👖 🧦 👟 🧥 🎒 👓'],
  ['Camera e casa', '🛏️ 🧸 🧺 🧹 🗑️ 🪴 💡 🚪'],
  ['Cucina', '🍽️ 🍴 🥣 🧽 🥛 🍎 🥪 🧃'],
  ['Animali e piante', '🐶 🐱 🐟 🐰 🐦 🐢 🌱 💧'],
  ['Scuola', '📚 ✏️ 📖 📝 🧮 🎹 🎨 💻'],
  ['Altro', '⭐ ⚽ 🚲 🧩 🎵 🌙 ☀️ 🛒 ❤️ 🤝 ⏰ 🎯'],
];
const AVATARS = [
  ['Animali', '🦁 🐯 🐻 🐼 🦊 🐸 🐵 🐶 🐱 🐰 🐨 🐙'],
  ['Fantasia', '🦄 🐲 🦖 👾 🤖 👽 🧚 🧙'],
  ['Altro', '🚀 ⚽ 🏀 🎸 🎨 🌟 🌈 🍕 🎮 🛹'],
];
const AVATAR_LIST = AVATARS.flatMap(([,l]) => l.split(' '));
// icona suggerita dal titolo (la prima regola che corrisponde vince)
const ICON_RULES = [
  [/dent/i,'🪥'], [/faccia|viso/i,'😊'], [/man[io]\b/i,'🧼'], [/doccia/i,'🚿'], [/lavandino/i,'🧽'], [/vasca|bagnetto/i,'🛁'],
  [/capell|pettin/i,'💇'], [/pigiama|nanna|dormire/i,'🌙'], [/letto/i,'🛏️'], [/scarpe/i,'👟'], [/calz/i,'🧦'], [/vest/i,'👕'],
  [/zaino|cartella/i,'🎒'], [/compiti|studi/i,'📚'], [/legg|libro/i,'📖'], [/scriv|quaderno|diario/i,'✏️'],
  [/piano|musica|strumento|chitarra/i,'🎹'], [/apparecch|tavola/i,'🍽️'], [/sparecch/i,'🍴'], [/colazione/i,'🥣'],
  [/lavastovigl|piatti|pulir/i,'🧽'], [/camera|giochi|giocattoli|riordin/i,'🧸'], [/bucato|panni|biancheria/i,'🧺'],
  [/spazzatura|rifiuti|pattume|differenziata/i,'🗑️'], [/scopa|pavimento|spazz/i,'🧹'], [/cane/i,'🐶'], [/gatt/i,'🐱'],
  [/pesc/i,'🐟'], [/conigli/i,'🐰'], [/piant|innaff|fiori/i,'🪴'], [/spesa/i,'🛒'], [/sport|allenament|calcio|piscina/i,'⚽'],
  [/bici/i,'🚲'], [/acqua|bere/i,'💧'], [/frutta|mela/i,'🍎'], [/aiut/i,'🤝'], [/merenda/i,'🥪'],
];
const suggestIcon = title => (ICON_RULES.find(([re]) => re.test(title || '')) || [, ''])[1];
const taskIcon = t => t?.icon || suggestIcon(t?.title) || '⭐';
