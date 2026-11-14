'use strict';
/* Compiti di casa · medaglie 🏅, il mio obiettivo 🎯 (0.16.0) */

/* =====================================================================
   MEDAGLIE
   32 traguardi, 8 per area. Si vincono una volta sola, non danno stelle e non si perdono.
   Le assegna solo l'app, dal dispositivo di un genitore (come i conti di fine giornata):
   un documento per medaglia in kids/{kid}/medals/{id}; il figlio le legge e segna solo "vista".
   Ogni medaglia dice quali numeri le servono: si calcolano solo quelli delle medaglie non ancora vinte.
   ===================================================================== */
const MEDAL_AREAS = [
  ['costanza', '✅ Costanza'], ['onesta', '🤝 Onestà e fiducia'],
  ['insieme', '🤗 Cooperazione e iniziativa'], ['guadagni', '💰 Gestione dei guadagni'],
];
const dayDiff = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5);
// il periodo più lungo, in giorni, tra una data e la successiva
const gapMax = pts => pts.reduce((g, p, i) => i ? Math.max(g, dayDiff(pts[i - 1], p)) : 0, 0);
const p2 = n => String(n).padStart(2, '0');
// un trimestre di calendario già finito, cominciato (al più tardi nel primo mese) e senza cartellini rossi
function cleanQuarter(first, reds, td){
  let [y, m] = first.split('-').map(Number), q = Math.floor((m - 1) / 3);
  for (;; q++){
    if (q > 3){ q = 0; y++; }
    const sm = q * 3 + 1, start = `${y}-${p2(sm)}-01`, next = q === 3 ? `${y + 1}-01-01` : `${y}-${p2(sm + 3)}-01`;
    if (next > td) return false;
    if (first < `${y}-${p2(sm + 1)}-01` && !reds.some(d => d >= start && d < next)) return true;
  }
}
const bestStreakOf = ks => Math.max(ks.bestStreak || 0, ks.streak || 0);
const cardFree = async (c, days, onlyRed) => {
  if (!c.ks.firstDay) return false;
  const dates = c.cards.filter(x => !onlyRed || x.type === 'red').map(x => x.date).filter(d => d >= c.ks.firstDay).sort();
  return gapMax([c.ks.firstDay, ...dates, c.td]) >= days;
};
const tasksDone = async c => (await c.stat('nTask')) + (await c.stat('nCollab')) - c.cards.filter(x => x.type === 'yellow').length;

// [codice, icona, nome, area, come si vince, prova]
const MEDALS = [
  ['perfect1', '🌟', 'Prima giornata perfetta', 'costanza', 'Fai la tua prima giornata perfetta', async c => bestStreakOf(c.ks) >= 1 || await c.stat('nPerfect') >= 1],
  ['streak7',  '📅', 'Settimana perfetta',      'costanza', '7 giornate perfette di fila', async c => bestStreakOf(c.ks) >= 7],
  ['streak14', '🔥', 'Due settimane di fuoco',  'costanza', '14 giornate perfette di fila', async c => bestStreakOf(c.ks) >= 14],
  ['streak30', '🏆', 'Mese perfetto',           'costanza', '30 giornate perfette di fila', async c => bestStreakOf(c.ks) >= 30],
  ['tasks100', '💯', 'Cento compiti',           'costanza', '100 compiti fatti', async c => await tasksDone(c) >= 100],
  ['tasks500', '🎖️', 'Cinquecento compiti',     'costanza', '500 compiti fatti', async c => await tasksDone(c) >= 500],
  ['morning7', '🌅', 'Mattiniero',              'costanza', '7 giorni di fila con tutti i compiti della mattina fatti', async c => (c.ks.mornBest || 0) >= 7],
  ['month20',  '📆', 'Un mese da campione',     'costanza', '20 giornate perfette nello stesso mese', async c => (c.ks.perfMonthBest || 0) >= 20],

  ['checked1',  '👍', 'Primo «controllato»',   'onesta', 'Mamma o papà confermano un tuo compito con «Tutto ok»', async c => await c.stat('nVerified') >= 1],
  ['checked50', '🛡️', 'Parola d\'oro',          'onesta', '50 compiti confermati da mamma o papà', async c => await c.stat('nVerified') >= 50],
  ['clean30',   '🕊️', 'Un mese pulito',         'onesta', '30 giorni senza cartellini', c => cardFree(c, 30)],
  ['clean90',   '💎', 'Fiducia totale',         'onesta', '90 giorni senza cartellini', c => cardFree(c, 90)],
  ['comeback',  '🌈', 'Ripartenza',             'onesta', 'Dopo un cartellino rosso, 7 giornate perfette di fila', async c => !!c.ks.comeback],
  ['recovered', '🔄', 'Rimediato',              'onesta', 'Fai tutti i compiti di recupero di un cartellino rosso', async c => !!c.ks.punDone],
  ['quarter',   '🧭', 'Trimestre senza rossi',  'onesta', 'Un trimestre intero senza cartellini rossi',
    async c => !!c.ks.firstDay && cleanQuarter(c.ks.firstDay, c.cards.filter(x => x.type === 'red').map(x => x.date), c.td)],
  ['year',      '👑', 'Un anno d\'oro',         'onesta', 'Un anno senza cartellini rossi', c => cardFree(c, 365, true)],

  ['swap1',   '🤲', 'Primo favore',           'insieme', 'Accetta di fare un compito al posto di un fratello', async c => await c.stat('nSwaps') >= 1],
  ['swap10',  '💪', 'Buon fratello',          'insieme', '10 scambi accettati', async c => await c.stat('nSwaps') >= 10],
  ['team1',   '👥', 'Prima squadra',          'insieme', 'Completa il tuo primo compito di squadra', async c => await c.stat('nCollab') >= 1],
  ['team20',  '🧩', 'Squadra affiatata',      'insieme', '20 compiti di squadra completati', async c => await c.stat('nCollab') >= 20],
  ['idea1',   '💡', 'Prima idea',             'insieme', 'Una tua proposta viene approvata', async c => await c.stat('nProposal') >= 1],
  ['idea10',  '🌱', 'Sempre un\'idea',        'insieme', '10 proposte approvate', async c => await c.stat('nProposal') >= 10],
  ['board1',  '🧹', 'Primo lavoretto extra',  'insieme', 'Fai il tuo primo lavoretto extra', async c => await c.stat('nBoard') >= 1],
  ['board50', '🦸', 'Super aiutante',         'insieme', '50 lavoretti extra', async c => await c.stat('nBoard') >= 50],

  ['prize1',     '🎁', 'Primo premio',          'guadagni', 'Ottieni il tuo primo premio', async c => ((await c.stat('rewards')) || []).length >= 1],
  ['bal200',     '🐷', 'Salvadanaio',           'guadagni', 'Arriva ad avere 200 ⭐ tutte insieme', async c => await c.stat('bal') >= 200],
  ['earned100',  '🪐', 'Primo pianeta',         'guadagni', 'Guadagna 100 ⭐ in tutto', async c => await c.stat('earned') >= 100],
  ['earned1000', '🌌', 'Prima galassia',        'guadagni', 'Guadagna 1.000 ⭐ in tutto', async c => await c.stat('earned') >= 1000],
  ['wait30',     '⏳', 'So aspettare',          'guadagni', '30 giorni senza spendere stelle, con il salvadanaio pieno', async c => {
    if (!c.ks.firstDay || !(await c.stat('bal') > 0)) return false;
    const spent = ((await c.stat('rewards')) || []).map(r => r.date).filter(d => d >= c.ks.firstDay).sort();
    return gapMax([c.ks.firstDay, ...spent, c.td]) >= 30; }],
  ['goal',       '🎯', 'Obiettivo raggiunto',   'guadagni', 'Raggiungi il premio che hai scelto come obiettivo', async c => {
    const g = c.ks.goal; if (!g) return false;
    const cost = data.rewards.find(r => r.id === g.rewardId)?.cost ?? g.cost;
    return (await c.stat('bal')) !== null && (await c.stat('bal')) - reserved(c.k) >= cost; }],
  ['prize1000',  '🚲', 'Grande traguardo',      'guadagni', 'Ottieni un premio da almeno 1.000 ⭐', async c => ((await c.stat('rewards')) || []).some(r => r.amount <= -1000)],
  ['bal2000',    '🏦', 'Risparmiatore esperto', 'guadagni', 'Arriva ad avere 2.000 ⭐ tutte insieme', async c => await c.stat('bal') >= 2000],
].map(([id, icon, name, area, how, test]) => ({id, icon, name, area, how, test}));
const MEDAL_BY = Object.fromEntries(MEDALS.map(m => [m.id, m]));
const medalsOf = k => (data.medals[k] || []).filter(m => MEDAL_BY[m.id]);

/* ---------- il significato di ogni medaglia, per il popup che si apre toccandola ---------- */
const MEDAL_AREA_INFO = {
  costanza: 'Fare la propria parte ogni giorno, anche quando non se ne ha voglia.',
  onesta:   'Dire le cose come stanno, così mamma e papà possono fidarsi di te.',
  insieme:  'Aiutare gli altri e avere idee per rendere la casa un posto migliore.',
  guadagni: 'Imparare a usare bene le stelle: guadagnare, risparmiare, scegliere.',
};
const MEDAL_WHY = {
  perfect1:  'Una giornata perfetta vuol dire che hai fatto tutti i tuoi compiti, senza dimenticarne nessuno. È il primo passo: hai visto che ce la puoi fare.',
  streak7:   'Una settimana intera senza saltare niente. Ripetere le cose ogni giorno le trasforma in abitudini, e le abitudini poi diventano facili.',
  streak14:  'Due settimane di fila: ormai i compiti fanno parte delle tue giornate. Questa è la costanza vera.',
  streak30:  'Un mese intero senza un giorno storto. Pochi ci riescono: vuol dire che sei affidabile, sempre.',
  tasks100:  'Cento volte hai dato una mano in casa. Ogni compito è piccolo, ma messi insieme fanno una grande differenza per tutta la famiglia.',
  tasks500:  'Cinquecento compiti! È il segno di chi la sua parte la fa da tanto tempo, giorno dopo giorno.',
  morning7:  'Fare subito le cose del mattino rende tutta la giornata più leggera, per te e per gli altri. Per sette giorni di fila hai iniziato col piede giusto.',
  month20:   'Venti giornate perfette in un mese: anche se qualche giorno è andato storto, hai ripreso subito il ritmo.',
  checked1:  'Mamma o papà hanno controllato un tuo compito e hanno visto che era fatto davvero bene. Dire «fatto» solo quando è vero è la base della fiducia.',
  checked50: 'Cinquanta volte la tua parola è stata confermata. Quando dici «fatto», gli altri sanno che possono crederci.',
  clean30:   'Un mese senza cartellini: niente compiti segnati e non fatti, niente scorciatoie. La fiducia si costruisce così, un giorno alla volta.',
  clean90:   'Tre mesi senza cartellini. Mamma e papà sanno di potersi fidare di te: è una cosa preziosa, come un diamante.',
  comeback:  'Sbagliare capita a tutti. Questa medaglia premia chi dopo un cartellino rosso non si arrende e si rimette subito in pista.',
  recovered: 'Hai fatto tutti i compiti di recupero di un cartellino rosso. Rimediare a un errore è il modo più bello di chiedere scusa.',
  quarter:   'Tre mesi di calendario senza cartellini rossi: un periodo lungo in cui hai sempre giocato pulito.',
  year:      'Un anno intero senza cartellini rossi. È la medaglia della fiducia più grande: te la sei guadagnata giorno dopo giorno.',
  swap1:     'Hai fatto un compito al posto di tuo fratello o tua sorella. In famiglia ci si dà una mano, e la prima volta conta tantissimo.',
  swap10:    'Dieci volte hai detto di sì quando qualcuno aveva bisogno. Essere disponibili è una cosa che gli altri ricordano.',
  team1:     'Un compito di squadra si porta a termine solo insieme: bisogna organizzarsi, dividersi il lavoro e fidarsi l\'uno dell\'altro.',
  team20:    'Venti compiti di squadra: avete imparato a lavorare insieme. E quando si lavora in squadra, nessuno resta indietro.',
  idea1:     'Hai proposto un compito e mamma o papà l\'hanno approvato. Vedere cosa c\'è da fare, senza che te lo dicano, si chiama iniziativa.',
  idea10:    'Dieci idee approvate: hai occhio per quello che serve in casa e il coraggio di proporlo.',
  board1:    'Un lavoretto extra non è obbligatorio: l\'hai scelto tu. È il primo passo per capire che ci si può dare da fare anche di propria iniziativa.',
  board50:   'Cinquanta lavoretti extra! Quando c\'è bisogno di aiuto, tu ci sei.',
  prize1:    'Hai trasformato il tuo impegno in qualcosa che volevi. Le stelle servono proprio a questo: guadagnarsi le cose con il proprio lavoro.',
  bal200:    'Avere 200 stelle insieme vuol dire che non le hai spese subito. Mettere da parte è il primo segreto di chi sa gestire i propri guadagni.',
  earned100: 'Le tue prime 100 stelle guadagnate: un pianeta intero, fatto con il tuo impegno.',
  earned1000:'Mille stelle guadagnate in tutto: una galassia! Ogni stella è un compito fatto, una per una.',
  wait30:    'Per trenta giorni avevi stelle da spendere e hai deciso di aspettare. Saper aspettare permette di arrivare a premi più grandi.',
  goal:      'Avevi scelto un obiettivo e l\'hai raggiunto. Scegliere una meta e risparmiare fino ad arrivarci è una cosa da grandi.',
  prize1000: 'Un premio da almeno mille stelle richiede tanto tempo e tanta pazienza. Te lo sei guadagnato tutto.',
  bal2000:   'Duemila stelle messe da parte: sai risparmiare davvero. Con questa pazienza potrai arrivare dove vuoi.',
};

function showMedalInfo(id){
  const m = MEDAL_BY[id]; if (!m) return;
  const won = medalsOf(owner).find(x => x.id === id);
  const area = MEDAL_AREAS.find(([a]) => a === m.area)?.[1] || '';
  $('medalInfoHead').innerHTML = `<span class="mbig ${won ? 'won' : ''}" aria-hidden="true">${m.icon}</span>${esc(m.name)}`;
  $('medalInfoBody').innerHTML = `
    <p class="marea-chip">${esc(area)} <small>· ${esc(MEDAL_AREA_INFO[m.area] || '')}</small></p>
    <h3>Perché conta</h3><p>${esc(MEDAL_WHY[id] || '')}</p>
    <h3>Come si vince</h3><p>${esc(m.how)}.</p>
    <p class="mstatus ${won ? 'won' : ''}">${won ? `🏅 Conquistata il ${fmtDate(won.wonAt)}` : '🔒 Non ancora conquistata: si vince una volta sola e poi resta per sempre.'}</p>`;
  $('medalInfoDlg').showModal();
}
$('medalList').addEventListener('click', e => {
  const b = e.target.closest('[data-medal]'); if (b) showMedalInfo(b.dataset.medal);
});
$('medalInfoDlg').addEventListener('close', () => maybeShowMedals());

/* ---------- i numeri: conteggi fatti dal server (una lettura ciascuno), mai tutto lo storico ---------- */
const cntOf = async q => (await getAggregateFromServer(q, {n: count()})).data().n;
const ledgerType = (k, t) => query(col('kids', k, 'ledger'), where('type', '==', t));
const MEDAL_STATS = {
  nTask:     k => cntOf(ledgerType(k, 'task')),
  nCollab:   k => cntOf(ledgerType(k, 'collab')),
  nPerfect:  k => cntOf(ledgerType(k, 'perfect')),
  nProposal: k => cntOf(ledgerType(k, 'proposal')),
  nVerified: k => cntOf(query(col('completions'), where('doneBy', '==', k), where('verified', '==', true))),
  nBoard:    k => cntOf(query(col('completions'), where('doneBy', '==', k), where('board', '==', true))),
  nSwaps:    k => cntOf(query(col('swaps'), where('toOwner', '==', k), where('status', '==', 'accepted'))),
  earned:    async k => (await getAggregateFromServer(query(col('kids', k, 'ledger'), where('amount', '>', 0)), {t: sum('amount')})).data().t || 0,
  bal:       async k => (await getAggregateFromServer(col('kids', k, 'ledger'), {t: sum('amount')})).data().t || 0,
  rewards:   async k => (await getDocs(ledgerType(k, 'reward'))).docs.map(d => d.data()),   // pochi: uno per premio ottenuto
};

/* ---------- progressi che si contano giorno per giorno, alla chiusura dei giorni (game.js) ---------- */
function medalProgress(d){
  return {bestStreak: bestStreakOf(d), mornStreak: d.mornStreak || 0, mornBest: d.mornBest || 0,
          perfMonth: d.perfMonth || '', perfMonthN: d.perfMonthN || 0, perfMonthBest: d.perfMonthBest || 0,
          comeback: !!d.comeback, punOk: d.punOk ?? null, punDone: !!d.punDone, init: !!d.medalInit};
}
// ok = chiavi dei compiti obbligatori fatti quel giorno; perfectEntry = è stata scritta la giornata perfetta
function medalDay(st, kid, ds, items, ok, streak, perfectEntry){
  st.bestStreak = Math.max(st.bestStreak, streak);
  const morn = items.filter(i => !i.pun && slotOf(i.time) === 'Mattina');
  if (morn.length){ st.mornStreak = morn.every(i => ok.has(i.key)) ? st.mornStreak + 1 : 0; st.mornBest = Math.max(st.mornBest, st.mornStreak); }
  if (perfectEntry && st.init){            // prima del primo calcolo sullo storico ci pensa medalBackfill
    const ym = ds.slice(0, 7);
    if (ym !== st.perfMonth){ st.perfMonth = ym; st.perfMonthN = 0; }
    st.perfMonthBest = Math.max(st.perfMonthBest, ++st.perfMonthN);
  }
  if (streak >= 7 && cardsOf(kid).some(c => c.type === 'red' && c.date <= ds)) st.comeback = true;   // il rosso azzera la serie
  const red = redOn(kid, ds);
  if (red?.effect === 'extra'){
    const pun = items.filter(i => i.pun);
    if (ds === red.from) st.punOk = true;
    if (!pun.length || !pun.every(i => ok.has(i.key))) st.punOk = false;
    if (ds === red.until && st.punOk === true) st.punDone = true;
  }
}
const medalFields = ({init, ...st}) => st;

/* ---------- primo avvio: i progressi ricavabili dallo storico (una volta per figlio) ---------- */
async function medalBackfill(k, ks){
  const [st, pf] = await Promise.all([getDocs(ledgerType(k, 'streak')), getDocs(ledgerType(k, 'perfect'))]);
  let best = bestStreakOf(ks);
  st.docs.forEach(d => { const m = /Serie di (\d+) giorni/.exec(d.data().reason || ''); best = Math.max(best, d.data().n || 0, m ? +m[1] : 0); });
  const byMonth = {};
  pf.docs.forEach(d => { const ym = (d.data().date || '').slice(0, 7); byMonth[ym] = (byMonth[ym] || 0) + 1; });
  const last = Object.keys(byMonth).sort().pop() || '';
  const upd = {bestStreak: best, perfMonth: last, perfMonthN: byMonth[last] || 0, perfMonthBest: Math.max(0, ...Object.values(byMonth)), medalInit: 1};
  await setDoc(dref('kids', k), upd, {merge: true});
  return upd;
}
async function medalFirstDay(k){
  const s = await getDocs(query(col('kids', k, 'ledger'), orderBy('createdAt', 'asc'), limit(1)));
  const firstDay = s.docs[0]?.data().date;
  if (!firstDay || !/^\d{4}-\d{2}-\d{2}$/.test(firstDay)) return {};
  await setDoc(dref('kids', k), {firstDay}, {merge: true});
  return {firstDay};
}

/* ---------- assegnazione ---------- */
async function checkMedalsFor(k){
  if (!loaded['medals_' + k] || !loaded['cards_' + k]) return;
  const todo = MEDALS.filter(m => !medalsOf(k).some(x => x.id === m.id));
  if (!todo.length) return;
  const ks = (await getDoc(dref('kids', k))).data() || {};
  if (!ks.medalInit) Object.assign(ks, await medalBackfill(k, ks));
  if (!ks.firstDay) Object.assign(ks, await medalFirstDay(k));
  const memo = {};
  const stat = name => memo[name] ??= MEDAL_STATS[name](k).catch(e => { console.warn('Medaglie: numero non disponibile', name, e); return null; });
  const c = {k, ks, td: today(), cards: cardsOf(k), stat};
  const won = [];
  for (const m of todo){
    try { if (await m.test(c)) won.push(m.id); } catch(e){ console.warn('Medaglia non valutata', m.id, e); }
  }
  if (!won.length) return;
  const batch = chunkedBatch(), now = serverTimestamp();
  // merge: se un altro genitore l'ha appena assegnata, non si perde il "vista" del figlio
  won.forEach(id => batch.set(dref('kids', k, 'medals', id), {kid: k, wonAt: c.td, source: 'app', createdAt: now}, {merge: true}));
  await batch.commit();
}
// al massimo ogni 6 ore, oppure subito (force) dopo la chiusura di un giorno o l'approvazione di un premio o di una proposta
let medalBusy = false, medalsOff = false;      // medalsOff: regole 0.16.0 non ancora pubblicate
async function checkMedals(force, only){
  if (!isParent() || medalBusy || medalsOff || !fid) return;
  const key = `cdc.medalChk.${fid}`, last = Number(store('get', key)) || 0;
  if (!force && Date.now() - last < 6 * 3600e3) return;
  medalBusy = true;
  try {
    for (const k of kidsList()) if (!only || only === k.id) await checkMedalsFor(k.id);
    if (!only) store('set', key, String(Date.now()));
  } catch(e){ console.warn('Medaglie rimandate (offline?)', e); }
  finally { medalBusy = false; }
}
const medalTimers = {};
function medalSoon(kid){ clearTimeout(medalTimers[kid]); medalTimers[kid] = setTimeout(() => checkMedals(true, kid), 1500); }

/* ---------- bacheca "Le mie medaglie" ---------- */
function renderMedals(){
  const won = Object.fromEntries(medalsOf(owner).map(m => [m.id, m]));
  const n = Object.keys(won).length;
  if (medalsOff){ $('medalList').innerHTML = '<div class="empty">Le medaglie arrivano tra poco: mamma o papà devono completare l\'aggiornamento.</div>'; return; }
  $('medalList').innerHTML = `<p class="hint">${n ? `${n} su ${MEDALS.length} conquistate` : `Ancora nessuna medaglia: la prima è vicina!`}.
      Le medaglie si vincono una volta sola e restano tue per sempre. Arrivano quando mamma o papà aprono l'app. Tocca una medaglia per scoprire cosa significa.</p>` +
    MEDAL_AREAS.map(([a, title]) => {
      const list = MEDALS.filter(m => m.area === a);
      return `<h3 class="marea">${title} <small>${list.filter(m => won[m.id]).length}/${list.length}</small></h3>
        <div class="mgrid">${list.map(m => `<button type="button" class="medal ${won[m.id] ? 'won' : ''}" data-medal="${m.id}"
          aria-label="${esc(m.name)}: ${won[m.id] ? 'conquistata' : 'da conquistare'}. Tocca per sapere cosa significa">
          <span class="mic" aria-hidden="true">${m.icon}</span><b>${esc(m.name)}</b>
          <small>${won[m.id] ? `vinta il ${fmtDate(won[m.id].wonAt)}` : esc(m.how)}</small></button>`).join('')}</div>`;
    }).join('');
}
// riga per la Situazione dei genitori
function medalLine(k){
  const won = medalsOf(k);
  return `<p>🏅 medaglie: ${won.length}/${MEDALS.length}${won.length ? ` <span class="mrow" aria-hidden="true">${won.map(m => MEDAL_BY[m.id].icon).join('')}</span>` : ''}</p>`;
}

/* ---------- festa: il figlio vede in un solo popup le medaglie non ancora viste ---------- */
let medalShown = [];
function maybeShowMedals(){
  if (me?.role !== 'kid' || !fam || document.querySelector('dialog[open]')) return;
  const fresh = medalsOf(me.kidId).filter(m => !m.seenAt && !medalShown.includes(m.id));
  if (!fresh.length) return;
  medalShown = medalShown.concat(fresh.map(m => m.id));
  $('medalHead').textContent = fresh.length === 1 ? '🏅 Hai vinto una medaglia!' : `🏅 Hai conquistato ${fresh.length} medaglie!`;
  $('medalBody').innerHTML = fresh.map(m => MEDAL_BY[m.id]).map(m =>
    `<div class="nitem"><span class="nic" aria-hidden="true">${m.icon}</span><div><b>${esc(m.name)}</b><p>${esc(m.how)}</p></div></div>`).join('') +
    `<p class="hint">Le trovi tutte nella scheda <b>🏅 Medaglie</b>.</p>`;
  $('medalDlg').dataset.ids = fresh.map(m => m.id).join('|');
  $('medalDlg').showModal();
}
$('medalDlg').addEventListener('close', async () => {
  const ids = ($('medalDlg').dataset.ids || '').split('|').filter(Boolean), kid = me?.kidId;
  if (kid && me.role === 'kid'){
    try { const b = writeBatch(db); ids.forEach(id => b.update(dref('kids', kid, 'medals', id), {seenAt: serverTimestamp()})); await b.commit(); }
    catch(e){ console.warn('Medaglie viste: non salvato', e); }
  }
  maybeShowNews();
});

/* =====================================================================
   IL MIO OBIETTIVO 🎯
   Il figlio sceglie nel Negozio un premio che non può ancora permettersi: kids/{kid}.goal = {rewardId, title, cost, setAt}.
   Titolo e prezzo sono copiati: se il premio viene sospeso o eliminato l'obiettivo resta. Il prezzo segue il catalogo.
   ===================================================================== */
const goalOf = k => data.kidState[k]?.goal || null;
function goalInfo(k){
  const g = goalOf(k); if (!g) return null;
  const r = data.rewards.find(x => x.id === g.rewardId);
  const cost = r ? r.cost : g.cost, title = r ? r.title : g.title;
  const reqs = isParent() ? (data.pending[k] || []) : (data.redemptions[k] || []).filter(x => x.status === 'pending');
  const requested = reqs.some(x => x.rewardId === g.rewardId);
  const avail = balance(k) - reserved(k);
  const have = requested ? cost : Math.max(0, Math.min(avail, cost));
  return {g, r, cost, title, requested, have, pct: cost > 0 ? Math.round(have / cost * 100) : 100,
          reached: requested || avail >= cost, off: !r || r.active === false, priceWas: r && r.cost !== g.cost ? g.cost : null};
}
function renderTarget(){
  const el = $('target'), i = goalInfo(owner);
  if (!i){ el.innerHTML = ''; return; }
  const kidMode = !isParent();
  const notes = [];
  if (i.requested) notes.push('⏳ Hai chiesto il tuo obiettivo: ora aspetta la risposta di mamma o papà.');
  else if (i.off) notes.push('⏸️ Per ora questo premio non è nel negozio: il tuo obiettivo resta, ma non si può ancora richiedere. Se vuoi, scegline un altro dal 🎁 Negozio.');
  else if (i.reached) notes.push('🎉 Hai raggiunto il tuo obiettivo! Ora puoi richiederlo.');
  if (i.priceWas !== null) notes.push(`ℹ️ Il prezzo del tuo obiettivo è cambiato: prima era ${starsTxt(i.priceWas)}.`);
  el.innerHTML = `<div class="goal target ${i.reached ? 'win' : ''}" style="--k:${kidColor(owner)}">
    <div class="gtop"><b>🎯 ${kidMode ? 'Il mio obiettivo' : 'Obiettivo'}: ${esc(i.title)}</b><span class="pct">${i.pct}%</span></div>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${i.cost}" aria-valuenow="${i.have}"><div class="fill" style="width:${i.pct}%"></div></div>
    <div class="gsub"><span class="stars">${starsTxt(i.have)} su ${starsTxt(i.cost)}</span>
      ${i.reached ? '' : `<span>ne mancano ${starsTxt(i.cost - i.have)}</span>`}</div>
    ${notes.map(n => `<div class="gnext">${n}</div>`).join('')}
    ${kidMode ? `<div class="acts" style="margin-top:8px">${i.reached && !i.requested && !i.off ? `<button class="btn ok" data-goalreq="1">🎁 Richiedilo ora</button> ` : ''}
      ${i.requested ? '' : `<button class="btn" data-goaldel="1">Togli l'obiettivo</button>`}</div>` : ''}</div>`;
  // festa una volta sola, sul dispositivo del figlio
  if (kidMode && i.reached && !i.requested && !i.off && data.balance[owner] != null){
    const key = `cdc.goalWin.${fid}.${owner}`, mark = `${i.g.rewardId}|${ms(i.g.setAt)}`;
    if (store('get', key) !== mark){ store('set', key, mark); toast('Hai raggiunto il tuo obiettivo! 🎉'); }
  }
}
// riga per la Situazione dei genitori
function goalLine(k){
  const i = goalInfo(k);
  return i ? `<p>🎯 obiettivo: ${esc(i.title)} · ${starsTxt(i.have)} su ${starsTxt(i.cost)}${i.requested ? ' (richiesto)' : i.off ? ' (premio sospeso)' : ''}</p>` : '';
}
async function requestReward(r){
  if (isParent()) return toast('I premi li chiedono i figli dal loro accesso');
  if (!r || r.active === false) return toast('Questo premio per ora non è nel negozio');
  if (balance(owner) - reserved(owner) < r.cost) return toast('Stelle insufficienti');
  if (!confirm(`Vuoi chiedere "${r.title}" per ${starsTxt(r.cost)}?\nLe stelle restano prenotate finché mamma o papà rispondono.`)) return;
  await addDoc(col('kids', owner, 'redemptions'), {kid:owner, rewardId:r.id, title:r.title, cost:r.cost, status:'pending', createdAt:serverTimestamp()});
  toast('Richiesta inviata a mamma e papà 🎁');
}
async function setGoal(r){
  if (isParent()) return toast('L\'obiettivo lo sceglie il figlio dal suo accesso');
  if (!r) return;
  const cur = goalInfo(owner);
  if (!confirm(`Vuoi scegliere "${r.title}" (${starsTxt(r.cost)}) come tuo obiettivo?` + (cur ? `\nPrende il posto di "${cur.title}".` : ''))) return;
  await setDoc(dref('kids', owner), {goal: {rewardId:r.id, title:r.title, cost:r.cost, setAt:serverTimestamp()}}, {merge:true});
  toast('Obiettivo scelto 🎯 Lo vedi in alto, con i tuoi progressi');
}
$('target').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  try {
    if (b.dataset.goalreq) await requestReward(goalInfo(owner)?.r);
    if (b.dataset.goaldel && confirm('Vuoi togliere il tuo obiettivo? Le tue stelle non cambiano.')){
      await setDoc(dref('kids', owner), {goal: null}, {merge:true});
      toast('Obiettivo tolto');
    }
  } catch(err){ fail(err); }
});
