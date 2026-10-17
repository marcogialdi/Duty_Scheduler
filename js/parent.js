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
  $('fCollabBox').hidden = kind !== 'optional';
  $('fTeamBox').hidden = !team;
  if (team && !$('fTeam').children.length) $('fTeam').innerHTML = teamBoxes(kidsList().map(k => k.id));
  $('ownerBox').hidden = noSched || team; $('schedBox').hidden = noSched;
  $('timeBox').hidden = kind === 'board';
  $('fMaxBox').hidden = kind !== 'board';
  $('fPts').disabled = kind === 'pun';
  $('fKindDesc').textContent = existing ? '' : KIND_DESC[kind];
};
$('fTaskSel').onchange = syncForm; $('fKind').onchange = syncForm; $('fCollab').onchange = syncForm;
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
// le scadenze delle verifiche si aggiornano da sole
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

  $('pVerifyHint').textContent = `Compiti segnati come fatti nelle ultime ${r.contestHours} ore: se uno non è vero, premi "Non è vero!".`;
  const lim = Date.now() - r.contestHours * 3600 * 1000;
  // ogni compito spuntato si può contestare per contestHours ore: prima quelli che scadono prima
  const deadline = c => ms(c.completeAt || c.doneAt) + r.contestHours * 3600 * 1000;
  const ver = data.verify.filter(c => ms(c.doneAt) >= lim && kidById(c.doneBy))
    .sort((a,b) => (a.contested - b.contested) || (deadline(a) - deadline(b)));
  const openVer = ver.filter(c => !c.contested).length;
  $('pVerify').innerHTML = ver.length ? ver.map(c => {
    const t = data.tasks[c.taskId];
    const tag = (c.scheduleId || '').startsWith('x-') ? ' · 🧹 bacheca' : c.collab ? ' · 🤝 squadra' : t?.optional ? ' · ✨ facoltativo' : '';
    // compito di squadra non ancora confermato da tutti: nessuna stella data, il genitore può confermare
    if (c.collab && !teamDone(c) && !c.contested) return `<div class="row"><div class="body">${taskIcon(t)} <b>${esc(listNames(c.team || []))}</b> · ${esc(t?.title ?? '?')}
      <br><small>${fmtDate(c.date)} · segnato da ${esc(kidName(c.doneBy))}${tag}</small><br><span class="due">⏳ manca la conferma di ${esc(listNames(teamMissing(c)))}</span></div>
      <button class="btn ok" data-pconf="${c.id}">Confermo io</button></div>`;
    const who = c.collab ? `<b>${esc(listNames(c.team || []))}</b>` : `<b style="color:${kidColor(c.doneBy)}">${esc(kidName(c.doneBy))}</b>`;
    const left = deadline(c) - Date.now(), h = Math.floor(left / 3600e3), m = Math.floor(left % 3600e3 / 60e3);
    const end = new Date(deadline(c));
    const when = `${end.toLocaleDateString('it-IT',{weekday:'short'})} ${fmtMs(deadline(c)).slice(0,5)} alle ${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`;
    const due = c.contested ? '' : `<span class="due ${left < 6 * 3600e3 ? 'soon' : ''}">⏳ ${h ? `${h} h ` : ''}${m} min per verificare · fino a ${when}</span>`;
    return `<div class="row"><div class="body">${taskIcon(t)} ${who} · ${esc(t?.title ?? '?')}
      <br><small>${fmtDate(c.date)} · +${c.points} ⭐${tag}</small>${due ? `<br>${due}` : ''}</div>
      ${c.contested ? '<span class="chip" style="--c:var(--minus)">🟨 contestato</span>'
                    : `<button class="btn no" data-contest="${c.id}">Non è vero!</button>`}</div>`;
  }).join('') : '<div class="empty">Nessun compito da verificare</div>';

  const reqs = kidsList().flatMap(k => data.pending[k.id] || []);
  $('pRedeem').innerHTML = reqs.length ? reqs.map(x => `
    <div class="row"><div class="body">${kidAvatar(x.kid)} <b>${esc(kidName(x.kid))}</b> vuole: ${esc(x.title)} <span class="stars">${x.cost} ⭐</span>
      <br><small>saldo: ${balance(x.kid)} ⭐</small></div>
      <span><button class="btn ok" data-approve="${x.kid}|${x.id}">Approva</button> <button class="btn no" data-deny="${x.kid}|${x.id}">Rifiuta</button></span></div>`).join('')
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
  $('schedList').innerHTML = (sched.length ? '' : kidsList().length
      ? `<p class="empty">Ancora nessun compito.</p><button class="btn primary" id="seedBtn">Carica compiti e premi di esempio</button>`
      : `<p class="empty">Prima aggiungi i figli dal ⚙️ Setup.</p>`) +
    kidsList().map(k => `<h3 style="color:${k.color}">${k.avatar || ''} ${esc(k.name)}</h3>${schedRows(sched.filter(x => x.owner === k.id))}`).join('') +
    (teams.length ? `<h3>🤝 Compiti di squadra</h3>${schedRows(teams)}` : '') +
    (orphan.length ? `<h3>Assegnati a figli rimossi</h3>${schedRows(orphan)}` : '');

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
      <span><select data-pstars="${p.kid}|${p.id}" style="width:auto;min-height:38px;padding:6px" aria-label="Stelle">
        ${[1,2,3,4,5].map(n => `<option value="${n}" ${n === (propStars[p.id] || 1) ? 'selected' : ''}>⭐ ${n}</option>`).join('')}</select>
      <button class="btn ok" data-papprove="${p.kid}|${p.id}">Approva</button> <button class="btn no" data-preject="${p.kid}|${p.id}">No</button></span></div>`).join('')
    : '<div class="empty">Nessuna proposta da valutare</div>';

  const pun = Object.values(data.tasks).filter(t => t.punishment).sort((a,b) => (a.defaultTime||'').localeCompare(b.defaultTime||''));
  $('punList').innerHTML = pun.length ? pun.map(t => `
    <div class="sched click" data-editpun="${t.id}"><span class="ticon" style="--c:var(--extra);width:40px;height:40px;font-size:1.3rem">${taskIcon(t)}</span>
      <div class="body"><b>${t.defaultTime || T().evening}</b> ${esc(t.title)}
      ${t.description ? `<div class="sub2">${esc(t.description)}</div>` : ''}</div>
      <div class="acts inl"><button class="btn icon" data-editpun="${t.id}" aria-label="Modifica" title="Modifica">✏️</button></div></div>`).join('')
    : '<div class="empty">Nessun compito di recupero: dal secondo cartellino rosso del trimestre non ci sarebbe nulla da recuperare. Aggiungine con "Nuovo compito" › Tipo "Recupero".</div>';

  $('pRewards').innerHTML = data.rewards.length ? data.rewards.slice().sort((a,b) => a.cost - b.cost).map(x => `
    <div class="sched"><div class="body">${esc(x.title)} <span class="stars">${x.cost} ⭐</span></div>
      <div class="acts inl"><button class="btn no" data-delrew="${x.id}">Elimina</button></div></div>`).join('')
    : '<div class="empty">Nessun premio</div>';
  // contatori sulle schede che richiedono un'azione
  const badge = (id, n) => { $(id).textContent = n || ''; $(id).hidden = !n; };
  badge('bVer', openVer);
  badge('bPrem', kidsList().reduce((a,k) => a + (data.pending[k.id] || []).length, 0));
  badge('bProp', kidsList().reduce((a,k) => a + (data.propPending[k.id] || []).length, 0));
  showPtab(ptab, true);
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
function schedRows(list){
  const td = today();
  return list.map(x => { const t = data.tasks[x.taskId], cat = catOf(t); return `
    <div class="sched click ${x.active?'':'off'}" data-edit="${x.id}">
      <span class="ticon" style="--c:${cat.color};width:40px;height:40px;font-size:1.3rem">${taskIcon(t)}</span>
      <div class="body"><b>${x.startTime}</b> ${esc(t.title)} <span class="stars">⭐${t.points||1}</span>
        <div class="sub2"><span class="chip" style="--c:${cat.color}">${esc(cat.name)}</span>${isTeamSched(x) ? ` <span class="chip" style="--c:var(--star)">🤝 ${esc(listNames(x.team || []))}</span>` : t.optional ? ' <span class="chip" style="--c:var(--star)">facoltativo</span>' : ''} ${daysText(x.weekdays)}${x.startDate > td ? ' · dal ' + fmtDate(x.startDate) : ''}${x.endDate ? ' · fino al ' + fmtDate(x.endDate) : ''}${x.active ? '' : ' · ⏸️ sospeso'}</div></div>
      <div class="acts inl"><button class="btn icon" data-edit="${x.id}" aria-label="Modifica" title="Modifica">✏️</button></div>
    </div>`; }).join('') || '<div class="empty">Nessun compito</div>';
}


async function contest(compId){
  const c = data.verify.find(x => x.id === compId); if (!c || c.contested) return;
  if (c.collab) return contestTeam(c);
  const t = data.tasks[c.taskId], base = t?.points || 1, kid = c.doneBy, td = today(), now = serverTimestamp(), r = R();
  const lost = (c.points || 0) + r.cheatMultiplier * base;
  if (!confirm(`${kidName(kid)} perde ${lost} ⭐, la serie e prende un cartellino giallo. Confermi?`)) return;
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
  batch.set(dref('kids', kid), {streak:0}, {merge:true});
  let red = null;
  if (activeYellows(kid).length + 1 >= r.yellowsForRed){
    const nth = redsInQuarter(kid, td).length + 1, from = addDays(td, 1);
    red = {kid, type:'red', date:td, from, until:addDays(from, r.redDays - 1), nth, effect: nth === 1 ? 'nostars' : 'extra', createdAt:now};
    batch.set(dref('kids', kid, 'cards', `red_${kid}_${td}`), red);
  }
  await batch.commit();
  toast(red ? `🟥 Cartellino rosso a ${kidName(kid)}!` : `🟨 Cartellino giallo a ${kidName(kid)}`);
}
// compito di squadra falso: tutti quelli che hanno confermato erano complici
async function contestTeam(c){
  const t = data.tasks[c.taskId], base = t?.points || 1, td = today(), now = serverTimestamp(), r = R();
  const team = (c.team || []).filter(k => kidById(k));
  const loss = k => collabPoints(c, k) + r.cheatMultiplier * base;
  if (!confirm(`Tutta la squadra (${listNames(team)}) restituisce le stelle, ne perde altre (${team.map(k => `${kidName(k)} −${loss(k)}`).join(', ')}), perde la serie e prende un cartellino giallo. Confermi?`)) return;
  const batch = chunkedBatch(), reds = [];
  batch.update(dref('completions', c.id), {contested:true, contestedAt:now});
  for (const kid of team){
    batch.set(dref('kids', kid, 'ledger', `cheat_${c.id}`), {kid, amount:-loss(kid), type:'cheat', date:td, createdAt:now,
      reason:`Imbroglio di squadra: ${t?.title ?? 'compito'} (${fmtDate(c.date)})`});
    batch.set(dref('kids', kid, 'cards', `yellow_${c.id}`), {kid, type:'yellow', date:td, reason:t?.title ?? '', createdAt:now});
    batch.set(dref('kids', kid), {streak:0}, {merge:true});
    if (activeYellows(kid).length + 1 >= r.yellowsForRed){
      const nth = redsInQuarter(kid, td).length + 1, from = addDays(td, 1);
      batch.set(dref('kids', kid, 'cards', `red_${kid}_${td}`), {kid, type:'red', date:td, from, until:addDays(from, r.redDays - 1), nth,
        effect: nth === 1 ? 'nostars' : 'extra', createdAt:now});
      reds.push(kid);
    }
  }
  await batch.commit();
  toast(reds.length ? `🟥 Cartellino rosso a ${listNames(reds)}!` : `🟨 Cartellino giallo a ${listNames(team)}`);
}

$('parentView').addEventListener('click', async e => {
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
    if (d.contest) return await contest(d.contest);
    if (d.pconf){ const c = data.verify.find(x => x.id === d.pconf); if (c && !teamDone(c)) await collabConfirm(c, true); return; }
    if (d.approve){
      const [kid, id] = d.approve.split('|');
      const x = (data.pending[kid] || []).find(y => y.id === id); if (!x) return;
      const batch = writeBatch(db);
      batch.update(dref('kids', kid, 'redemptions', id), {status:'approved', respondedAt:serverTimestamp()});
      batch.set(dref('kids', kid, 'ledger', `redeem_${id}`), {kid, amount:-x.cost, type:'reward', reason:`Premio: ${x.title}`, date:today(), createdAt:serverTimestamp()});
      await batch.commit(); toast('Premio approvato 🎁');
    }
    if (d.deny){ const [kid, id] = d.deny.split('|'); await updateDoc(dref('kids', kid, 'redemptions', id), {status:'rejected', respondedAt:serverTimestamp()}); }
    if (d.delrew && confirm('Eliminare questo premio?')) await deleteDoc(dref('rewards', d.delrew));
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
  if (!board && (!time || time < T().wake || time > T().bed)) return toast(`Orario tra ${T().wake} e ${T().bed}`);
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
      const t = {title, icon:$('fIcon').textContent, description:$('fDesc').value.trim(), categoryId:$('fCat').value, points:+$('fPts').value, createdAt:serverTimestamp()};
      if (pun) Object.assign(t, {punishment:true, defaultTime:time, points:0});
      if (board) Object.assign(t, {board:true, maxPerDay:Math.min(10, Math.max(1, parseInt($('fMax').value, 10) || 1))});
      if (kind === 'optional') t.optional = true;
      if (team) t.collab = true;
      taskId = (await addDoc(col('tasks'), t)).id;
    }
    if (sched){
      const o = $('fOwner').value;
      const batch = writeBatch(db);
      if (team) batch.set(doc(col('schedule')), {taskId, owner:'team', team:teamIds, startTime:time, weekdays, active:true,
          startDate:startDate || today(), endDate:endDate || null, createdAt:serverTimestamp()});
      else for (const ow of (o === 'all' ? kidsList().map(k => k.id) : [o]))
        batch.set(doc(col('schedule')), {taskId, owner:ow, startTime:time, weekdays, active:true,
          startDate:startDate || today(), endDate:endDate || null, createdAt:serverTimestamp()});
      await batch.commit();
    }
    toast(pun ? 'Compito di recupero salvato 🔄' : board ? 'Lavoretto aggiunto alla bacheca 🧹' : team ? `Compito di squadra per ${listNames(teamIds)} 🤝` : 'Compito assegnato ✅');
    e.target.reset(); setDate('fStart', today()); $('fTeam').innerHTML = '';
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
  const rewards = [['30 minuti di videogiochi',20], ['Scegliere il film della sera',30], ['Scegliere la cena',40], ['Gelato',50], ['5 €',150]];
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
  if (!data.rewards.length) rewards.forEach(([title, cost]) => batch.set(doc(col('rewards')), {title, cost, active:true, createdAt:now}));
  await batch.commit();
  toast('Compiti e premi di esempio caricati');
}
