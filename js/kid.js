'use strict';
/* Compiti di casa · vista del figlio: giornata, bacheca, proposte, negozio, estratto conto */

/* =====================================================================
   VISTA FIGLIO
   ===================================================================== */
function renderScore(){
  const bal = balance(owner), res = reserved(owner);
  $('score').innerHTML = `
    <div><b class="stars">⭐ ${bal - res}</b><small>stelle${res ? ` (+${res} prenotate)` : ''}</small></div>
    <div><b>🔥 ${data.kidState[owner]?.streak || 0}</b><small>giorni perfetti di fila</small></div>
    <div><b>🟨 ${activeYellows(owner).length}/${R().yellowsForRed}</b><small>cartellini gialli</small></div>
    <div><b>🟥 ${redsInQuarter(owner).length}</b><small>rossi nel trimestre</small></div>`;
  const td = today();
  const red = cardsOf(owner).filter(c => c.type === 'red' && c.until >= td).sort((a,b) => a.from.localeCompare(b.from))[0];
  $('redBanner').innerHTML = !red ? '' : `<div class="banner">🟥 <b>Cartellino rosso</b> dal ${fmtDate(red.from)} al ${fmtDate(red.until)}:
    ${red.effect === 'nostars' ? 'i compiti vanno fatti lo stesso, ma non danno stelle né bonus.' : 'ci sono compiti di recupero 🔄 da fare ogni giorno, senza stelle.'}</div>`;
}

function renderDay(){
  const td = today(), isToday = day === td;
  lastRenderToday = td;
  $('dayLbl').textContent = (isToday ? 'Oggi · ' : '') + weekdayName(day) + ' ' + fmtDate(day);
  $('todayLink').style.visibility = isToday ? 'hidden' : 'visible';
  $('legendCats').innerHTML = fam.categories.map(c => `<span style="--c:${c.color}">${esc(c.name)}</span>`).join('');

  currentItems = itemsFor(owner, day, data.swaps);
  const compBy = Object.fromEntries(data.comps.map(c => [c.scheduleId, c]));

  const incoming = data.swaps.filter(x => x.status === 'pending' && x.toOwner === owner);
  $('inbox').innerHTML = !incoming.length ? '' : `<div class="inbox">
    <p><b>📨 Richieste di scambio</b></p>
    ${incoming.map(x => { const s = data.sched.find(k => k.id === x.scheduleId), t = s && data.tasks[s.taskId];
      return `<div class="row"><span>${kidAvatar(x.fromOwner)} <b>${esc(kidName(x.fromOwner))}</b> ti chiede: ${taskIcon(t)} <b>${esc(t?.title)}</b> alle ${s?.startTime ?? ''}
        <span class="stars">(+${(t?.points||1) + R().swapFavor} ⭐)</span></span>
        <span><button class="btn ok" data-acc="${x.id}">Accetto</button>
        <button class="btn no" data-rej="${x.id}">No grazie</button></span></div>`; }).join('')}
  </div>`;

  renderGoal(compBy, isToday);

  const nowHM = new Date().toTimeString().slice(0, 5);
  $('groups').innerHTML = SLOTS().map(slot => {
    const list = currentItems.filter(i => slotOf(i.time) === slot.name);
    const isDone = i => compDone(compBy[i.key]);
    const sDone = list.filter(isDone).length, left = list.filter(i => !i.optional && !isDone(i)).length;
    // si chiude da sola se vuota, tutta fatta, o già passata senza obbligatori da fare; la scelta a mano vince
    const past = day < today() || (isToday && nowHM >= SLOT_END()[slot.name]);
    const auto = !list.length || sDone === list.length || (past && !left);
    const open = slotOpenGet(slot.name) ?? !auto;
    const sum = !list.length ? 'nessun compito' : sDone === list.length ? '✓ tutto fatto' : left ? `${left} da fare` : 'restano i facoltativi';
    return `<section class="group ${open ? '' : 'shut'}">
      <h2><button type="button" class="slotbtn" data-slot="${slot.name}" aria-expanded="${open}">
        <span>${slot.icon} ${slot.name} <i class="chev" aria-hidden="true">${open ? '▾' : '▸'}</i></span>
        <small>${list.length ? `${sDone}/${list.length} · ` : ''}${open ? slot.range : sum}</small></button></h2>
      ${!open ? '' : list.length ? list.map(i => taskCard(i, compBy[i.key], isToday)).join('') : '<div class="empty">Nessun compito 🎉</div>'}
    </section>`;
  }).join('');
  renderBoard(isToday);
}

/* fasce richiudibili: la scelta fatta a mano vale per quel figlio e quel giorno, su questo dispositivo */
const SLOT_END = () => ({Mattina: T().afternoon, Pomeriggio: T().evening, Sera: '24:00'});
function slotOpenAll(){ try { return JSON.parse(store('get', 'cdc.slotOpen') || '{}'); } catch(e){ return {}; } }
function slotOpenGet(name){ const v = slotOpenAll()[`${owner}|${day}|${name}`]; return v === undefined ? undefined : v; }
function slotOpenSet(name, open){
  const all = slotOpenAll(), keep = addDays(today(), -3);
  for (const k of Object.keys(all)) if (k.split('|')[1] < keep) delete all[k];   // via le scelte vecchie
  all[`${owner}|${day}|${name}`] = open;
  store('set', 'cdc.slotOpen', JSON.stringify(all));
}

/* =====================================================================
   B: BACHECA DEI LAVORETTI EXTRA  ·  C: PROPOSTE DEI RAGAZZI
   ===================================================================== */
const boardTasks = () => Object.values(data.tasks).filter(t => t.board).sort((a,b) => a.title.localeCompare(b.title));
const isBoardComp = c => (c.scheduleId || '').startsWith('x-');
const boardCompsOf = taskId => data.comps.filter(c => isBoardComp(c) && c.taskId === taskId);
const boardPoints = (t, kid, ds) => redOn(kid, ds)?.effect === 'nostars' ? 0 : (t.points || 1);
function boardEarned(kid){
  return data.comps.filter(c => isBoardComp(c) && c.doneBy === kid && !c.contested).reduce((a,c) => a + (c.points || 0), 0);
}
function renderBoard(isToday){
  const prevText = $('propText')?.value || '', hadFocus = document.activeElement?.id === 'propText';
  const list = boardTasks();
  const props = (data.proposals[owner] || []).filter(p => p.date === day);
  const canPropose = isToday && !isParent();
  if (!list.length && !props.length && !canPropose){ $('board').innerHTML = ''; return; }
  const cards = list.map(t => {
    const used = boardCompsOf(t.id), max = t.maxPerDay || 1;
    const mine = used.find(c => c.doneBy === owner);
    const others = used.filter(c => c.doneBy !== owner).map(c => kidName(c.doneBy));
    const pts = mine ? mine.points : boardPoints(t, owner, day);
    let action = '';
    if (mine?.contested) action = `<span class="chip" style="--c:var(--minus)">⚠️ Non era vero</span>`;
    else if (mine) action = `<span class="chip" style="--c:var(--plus)">✓ fatto da te</span>${isToday ? ` <button class="btn" data-bundo="${mine.id}">Annulla</button>` : ''}`;
    else if (used.length >= max) action = `<span class="chip" style="--c:var(--line)">già fatto${others.length ? ' da ' + esc(others.join(', ')) : ''}</span>`;
    else if (isToday && !isParent()) action = `<button class="btn ok" data-bdo="${t.id}">✅ L'ho fatto!</button>`;
    return `<div class="task board ${mine && !mine.contested ? 'done' : ''}" style="--c:var(--star)">
      <div class="ticon" aria-hidden="true">${taskIcon(t)}</div>
      <div class="body"><div class="title">${esc(t.title)}</div>
        ${t.description ? `<div class="desc">${esc(t.description)}</div>` : ''}
        <div class="meta"><span class="stars">+${pts} ⭐</span><span>oggi ${used.length}/${max}</span></div></div>
      ${action ? `<div class="acts">${action}</div>` : ''}</div>`;
  }).join('');
  const st = {pending:'⏳ da approvare', approved:'✅ approvata', rejected:'❌ non approvata', cancelled:'annullata'};
  const propRows = props.map(p => `<div class="row"><div class="body">💡 ${esc(p.title)}<br><small>${st[p.status] || ''}${p.status === 'approved' ? ` · +${p.points} ⭐` : ''}</small></div>
      ${p.status === 'pending' && !isParent() ? `<button class="btn" data-punreq="${p.id}">Annulla</button>` : ''}</div>`).join('');
  $('board').innerHTML = `
    ${list.length ? `<div class="boardhead"><h2>🧹 Lavoretti extra</h2><small>quando servono · non contano per la giornata perfetta</small></div>${cards}` : ''}
    ${canPropose || props.length ? `<div class="boardhead"><h2>💡 Hai fatto qualcos'altro di utile?</h2></div>
      <div class="panel" style="margin:0">${canPropose ? `<p class="hint" style="margin:0 0 4px">Scrivilo qui: se mamma o papà approvano, decidono loro quante stelle darti.</p>
        <form class="propform" id="propForm"><input id="propText" maxlength="80" placeholder="Es. Ho aiutato la nonna a portare la spesa" autocomplete="off">
        <button class="btn primary" type="submit">Proponi</button></form>` : ''}${propRows}</div>` : ''}`;
  if ($('propText')){ $('propText').value = prevText; if (hadFocus) $('propText').focus(); }
}
$('board').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  const ds = day, now = serverTimestamp();
  try {
    if (b.dataset.bdo){
      if (ds !== today()) return toast('Si possono segnare solo i lavoretti di oggi');
      const t = data.tasks[b.dataset.bdo], max = t.maxPerDay || 1;
      const taken = new Set(boardCompsOf(t.id).map(c => c.slot));
      let slot = 1; while (taken.has(slot) && slot <= max) slot++;
      if (slot > max) return toast('Per oggi è già stato fatto');
      const key = `x-${t.id}-${slot}`, cid = `${key}_${ds}`, pts = boardPoints(t, owner, ds);
      const batch = writeBatch(db);
      batch.set(dref('completions', cid), {scheduleId:key, slot, taskId:t.id, date:ds, doneBy:owner, points:pts, board:true, doneAt:now});
      batch.set(dref('kids', owner, 'ledger', `done_${cid}`), {kid:owner, amount:pts, type:'task', completionId:cid, date:ds, createdAt:now,
        reason:`${t.title} (lavoretto extra)`});
      try { await batch.commit(); }
      catch(err){ return toast(err?.code === 'permission-denied' ? 'Qualcuno l\'ha appena segnato: riprova' : (AUTH_MSG[err?.code] || 'Errore')); }
      toast(pts ? `Grazie! +${pts} ⭐` : 'Fatto! 💪');
    }
    if (b.dataset.bundo){
      const cid = b.dataset.bundo;
      const batch = writeBatch(db);
      batch.delete(dref('completions', cid));
      batch.delete(dref('kids', owner, 'ledger', `done_${cid}`));
      await batch.commit();
    }
    if (b.dataset.punreq) await updateDoc(dref('kids', owner, 'proposals', b.dataset.punreq), {status:'cancelled'});
  } catch(err){ fail(err); }
});
$('board').addEventListener('submit', async e => {
  if (e.target.id !== 'propForm') return;
  e.preventDefault();
  const title = $('propText').value.trim();
  if (title.length < 3) return toast('Scrivi cosa hai fatto');
  const todays = (data.proposals[owner] || []).filter(p => p.date === today() && p.status !== 'cancelled');
  if (todays.length >= 3) return toast('Massimo 3 proposte al giorno');
  try {
    $('propText').value = '';
    await addDoc(col('kids', owner, 'proposals'), {kid:owner, title, date:today(), status:'pending', createdAt:serverTimestamp()});
    toast('Proposta inviata a mamma e papà 💡');
  } catch(err){ fail(err); }
});

function renderGoal(compBy, isToday){
  const all = currentItems, items = all.filter(i => !i.optional), total = items.length, td = today(), g = $('goal');
  g.style.setProperty('--k', kidColor(owner));
  const isDone = i => compDone(compBy[i.key]);
  const optDone = all.filter(i => i.optional && isDone(i));
  const bonusStars = optDone.reduce((a,i) => a + compPoints(compBy[i.key], owner), 0) + boardEarned(owner);
  const extraLine = bonusStars ? `<span class="stars">✨ +${bonusStars} ⭐ da facoltativi e lavoretti extra</span>` : '';
  if (!total){ g.className = 'goal'; g.innerHTML = `<b>🎉 Oggi nessun compito obbligatorio!</b>${extraLine ? `<div class="gsub" style="margin-top:6px">${extraLine}</div>` : ''}`; return; }
  const done = items.filter(isDone).length, left = total - done;
  const pct = Math.round(done / total * 100);
  const noStars = redOn(owner, day)?.effect === 'nostars';
  const earned = items.reduce((a,i) => a + (isDone(i) ? (compBy[i.key].points || 0) : 0), 0);
  const possible = items.reduce((a,i) => a + (isDone(i) ? (compBy[i.key].points || 0) : pointsFor(i, owner, day)), 0) + (noStars ? 0 : R().perfectDay);
  const nextStreak = (data.kidState[owner]?.streak || 0) + 1, sb = noStars ? 0 : streakBonusFor(nextStreak);
  const bonus = noStars ? '' : ` (+${R().perfectDay} ⭐${sb ? ` e serie di ${nextStreak} giorni +${sb} ⭐` : ''})`;
  let title, note = '';
  if (left === 0) title = day < td ? '🏆 Giornata perfetta!' : `🏆 Giornata perfetta!${bonus ? ' Bonus in arrivo' + bonus : ''}`;
  else if (day < td) title = `Giornata chiusa: ${done} compiti su ${total}`;
  else {
    title = `🎯 ${left === 1 ? 'Manca 1 compito' : `Mancano ${left} compiti`} alla giornata perfetta${bonus}`;
    const next = isToday && items.find(i => !isDone(i));
    if (next) note = `👉 Prossimo: ${taskIcon(next.task)} <b>${esc(next.task.title)}</b> alle ${next.time}`;
  }
  g.className = 'goal' + (left === 0 ? ' win' : '');
  g.innerHTML = `
    <div class="gtop"><b>${title}</b><span class="pct">${pct}%</span></div>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">
      <div class="fill" style="width:${pct}%"></div>
      <div class="ticks">${total <= 20 ? '<span></span>'.repeat(total) : ''}</div>
    </div>
    <div class="gsub"><span>✅ ${done} di ${total} fatti</span>
      <span class="stars">⭐ ${earned} guadagnate${day >= td ? ` su ${possible} possibili` : ''}</span></div>
    ${extraLine ? `<div class="gsub" style="margin-top:4px">${extraLine}</div>` : ''}
    ${note ? `<div class="gnext">${note}</div>` : ''}`;
}

function taskCard(item, comp, isToday){
  const {task:t, sw, received, pun} = item;
  const cat = catOf(t), c = pun ? 'var(--extra)' : cat.color;
  const done = compDone(comp);
  const pts = comp ? compPoints(comp, owner) : item.collab ? boardPoints(t, owner, day) : pointsFor(item, owner, day);
  const cc = item.collab ? collabCheck(comp, isToday) : null;
  const pendingOut = sw && sw.status === 'pending' && sw.fromOwner === owner;
  const siblings = kidsList().filter(k => k.id !== owner);
  const canSwap = !pun && !received && !item.collab && !comp && day >= today() && siblings.length;
  let action = '';
  if (item.collab) action = collabAction(item, comp, isToday);
  else if (comp?.contested) action = `<span class="chip" style="--c:var(--minus)">⚠️ Non era vero</span>`;
  else if (pun) action = `<span class="chip" style="--c:var(--minus)">🔄 recupero</span>`;
  else if (received) action = `<span class="chip" style="--c:${c}">da ${esc(kidName(item.s.owner))} 🤝</span>`;
  else if (pendingOut) action = `<button class="btn" data-cancel="${sw.id}">⏳ ${esc(kidName(sw.toOwner))} · annulla</button>`;
  else if (canSwap && swapPick === item.key)
    action = siblings.map(k => `<button class="btn" data-swapto="${k.id}" data-key="${item.key}">→ ${k.avatar || ''} ${esc(k.name)}</button>`).join(' ') +
             ` <button class="btn" data-swapx="1">✕</button>`;
  else if (canSwap) action = siblings.length === 1
    ? `<button class="btn" data-swapto="${siblings[0].id}" data-key="${item.key}">🤝 Chiedi a ${esc(siblings[0].name)}</button>`
    : `<button class="btn" data-pick="${item.key}">🤝 Chiedi a…</button>`;
  const check = cc ? `<button class="check ${cc.cls}" data-done="${item.key}" aria-label="Fatto" ${cc.can ? '' : 'disabled'}>${cc.mark}</button>`
    : `<button class="check" data-done="${item.key}" aria-label="Fatto" ${isToday && !comp?.contested ? '' : 'disabled'}>${done?'✓':''}</button>`;
  return `<div class="task ${done?'done':''} ${comp?.contested?'contested':''} ${item.collab?'collab':''}" style="--c:${c}">
    ${check}
    <div class="ticon" aria-hidden="true">${taskIcon(t)}</div>
    <div class="body"><div class="title">${esc(t.title)}</div>
      ${t.description ? `<div class="desc">${esc(t.description)}</div>` : ''}
      <div class="meta"><span class="tm">🕐 ${item.time}</span>${item.collab ? `<span class="chip" style="--c:var(--star)">🤝 con ${esc(listNames(item.s.team.filter(k => k !== owner)))}</span>` : item.optional ? '<span class="chip" style="--c:var(--star)">facoltativo</span>' : ''}${pun ? '' : `<span class="chip" style="--c:${c}">${esc(cat.name)}</span>`}
        <span class="stars">${pts ? `+${pts} ⭐` : '0 ⭐'}</span></div></div>
    ${action ? `<div class="acts">${action}</div>` : ''}</div>`;
}

$('svDay').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  const ds = day, d = b.dataset, now = serverTimestamp();
  try {
    if (d.slot){ slotOpenSet(d.slot, b.getAttribute('aria-expanded') !== 'true'); return render(); }
    if (d.pick){ swapPick = d.pick; return render(); }
    if (d.cconf){
      const c = data.comps.find(x => x.id === d.cconf);
      if (c && !(c.confirmed || []).includes(owner) && !c.contested) await collabConfirm(c, false);
      return;
    }
    if (d.swapx){ swapPick = null; return render(); }
    if (d.done){
      if (ds !== today()) return toast('Si possono segnare solo i compiti di oggi');
      const item = currentItems.find(i => i.key === d.done); if (!item) return;
      const cid = `${item.key}_${ds}`;
      const comp = data.comps.find(c => c.id === cid);
      if (comp?.contested) return;
      if (item.collab){
        if (!comp) return await collabMark(item, ds);
        if (comp.doneBy === owner && (comp.confirmed || []).length === 1) return await collabUndo(comp);
        return;
      }
      const batch = writeBatch(db);
      if (comp){
        batch.delete(dref('completions', cid));
        batch.delete(dref('kids', owner, 'ledger', `done_${cid}`));
        await batch.commit();
      } else {
        const pts = pointsFor(item, owner, ds);
        batch.set(dref('completions', cid), {scheduleId:item.key, taskId:item.task.id, date:ds, doneBy:owner, points:pts, doneAt:now});
        batch.set(dref('kids', owner, 'ledger', `done_${cid}`), {kid:owner, amount:pts, type:'task', completionId:cid, date:ds, createdAt:now,
          reason: item.task.title + (item.received ? ' (scambio)' : '') + (item.pun ? ' (recupero)' : '')});
        await batch.commit();
        toast(pts ? `Bravo! +${pts} ⭐` : 'Fatto! 💪');
      }
    } else if (d.swapto){
      swapPick = null;
      await setDoc(dref('swaps', `${d.key}_${ds}`), {scheduleId:d.key, date:ds, fromOwner:owner, toOwner:d.swapto, status:'pending', createdAt:now});
      toast(`Richiesta inviata a ${kidName(d.swapto)}`);
    } else if (d.cancel){
      await updateDoc(dref('swaps', d.cancel), {status:'cancelled', respondedAt:now});
    } else if (d.acc){
      await updateDoc(dref('swaps', d.acc), {status:'accepted', respondedAt:now});
      toast('Scambio accettato 🤝');
    } else if (d.rej){
      await updateDoc(dref('swaps', d.rej), {status:'rejected', respondedAt:now});
    }
  } catch(err){ fail(err); }
});

/* ---------- negozio ---------- */
function renderShop(){
  const avail = balance(owner) - reserved(owner);
  const rewards = data.rewards.filter(r => r.active !== false).sort((a,b) => a.cost - b.cost);
  $('shopList').innerHTML = rewards.length ? rewards.map(r => `
    <div class="row"><div class="body"><b>${esc(r.title)}</b><br><span class="stars">${r.cost} ⭐</span>
      ${avail < r.cost ? `<small> · ne mancano ${r.cost - avail}</small>` : ''}</div>
      <button class="btn ok" data-req="${r.id}" ${avail < r.cost ? 'disabled' : ''}>Lo voglio!</button></div>`).join('')
    : '<div class="empty">Il negozio è ancora vuoto: chiedi a mamma e papà!</div>';
  const mine = (data.redemptions[owner] || []).slice().sort((a,b) => ms(b.createdAt) - ms(a.createdAt));
  const st = {pending:'⏳ in attesa', approved:'✅ approvato', rejected:'❌ rifiutato', cancelled:'annullato'};
  $('myRedeem').innerHTML = isParent() ? '<div class="empty">Le richieste da approvare sono nella scheda Genitori.</div>'
    : mine.length ? mine.map(r => `
    <div class="row"><div class="body">${esc(r.title)} <span class="stars">${r.cost} ⭐</span><br><small>${st[r.status]}</small></div>
      ${r.status === 'pending' ? `<button class="btn" data-unreq="${r.id}">Annulla</button>` : ''}</div>`).join('')
    : '<div class="empty">Nessuna richiesta</div>';
}
$('svShop').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  try {
    if (b.dataset.req){
      if (isParent()) return toast('I premi li chiedono i figli dal loro accesso');
      const r = data.rewards.find(x => x.id === b.dataset.req);
      if (balance(owner) - reserved(owner) < r.cost) return toast('Stelle insufficienti');
      await addDoc(col('kids', owner, 'redemptions'), {kid:owner, rewardId:r.id, title:r.title, cost:r.cost, status:'pending', createdAt:serverTimestamp()});
      toast('Richiesta inviata a mamma e papà 🎁');
    } else if (b.dataset.unreq){
      await updateDoc(dref('kids', owner, 'redemptions', b.dataset.unreq), {status:'cancelled'});
    }
  } catch(err){ fail(err); }
});

/* ---------- estratto conto e regole ---------- */
function renderLog(){
  const rows = (data.ledger[owner] || []).slice().sort((a,b) => ms(b.createdAt) - ms(a.createdAt));
  $('logList').innerHTML = rows.length ? rows.map(l => `
    <div class="row"><div class="body">${esc(l.reason)}<br><small>${fmtDate(l.date)}</small></div>
      <span class="amt ${amtCls(l.amount)}">${sign(l.amount)} ⭐</span></div>`).join('')
    : '<div class="empty">Ancora nessun movimento</div>';
  $('rulesList').innerHTML = gameRules().map(x => `<li>${x}</li>`).join('');
}
