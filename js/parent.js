'use strict';
/* Compiti di casa · pagina Genitori e le sue schede */

/* =====================================================================
   VISTA GENITORI
   ===================================================================== */
const dayBoxes = (sel = [1,2,3,4,5,6,7]) => [1,2,3,4,5,6,7].map(n =>
  `<label><input type="checkbox" value="${n}" ${sel.includes(n) ? 'checked' : ''}>${DAY_NAMES[n]}</label>`).join('');
const checkedDays = id => [...document.querySelectorAll(`#${id} input:checked`)].map(i => +i.value);
$('fDays').innerHTML = dayBoxes();
setDate('fStart', today());
let fIconManual = false;
const syncForm = () => {
  const existing = !!$('fTaskSel').value, kind = existing ? 'normal' : $('fKind').value;
  const noSched = kind === 'pun' || kind === 'board';
  // squadra: casella "Collaborazione" su un nuovo facoltativo, oppure un compito di squadra già esistente
  const team = existing ? isCollabTask(data.tasks[$('fTaskSel').value]) : kind === 'optional' && $('fCollab').checked;
  $('newTaskFields').hidden = existing;
  $('fExisting').hidden = !existing;
  if (existing) $('fAssign').innerHTML = schedItems(data.sched.filter(x => x.taskId === $('fTaskSel').value)
    .sort((a,b) => a.startTime.localeCompare(b.startTime))) || '';
  // più volte al giorno: una fascia per riga, ognuna con il suo orario
  const repeat = !noSched && $('fRepeat').checked;
  $('repeatBox').hidden = noSched;
  $('fSlots').hidden = !repeat;
  if (repeat && !$('fSlots').children.length) $('fSlots').innerHTML = slotPicks();
  $('fCollabBox').hidden = kind !== 'optional';
  $('fTeamBox').hidden = !team;
  if (team && !$('fTeam').children.length) $('fTeam').innerHTML = teamBoxes(kidsList().map(k => k.id));
  $('ownerBox').hidden = noSched || team; $('schedBox').hidden = noSched;
  $('timeBox').hidden = kind === 'board' || repeat;
  $('fMaxBox').hidden = kind !== 'board';
  $('fPts').disabled = kind === 'pun';
  $('fKindDesc').textContent = existing ? '' : KIND_DESC[kind];
};
$('fTaskSel').onchange = () => { $('fDup').hidden = true; syncForm(); }; $('fKind').onchange = syncForm; $('fCollab').onchange = syncForm; $('fRepeat').onchange = syncForm;
$('fEditTask').onclick = () => { const id = $('fTaskSel').value; if (id) openEdit({taskId:id, taskOnly:true}); };
// orari proposti per fascia: poco dopo la sveglia, un'ora dopo l'inizio del pomeriggio, mezz'ora prima di andare a letto
const addMin = (t, m) => { const [h, mi] = t.split(':').map(Number), x = Math.max(0, Math.min(1439, h * 60 + mi + m)); return `${String(Math.floor(x / 60)).padStart(2,'0')}:${String(x % 60).padStart(2,'0')}`; };
const SLOT_DEF = () => ({Mattina: addMin(T().wake, 20), Pomeriggio: addMin(T().afternoon, 60), Sera: addMin(T().bed, -30)});
const SLOT_LIM = () => ({Mattina: [T().wake, T().afternoon], Pomeriggio: [T().afternoon, T().evening], Sera: [T().evening, T().bed]});
const slotPicks = () => SLOTS().map(s => `<div class="slotpick"><label><input type="checkbox" data-sl="${s.name}" checked>${s.icon} ${s.name}<small>${s.range}</small></label>
  <input type="time" data-st="${s.name}" value="${SLOT_DEF()[s.name]}" min="${SLOT_LIM()[s.name][0]}" max="${SLOT_LIM()[s.name][1]}" aria-label="Orario ${s.name}"></div>`).join('');
/* compiti doppi: stesso titolo a meno di maiuscole, accenti, spazi e punteggiatura */
const normTitle = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const sameTitle = title => Object.values(data.tasks).find(t => normTitle(t.title) === normTitle(title));
$('fTitle').addEventListener('input', () => {
  const t = $('fTitle').value.trim().length > 2 && sameTitle($('fTitle').value);
  $('fDup').hidden = !t;
  if (t){
    const n = data.sched.filter(x => x.taskId === t.id).length, usable = !t.board && !t.punishment;
    $('fDup').innerHTML = `⚠️ Esiste già <b>${taskIcon(t)} ${esc(t.title)}</b>${n ? ` (${n} ${n === 1 ? 'assegnazione' : 'assegnazioni'})` : ''}. ${usable
      ? 'Conviene aggiungere un\'assegnazione a quello: così una correzione del titolo o delle stelle vale per tutte le ripetizioni.<div class="acts"><button type="button" class="btn primary" data-usetask="' + t.id + '">Usa quello esistente</button></div>'
      : 'È un ' + (t.board ? 'lavoretto extra' : 'compito di recupero') + ': scegli un titolo diverso per non confonderli.'}`;
  }
});
$('fTitle').addEventListener('input', () => { if (!fIconManual) $('fIcon').textContent = suggestIcon($('fTitle').value) || '⭐'; });
$('fIcon').onclick = () => pickIcon(TASK_ICONS, $('fIcon').textContent, ic => { $('fIcon').textContent = ic; fIconManual = true; });
const kidOpts = () => kidsList().map(k => `<option value="${k.id}">${k.avatar || ''} ${esc(k.name)}</option>`).join('');
function keepSel(id, html){ const s = $(id), cur = s.value; s.innerHTML = html; if ([...s.options].some(o => o.value === cur)) s.value = cur; }

/* schede della pagina Genitori */
let ptab = store('get', 'cdc.ptab') || 'sit';
function showPtab(k, quiet){
  if (!document.querySelector(`.psec[data-ps="${k}"]`)) k = 'sit';
  const changed = k !== ptab;
  ptab = k; store('set', 'cdc.ptab', k);
  document.querySelectorAll('#ptabs [data-pt]').forEach(b => { b.classList.toggle('on', b.dataset.pt === k); b.setAttribute('aria-selected', b.dataset.pt === k); });
  document.querySelectorAll('.psec').forEach(x => x.hidden = x.dataset.ps !== k);
  const on = document.querySelector(`#ptabs [data-pt="${k}"]`);
  if (on && (!quiet || changed)) on.scrollIntoView({block:'nearest', inline:'center'});
  if (!quiet && changed) $('ptabs').scrollIntoView({block:'nearest'});
}
$('ptabs').onclick = e => { const b = e.target.closest('[data-pt]'); if (b) showPtab(b.dataset.pt); };
// le scadenze delle verifiche si aggiornano da sole (gruppi "in scadenza", compiti non più contestabili)
setInterval(() => { if (view === 'parent' && ptab === 'ver' && !document.hidden) render(); }, 60000);
const propStars = {};
$('pProps').addEventListener('change', e => { const v = e.target.dataset.pstars; if (v) propStars[v.split('|')[1]] = +e.target.value; });
function renderParent(){
  const td = today(), r = R();
  renderTodo();
  $('pDevBanner').innerHTML = (device?.fid === fid || store('get', `cdc.devBannerOff.${fid}`) === '1' || !kidsList().length) ? '' :
    `<div class="banner info">📱 <b>I figli useranno questo dispositivo?</b> Attivalo per loro: all'apertura troveranno il loro nome e il PIN.
      <div class="acts"><button class="btn primary" data-goto="sDevice">Attiva</button> <button class="btn" data-devoff="1">È il mio telefono</button></div></div>`;
  if (!kidsList().length){
    $('pSummary').innerHTML = '<div class="empty">Nessun figlio ancora: aggiungili dalla scheda ⚙️ Setup.</div>';
  } else $('pSummary').innerHTML = kidsList().map(k => {
    const red = cardsOf(k.id).filter(c => c.type === 'red' && c.until >= td).sort((a,b) => a.from.localeCompare(b.from))[0];
    return `<div><h3 style="color:${k.color}">${k.avatar || ''} ${esc(k.name)}</h3>
      <p class="stars">⭐ ${balance(k.id)} stelle${reserved(k.id) ? ` (${reserved(k.id)} prenotate)` : ''}</p>
      <p>🔥 serie: ${data.kidState[k.id]?.streak || 0} giorni</p>
      <p>🟨 gialli attivi: ${activeYellows(k.id).length}/${r.yellowsForRed}</p>
      <p>🟥 rossi nel trimestre: ${redsInQuarter(k.id).length}</p>
      ${red ? `<p style="color:var(--minus)">Rosso ${red.effect==='nostars'?'(niente stelle)':'(compiti di recupero)'} dal ${fmtDate(red.from)} al ${fmtDate(red.until)}</p>` : ''}</div>`;
  }).join('');

  // "Da verificare": per giorno e per fascia, griglia compiti × figli (verify.js)
  const openVer = renderVerify();

  const reqs = kidsList().flatMap(k => data.pending[k.id] || []);
  $('pRedeem').innerHTML = reqs.length ? reqs.map(x => `
    <div class="row"><div class="body">${kidAvatar(x.kid)} <b>${esc(kidName(x.kid))}</b> vuole: ${esc(x.title)} <span class="stars">${x.cost} ⭐</span>
      <br><small>saldo: ${balance(x.kid)} ⭐</small></div>
      <span><button class="btn ok" data-approve="${esc(x.kid)}|${esc(x.id)}">Approva</button> <button class="btn no" data-deny="${esc(x.kid)}|${esc(x.id)}">Rifiuta</button></span></div>`).join('')
    : '<div class="empty">Nessuna richiesta</div>';

  const tasks = Object.values(data.tasks).filter(t => !t.punishment && !t.board).sort((a,b) => a.title.localeCompare(b.title));
  keepSel('fTaskSel', '<option value="">➕ Nuovo compito…</option>' +
    tasks.map(x => `<option value="${x.id}">${taskIcon(x)} ${esc(x.title)}${isCollabTask(x) ? ' · 🤝 squadra' : ''} · ${esc(catOf(x).name)} · ⭐${x.points||1}</option>`).join(''));
  syncForm();
  keepSel('fCat', fam.categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join(''));
  keepSel('fOwner', kidOpts() + (kidsList().length > 1 ? '<option value="all">Tutti</option>' : ''));
  keepSel('mKid', kidOpts());
  $('fTime').min = T().wake; $('fTime').max = T().bed;
  $('fTimeLbl').textContent = `Orario (${T().wake} – ${T().bed})`;

  const sched = data.sched.filter(s => data.tasks[s.taskId] && !data.tasks[s.taskId].punishment).sort((a,b) => a.startTime.localeCompare(b.startTime));
  const orphan = sched.filter(s => !kidById(s.owner) && !isTeamSched(s));
  const teams = sched.filter(isTeamSched);
  const dups = dupGroups();
  $('schedList').innerHTML = (dups.length ? `<div class="banner info merge">🔁 <b>Compiti con lo stesso nome.</b> Unendoli, una correzione di titolo o stelle vale per tutte le ripetizioni; lo storico delle stelle non cambia.
      ${dups.map(g => `<div class="row"><div class="body">${taskIcon(g[0])} <b>${esc(g[0].title)}</b> × ${g.length} · ${nTasks(data.sched.filter(s => g.some(t => t.id === s.taskId)))}
        <br><small>${g.map(t => `⭐${t.points || 1}`).join(' · ')}</small></div><button class="btn" data-merge="${g.map(t => t.id).join('|')}">Unisci</button></div>`).join('')}</div>` : '') +
    (sched.length ? '' : kidsList().length
      ? `<p class="empty">Ancora nessun compito.</p><button class="btn primary" id="seedBtn">Carica compiti e premi di esempio</button>`
      : `<p class="empty">Prima aggiungi i figli dal ⚙️ Setup.</p>`) +
    kidsList().map(k => { const l = sched.filter(x => x.owner === k.id);
      return `<h3 class="vkid" style="color:${k.color}">${k.avatar || ''} ${esc(k.name)} <small>${nTasks(l)}</small></h3>${schedRows(l)}`; }).join('') +
    (teams.length ? `<h3 class="vkid">🤝 Compiti di squadra <small>${nTasks(teams)}</small></h3>${schedRows(teams)}` : '') +
    (orphan.length ? `<h3 class="vkid">Assegnati a figli rimossi <small>${nTasks(orphan)}</small></h3>${schedRows(orphan)}` : '');

  // B: bacheca
  const bl = boardTasks();
  $('boardList').innerHTML = bl.length ? bl.map(t => `
    <div class="sched click" data-editpun="${t.id}"><span class="ticon" style="--c:var(--star);width:40px;height:40px;font-size:1.3rem">${taskIcon(t)}</span>
      <div class="body">${esc(t.title)} <span class="stars">⭐${t.points || 1}</span>
        <div class="sub2">al massimo ${t.maxPerDay || 1} ${(t.maxPerDay || 1) === 1 ? 'volta' : 'volte'} al giorno, tra tutti i figli</div></div>
      <div class="acts inl"><button class="btn icon" data-editpun="${t.id}" aria-label="Modifica" title="Modifica">✏️</button></div></div>`).join('')
    : '<div class="empty">Nessun lavoretto. Aggiungine con "Nuovo compito" › Tipo "Lavoretto extra in bacheca".</div>';
  // C: proposte da approvare
  const props = kidsList().flatMap(k => data.propPending[k.id] || []).sort((a,b) => ms(a.createdAt) - ms(b.createdAt));
  $('pProps').innerHTML = props.length ? props.map(p => `
    <div class="row"><div class="body">${kidAvatar(p.kid)} <b>${esc(kidName(p.kid))}</b>: ${esc(p.title)}<br><small>${fmtDate(p.date)}</small></div>
      <span><select data-pstars="${esc(p.kid)}|${esc(p.id)}" style="width:auto;min-height:38px;padding:6px" aria-label="Stelle">
        ${[1,2,3,4,5].map(n => `<option value="${n}" ${n === (propStars[p.id] || 1) ? 'selected' : ''}>⭐ ${n}</option>`).join('')}</select>
      <button class="btn ok" data-papprove="${esc(p.kid)}|${esc(p.id)}">Approva</button> <button class="btn no" data-preject="${esc(p.kid)}|${esc(p.id)}">No</button></span></div>`).join('')
    : '<div class="empty">Nessuna proposta da valutare</div>';

  const pun = Object.values(data.tasks).filter(t => t.punishment).sort((a,b) => (a.defaultTime||'').localeCompare(b.defaultTime||''));
  $('punList').innerHTML = pun.length ? pun.map(t => `
    <div class="sched click" data-editpun="${t.id}"><span class="ticon" style="--c:var(--extra);width:40px;height:40px;font-size:1.3rem">${taskIcon(t)}</span>
      <div class="body"><b>${t.defaultTime || T().evening}</b> ${esc(t.title)}
      ${t.description ? `<div class="sub2">${esc(t.description)}</div>` : ''}</div>
      <div class="acts inl"><button class="btn icon" data-editpun="${t.id}" aria-label="Modifica" title="Modifica">✏️</button></div></div>`).join('')
    : '<div class="empty">Nessun compito di recupero: dal secondo cartellino rosso del trimestre non ci sarebbe nulla da recuperare. Aggiungine con "Nuovo compito" › Tipo "Recupero".</div>';

  const missing = catalogMissing();
  $('pCatalog').innerHTML = !missing.length || store('get', `cdc.catalogOff.${fid}`) === '1' ? '' :
    `<div class="banner info">🎁 <b>Catalogo consigliato</b>: ${CATALOG.length} premi pronti, 10 senza costi e ${CATALOG.filter(c => c[2]).length} con un valore in euro (${EUR_STARS} ⭐ = 1 €), compreso il contributo per la bici.
      Puoi cambiarli o toglierli dopo.<div class="acts"><button class="btn primary" data-catalog="1">Aggiungi ${missing.length === CATALOG.length ? 'il catalogo' : `i ${missing.length} premi mancanti`}</button>
      <button class="btn" data-catoff="1">Non mi serve</button></div></div>`;
  const keepT = $('rwT')?.value, keepC = $('rwC')?.value;
  const eurTxt = x => x.eur ? ` <small style="color:var(--muted)">≈ ${x.eur.toLocaleString('it-IT', {minimumFractionDigits: x.eur % 1 ? 2 : 0})} €</small>` : '';
  $('pRewards').innerHTML = data.rewards.length ? data.rewards.slice().sort((a,b) => a.cost - b.cost).map(x => rewEdit === x.id ? `
    <div class="sched"><div class="rewedit"><input id="rwT" value="${esc(keepT ?? x.title)}" aria-label="Nome del premio">
        <input id="rwC" type="number" min="1" value="${esc(keepC ?? x.cost)}" aria-label="Costo in stelle"></div>
      <div class="acts inl"><button class="btn ok" data-rwsave="${x.id}">Salva</button> <button class="btn" data-rwcancel="1">Annulla</button>
        <button class="btn" data-rwtoggle="${x.id}">${x.active === false ? '▶️ Riattiva' : '⏸️ Sospendi'}</button> <button class="btn no" data-delrew="${x.id}">Elimina</button></div></div>` : `
    <div class="sched click ${x.active === false ? 'paused' : ''}" data-rwedit="${x.id}"><div class="body">${esc(x.title)} <span class="stars">${x.cost} ⭐</span>${eurTxt(x)}
      ${x.active === false ? '<div class="sub2">⏸️ sospeso: i figli non lo vedono nel negozio</div>' : ''}</div>
      <div class="acts inl"><button class="btn icon" data-rwedit="${x.id}" aria-label="Modifica premio" title="Modifica">✏️</button></div></div>`).join('')
    : '<div class="empty">Nessun premio</div>';
  // contatori sulle schede che richiedono un'azione
  const badge = (id, n) => { $(id).textContent = n || ''; $(id).hidden = !n; };
  badge('bVer', openVer);
  badge('bPrem', kidsList().reduce((a,k) => a + (data.pending[k.id] || []).length, 0));
  badge('bProp', kidsList().reduce((a,k) => a + (data.propPending[k.id] || []).length, 0));
  showPtab(ptab, true);
}

// orario del compito di un completamento: quello dell'assegnazione, o del compito di recupero
function compTime(c){
  const s = data.sched.find(x => x.id === c.scheduleId);
  return s?.startTime || data.tasks[c.taskId]?.defaultTime || T().evening;
}

/* primi passi */
function renderTodo(){
  const box = $('pTodo');
  if (store('get', `cdc.todoOff.${fid}`) === '1'){ box.hidden = true; return; }
  const items = [
    ['Aggiungi i figli con il loro PIN', kidsList().length > 0, 'sKids'],
    ['Controlla i compiti e i loro orari', data.sched.length > 0, 'pNew'],
    ['Prepara i premi del negozio', data.rewards.length > 0, 'pShop'],
    ['Attiva il telefono o tablet dei figli', !!fam.lastDeviceAt, 'sDevice'],
    ['Invita l\'altro genitore (facoltativo)', data.parents.length > 1, 'sParents'],
  ];
  const left = items.slice(0, 4).filter(i => !i[1]).length;
  box.hidden = false;
  if (!box.dataset.init){                       // aperta finché manca qualcosa; poi ricorda la scelta
    box.dataset.init = '1';
    const saved = store('get', `cdc.todoOpen.${fid}`);
    box.open = saved === null ? left > 0 : saved === '1';
    box.addEventListener('toggle', () => store('set', `cdc.todoOpen.${fid}`, box.open ? '1' : '0'));
  }
  box.innerHTML = `<summary><b>🚀 Primi passi</b> <span class="todocount">${4 - left} di 4 fatti${left ? '' : ' 🎉'}</span></summary>
    <ul class="todo">${items.map(([t, ok, a]) => `<li class="${ok ? 'ok' : ''}"><span class="mark">${ok ? '✓' : ''}</span><span class="t">${t}</span>
      ${ok ? '' : `<button class="btn" data-goto="${a}">Vai</button>`}</li>`).join('')}</ul>
    <div class="acts" style="margin-top:8px"><button class="btn" data-help="1">❓ Leggi la guida</button>
      <button class="btn" data-todooff="1">${left ? 'Nascondi' : '🎉 Fatto, nascondi'}</button></div>`;
}

const daysText = w => w.length === 7 ? 'Tutti i giorni' : w.slice().sort().map(n => DAY_NAMES[n]).join(' ');
const nTasks = l => `${l.length} ${l.length === 1 ? 'compito' : 'compiti'}`;
function schedRows(list){
  if (!list.length) return '<div class="empty">Nessun compito</div>';
  return bySlot(list, x => x.startTime).map(g =>
    slotHead(g, nTasks(g.items)) + `<div class="slotbox">${schedItems(g.items)}</div>`).join('');
}
function schedItems(list){
  const td = today();
  return list.map(x => { const t = data.tasks[x.taskId], cat = catOf(t); return `
    <div class="sched click ${x.active?'':'off'}" data-edit="${x.id}">
      <span class="ticon" style="--c:${cat.color};width:40px;height:40px;font-size:1.3rem">${taskIcon(t)}</span>
      <div class="body"><b>${x.startTime}</b> ${esc(t.title)} <span class="stars">⭐${t.points||1}</span>
        <div class="sub2"><span class="chip" style="--c:${cat.color}">${esc(cat.name)}</span>${isTeamSched(x) ? ` <span class="chip" style="--c:var(--star)">🤝 ${esc(listNames(x.team || []))}</span>` : t.optional ? ' <span class="chip" style="--c:var(--star)">facoltativo</span>' : ''} ${daysText(x.weekdays)}${x.startDate > td ? ' · dal ' + fmtDate(x.startDate) : ''}${x.endDate ? ' · fino al ' + fmtDate(x.endDate) : ''}${x.active ? '' : ' · ⏸️ sospeso'}</div></div>
      <div class="acts inl"><button class="btn icon" data-edit="${x.id}" aria-label="Modifica" title="Modifica">✏️</button></div>
    </div>`; }).join('') || '<div class="empty">Nessun compito</div>';
}


/* contestazione: la applica la coda di verify.js dopo i 5 secondi di "Annulla" (niente conferma qui) */
async function contest(compId){
  const c = data.verify.find(x => x.id === compId); if (!c || c.contested || c.verified) return;
  if (c.collab) return contestTeam(c);
  const t = data.tasks[c.taskId], base = t?.points || 1, kid = c.doneBy, td = today(), now = serverTimestamp(), r = R();
  const lost = (c.points || 0) + r.cheatMultiplier * base;
  // un facoltativo o un lavoretto extra falso non toglie la giornata perfetta (non ne faceva parte)
  const perfect = (t?.optional || t?.board || (c.scheduleId || '').startsWith('x-')) ? {exists: () => false}
    : await getDoc(dref('kids', kid, 'ledger', `perfect_${kid}_${c.date}`));
  const batch = writeBatch(db);
  batch.update(dref('completions', compId), {contested:true, contestedAt:now});
  batch.set(dref('kids', kid, 'ledger', `cheat_${compId}`), {kid, amount:-lost, type:'cheat', date:td, createdAt:now,
    reason:`Imbroglio: ${t?.title ?? 'compito'} (${fmtDate(c.date)})`});
  if (perfect.exists())
    batch.set(dref('kids', kid, 'ledger', `unperfect_${kid}_${c.date}`), {kid, amount:-r.perfectDay, type:'cheat', date:td, createdAt:now,
      reason:`Giornata perfetta annullata (${fmtDate(c.date)})`});
  batch.set(dref('kids', kid, 'cards', `yellow_${compId}`), {kid, type:'yellow', date:td, reason:t?.title ?? '', createdAt:now});
  let red = null;
  if (activeYellows(kid).length + 1 >= r.yellowsForRed){
    const nth = redsInQuarter(kid, td).length + 1, from = addDays(td, 1);
    red = {kid, type:'red', date:td, from, until:addDays(from, r.redDays - 1), nth, effect: nth === 1 ? 'nostars' : 'extra', createdAt:now};
    batch.set(dref('kids', kid, 'cards', `red_${kid}_${td}`), red);
  }
  batch.set(dref('kids', kid), {streak:0, ...noStarsOf(red)}, {merge:true});
  await batch.commit();
  toast(red ? `🟥 Cartellino rosso a ${kidName(kid)}!` : `🟨 Cartellino giallo a ${kidName(kid)}`);
}
// compito di squadra falso: tutti quelli che hanno confermato erano complici
async function contestTeam(c){
  const t = data.tasks[c.taskId], base = t?.points || 1, td = today(), now = serverTimestamp(), r = R();
  const team = (c.team || []).filter(k => kidById(k));
  const loss = k => collabPoints(c, k) + r.cheatMultiplier * base;
  const batch = chunkedBatch(), reds = [];
  batch.update(dref('completions', c.id), {contested:true, contestedAt:now});
  for (const kid of team){
    batch.set(dref('kids', kid, 'ledger', `cheat_${c.id}`), {kid, amount:-loss(kid), type:'cheat', date:td, createdAt:now,
      reason:`Imbroglio di squadra: ${t?.title ?? 'compito'} (${fmtDate(c.date)})`});
    batch.set(dref('kids', kid, 'cards', `yellow_${c.id}`), {kid, type:'yellow', date:td, reason:t?.title ?? '', createdAt:now});
    let red = null;
    if (activeYellows(kid).length + 1 >= r.yellowsForRed){
      const nth = redsInQuarter(kid, td).length + 1, from = addDays(td, 1);
      red = {kid, type:'red', date:td, from, until:addDays(from, r.redDays - 1), nth, effect: nth === 1 ? 'nostars' : 'extra', createdAt:now};
      batch.set(dref('kids', kid, 'cards', `red_${kid}_${td}`), red);
      reds.push(kid);
    }
    batch.set(dref('kids', kid), {streak:0, ...noStarsOf(red)}, {merge:true});
  }
  await batch.commit();
  toast(reds.length ? `🟥 Cartellino rosso a ${listNames(reds)}!` : `🟨 Cartellino giallo a ${listNames(team)}`);
}

$('parentView').addEventListener('click', async e => {
  if (e.target.closest('#rwT,#rwC')) return;
  const rw = e.target.closest('[data-rwedit]');
  if (rw){ rewEdit = rw.dataset.rwedit; render(); return $('rwT')?.focus(); }
  const row = e.target.closest('[data-edit],[data-editpun]');
  if (row) return row.dataset.edit ? openEdit({schedId:row.dataset.edit}) : openEdit({taskId:row.dataset.editpun});
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  try {
    if (d.goto){
      if (['sDevice','sKids','sParents'].includes(d.goto)) return goView('setup', d.goto);
      showPtab({pNew:'new', pShop:'prem'}[d.goto] || 'sit');
      return $(d.goto)?.scrollIntoView({behavior:'smooth', block:'start'});
    }
    if (d.help) return openHelp();
    if (d.todooff){ store('set', `cdc.todoOff.${fid}`, '1'); return render(); }
    if (d.devoff){ store('set', `cdc.devBannerOff.${fid}`, '1'); return render(); }
    if (b.id === 'seedBtn') return await seed();
    if (d.usetask){ $('fTaskSel').value = d.usetask; $('fDup').hidden = true; syncForm(); return $('fTaskSel').scrollIntoView({block:'center', behavior:'smooth'}); }
    if (d.merge) return await mergeTasks(d.merge.split('|'));
    if (d.catalog) return await loadCatalog();
    if (d.catoff){ store('set', `cdc.catalogOff.${fid}`, '1'); return render(); }
    if (d.rwcancel){ rewEdit = null; return render(); }
    if (d.rwsave){
      const title = $('rwT').value.trim(), cost = parseInt($('rwC').value, 10);
      if (!title) return toast('Scrivi il nome del premio');
      if (!(cost >= 1)) return toast('Il costo deve essere almeno 1 ⭐');
      await updateDoc(dref('rewards', d.rwsave), {title, cost}); rewEdit = null; render(); return toast('Premio aggiornato ✅');
    }
    if (d.rwtoggle){
      const x = data.rewards.find(r => r.id === d.rwtoggle); if (!x) return;
      await updateDoc(dref('rewards', x.id), {active: x.active === false}); rewEdit = null;
      return toast(x.active === false ? 'Premio di nuovo nel negozio ▶️' : 'Premio sospeso: i figli non lo vedono ⏸️');
    }
    if (d.approve){
      const [kid, id] = d.approve.split('|');
      const x = (data.pending[kid] || []).find(y => y.id === id); if (!x) return;
      const batch = writeBatch(db);
      batch.update(dref('kids', kid, 'redemptions', id), {status:'approved', respondedAt:serverTimestamp()});
      batch.set(dref('kids', kid, 'ledger', `redeem_${id}`), {kid, amount:-x.cost, type:'reward', reason:`Premio: ${x.title}`, date:today(), createdAt:serverTimestamp()});
      await batch.commit(); toast('Premio approvato 🎁');
    }
    if (d.deny){ const [kid, id] = d.deny.split('|'); await updateDoc(dref('kids', kid, 'redemptions', id), {status:'rejected', respondedAt:serverTimestamp()}); }
    if (d.delrew && confirm('Eliminare questo premio? Se vuoi solo toglierlo per un po\' usa "Sospendi".')){ await deleteDoc(dref('rewards', d.delrew)); rewEdit = null; }
    if (d.papprove){
      const [kid, id] = d.papprove.split('|');
      const p = (data.propPending[kid] || []).find(x => x.id === id); if (!p) return;
      const pts = propStars[id] || 1;
      const batch = writeBatch(db);
      batch.update(dref('kids', kid, 'proposals', id), {status:'approved', points:pts, respondedAt:serverTimestamp()});
      batch.set(dref('kids', kid, 'ledger', `prop_${id}`), {kid, amount:pts, type:'proposal', reason:`Proposta: ${p.title}`, date:p.date, createdAt:serverTimestamp()});
      await batch.commit(); toast(`+${pts} ⭐ a ${kidName(kid)} 💡`);
    }
    if (d.preject){ const [kid, id] = d.preject.split('|'); await updateDoc(dref('kids', kid, 'proposals', id), {status:'rejected', respondedAt:serverTimestamp()}); }
  } catch(err){ fail(err); }
});

$('newForm').onsubmit = async e => {
  e.preventDefault();
  const existing = $('fTaskSel').value, kind = existing ? 'normal' : $('fKind').value;
  const pun = kind === 'pun', board = kind === 'board';
  const time = $('fTime').value;
  const repeat = !pun && !board && $('fRepeat').checked;
  // gli orari da creare: uno solo, oppure uno per ogni fascia scelta (dentro i suoi limiti)
  let times = [time];
  if (repeat){
    times = [];
    for (const s of SLOTS()){
      if (!document.querySelector(`#fSlots [data-sl="${s.name}"]`)?.checked) continue;
      const v = document.querySelector(`#fSlots [data-st="${s.name}"]`).value, [lo, hi] = SLOT_LIM()[s.name];
      if (!v || v < lo || v > hi) return toast(`${s.name}: orario tra ${lo} e ${hi}`);
      times.push(v);
    }
    if (!times.length) return toast('Scegli almeno una fascia');
  } else if (!board && (!time || time < T().wake || time > T().bed)) return toast(`Orario tra ${T().wake} e ${T().bed}`);
  const weekdays = checkedDays('fDays');
  const startDate = dateVal('fStart'), endDate = dateVal('fEnd');
  const sched = !pun && !board;
  if (sched && !weekdays.length) return toast('Scegli almeno un giorno');
  if (sched && !kidsList().length) return toast('Prima aggiungi i figli dal Setup');
  if (sched && startDate === null) return toast('Data "Dal" non valida: usa gg/mm/aaaa');
  if (sched && endDate === null) return toast('Data "Al" non valida: usa gg/mm/aaaa');
  if (sched && endDate && endDate < (startDate || today())) return toast('La data "Al" è prima della data "Dal"');
  const team = existing ? isCollabTask(data.tasks[existing]) : kind === 'optional' && $('fCollab').checked;
  const teamIds = [...document.querySelectorAll('#fTeam input:checked')].map(i => i.value);
  if (team && teamIds.length < 2) return toast('Scegli almeno 2 figli per la squadra');
  try {
    let taskId = existing;
    if (!taskId){
      const title = $('fTitle').value.trim();
      if (!title) return toast('Scrivi il titolo');
      const twin = sameTitle(title);
      if (twin && !confirm(`Esiste già "${twin.title}". Crearne un altro con lo stesso nome? Le correzioni future non varrebbero per entrambi.\n\n(Annulla e usa "Usa quello esistente" per aggiungere solo un'assegnazione.)`)) return;
      const t = {title, icon:$('fIcon').textContent, description:$('fDesc').value.trim(), categoryId:$('fCat').value, points:+$('fPts').value, createdAt:serverTimestamp()};
      if (pun) Object.assign(t, {punishment:true, defaultTime:time, points:0});
      if (board) Object.assign(t, {board:true, maxPerDay:Math.min(10, Math.max(1, parseInt($('fMax').value, 10) || 1))});
      if (kind === 'optional') t.optional = true;
      if (team) t.collab = true;
      taskId = (await addDoc(col('tasks'), t)).id;
    }
    if (sched){
      const o = $('fOwner').value;
      const batch = chunkedBatch();
      const base = {taskId, weekdays, active:true, startDate:startDate || today(), endDate:endDate || null, createdAt:serverTimestamp()};
      for (const tm of times){
        if (team) batch.set(doc(col('schedule')), {...base, owner:'team', team:teamIds, startTime:tm});
        else for (const ow of (o === 'all' ? kidsList().map(k => k.id) : [o])) batch.set(doc(col('schedule')), {...base, owner:ow, startTime:tm});
      }
      await batch.commit();
    }
    toast(pun ? 'Compito di recupero salvato 🔄' : board ? 'Lavoretto aggiunto alla bacheca 🧹' : team ? `Compito di squadra per ${listNames(teamIds)} 🤝`
      : times.length > 1 ? `Compito assegnato ${times.length} volte al giorno ✅` : 'Compito assegnato ✅');
    e.target.reset(); setDate('fStart', today()); $('fTeam').innerHTML = ''; $('fSlots').innerHTML = ''; $('fDup').hidden = true;
    $('fDays').innerHTML = dayBoxes(); $('fIcon').textContent = '⭐'; fIconManual = false;
    syncForm();
  } catch(err){ fail(err); }
};
$('rewardForm').onsubmit = async e => {
  e.preventDefault();
  try { await addDoc(col('rewards'), {title:$('rTitle').value.trim(), cost:+$('rCost').value, active:true, createdAt:serverTimestamp()}); e.target.reset(); }
  catch(err){ fail(err); }
};
$('manualForm').onsubmit = async e => {
  e.preventDefault();
  const amount = parseInt($('mAmt').value, 10), kid = $('mKid').value;
  if (!amount || !kid) return toast('Scegli il figlio e un numero di stelle diverso da zero');
  try {
    await addDoc(col('kids', kid, 'ledger'), {kid, amount, type:'manual', reason:$('mReason').value.trim(), date:today(), createdAt:serverTimestamp()});
    toast(`${sign(amount)} ⭐ a ${kidName(kid)}`); e.target.reset();
  } catch(err){ fail(err); }
};

async function seed(){
  const ids = kidsList().map(k => k.id); if (!ids.length) return toast('Prima aggiungi i figli dal Setup');
  const cat = n => (fam.categories.find(c => c.name === n) || fam.categories[0]).id;
  const clamp = t => t < T().wake ? T().wake : t > T().bed ? T().bed : t;
  const ALL = [1,2,3,4,5,6,7], SCHOOL = [1,2,3,4,5], EVE = [7,1,2,3,4];
  const everyone = [
    ['Rifare il letto','Casa',1,'07:00',ALL,'🛏️'], ['Lavarsi faccia e mani','Personali',1,'07:05',ALL,'😊'],
    ['Vestirsi','Personali',1,'07:15',ALL,'👕'], ['Sparecchiare la colazione','Casa',1,'07:25',ALL,'🥣'],
    ['Controllare lo zaino','Scuola',1,'07:35',SCHOOL,'🎒'], ['Fare i compiti','Scuola',3,'15:00',SCHOOL,'📚'],
    ['Riordinare la camera','Casa',2,'18:00',ALL,'🧸'], ['Preparare lo zaino per domani','Scuola',1,'20:15',EVE,'🎒'],
    ['Doccia e pigiama','Personali',1,'20:30',ALL,'🚿'], ['Lavare i denti','Personali',1,'20:50',ALL,'🪥'],
  ];
  const single = [['Apparecchiare la tavola','Casa',2,'19:15',ALL,'🍽️',ids[0]], ['Sparecchiare la cena','Casa',2,'20:00',ALL,'🍴',ids[1 % ids.length]]];
  const punishment = [['Pulire il lavandino del bagno','17:30','🧽'], ['Svuotare la lavastoviglie','18:45','🍽️'], ['Riordinare l\'ingresso','19:30','🧹']];
  const boardEx = [['Buttare la pattumiera','Casa',2,1,'🗑️'], ['Aiutare a stendere il bucato','Casa',1,1,'🧺'], ['Dare l\'acqua alle piante','Casa',1,1,'🪴']];
  const batch = chunkedBatch(), start = today(), now = serverTimestamp();
  const add = (title, category, points, time, weekdays, icon, owners, optional) => {
    const t = doc(col('tasks'));
    batch.set(t, {title, icon, categoryId:cat(category), points, createdAt:now, ...(optional ? {optional:true} : {})});
    owners.forEach(ow => batch.set(doc(col('schedule')),
      {taskId:t.id, owner:ow, startTime:clamp(time), weekdays, active:true, startDate:start, endDate:null, createdAt:now}));
  };
  everyone.forEach(([a,b,c,d,e,f]) => add(a,b,c,d,e,f, ids));
  single.forEach(([a,b,c,d,e,f,o]) => add(a,b,c,d,e,f,[o]));
  add('Leggere un libro','Scuola',1,'20:00',SCHOOL,'📖', ids, true);          // A: facoltativo
  if (ids.length > 1){                                                          // compito di squadra
    const t = doc(col('tasks'));
    batch.set(t, {title:'Riordinare il salotto insieme', icon:'🧹', categoryId:cat('Casa'), points:2, optional:true, collab:true, createdAt:now});
    batch.set(doc(col('schedule')), {taskId:t.id, owner:'team', team:ids, startTime:clamp('18:30'), weekdays:ALL, active:true, startDate:start, endDate:null, createdAt:now});
  }
  boardEx.forEach(([title, category, points, maxPerDay, icon]) => batch.set(doc(col('tasks')),   // B: bacheca
    {title, icon, categoryId:cat(category), points, board:true, maxPerDay, createdAt:now}));
  punishment.forEach(([title, time, icon]) => batch.set(doc(col('tasks')),
    {title, icon, categoryId:cat('Casa'), points:0, punishment:true, defaultTime:clamp(time), createdAt:now}));
  if (!data.rewards.length) CATALOG.forEach(c => batch.set(doc(col('rewards')), rewardDoc(c, now)));
  await batch.commit();
  toast('Compiti e premi di esempio caricati');
}

/* ---------- premi: catalogo consigliato e modifica ---------- */
let rewEdit = null;
const rewardDoc = ([title, cost, eur], now) => ({title, cost, active:true, createdAt:now, ...(eur ? {eur} : {})});
const catalogMissing = () => CATALOG.filter(([t]) => !data.rewards.some(r => normTitle(r.title) === normTitle(t)));
async function loadCatalog(){
  const list = catalogMissing(); if (!list.length) return;
  const batch = chunkedBatch(), now = serverTimestamp();
  list.forEach(c => batch.set(doc(col('rewards')), rewardDoc(c, now)));
  await batch.commit();
  toast(`${list.length} premi aggiunti al catalogo 🎁`);
}

/* ---------- compiti doppi: gruppi con lo stesso titolo e lo stesso tipo, e la loro unione ---------- */
function dupGroups(){
  const m = new Map();
  for (const t of Object.values(data.tasks)){
    const k = `${kindOf(t)}|${t.collab ? 1 : 0}|${normTitle(t.title)}`;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(t);
  }
  return [...m.values()].filter(g => g.length > 1);
}
async function mergeTasks(ids){
  const ts = ids.map(id => data.tasks[id]).filter(Boolean); if (ts.length < 2) return;
  const count = t => data.sched.filter(s => s.taskId === t.id).length;
  // si tiene quello con più assegnazioni (a parità, il più vecchio)
  const keep = ts.slice().sort((a,b) => count(b) - count(a) || ms(a.createdAt) - ms(b.createdAt))[0];
  const rest = ts.filter(t => t !== keep), restIds = new Set(rest.map(t => t.id));
  const moved = data.sched.filter(s => restIds.has(s.taskId));
  if (!confirm(`Unire ${ts.length} compiti "${keep.title}" in uno solo?\n\n${moved.length === 1 ? 'L\'assegnazione spostata prende' : `Le ${moved.length} assegnazioni spostate prendono`} titolo, icona, descrizione e stelle (⭐${keep.points || 1}) di quello tenuto. Lo storico delle stelle non cambia.`)) return;
  const batch = chunkedBatch();
  moved.forEach(s => batch.update(dref('schedule', s.id), {taskId: keep.id}));
  // i compiti spuntati di recente restano verificabili sotto il compito tenuto
  data.verify.filter(c => restIds.has(c.taskId)).forEach(c => batch.update(dref('completions', c.id), {taskId: keep.id}));
  rest.forEach(t => batch.delete(dref('tasks', t.id)));
  await batch.commit();
  toast(`Uniti in "${keep.title}" ✅`);
}
