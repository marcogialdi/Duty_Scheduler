'use strict';
/* Compiti di casa · scheda "Da verificare" dei genitori (dalla 0.12.0)

   - Prima per giorno (Oggi, Ieri, …), poi per fascia (Mattina, Pomeriggio, Sera).
   - Ogni fascia è una griglia: compiti nelle righe, figli nelle colonne.
     ✓ con l'orario = fatto (toccalo per contestarlo) · — = non fatto · 🟨 = contestato · 👍 = confermato.
   - Compiti di squadra e lavoretti extra non hanno un figlio o un orario fisso: righe compatte sotto ogni giorno.
   - "Tutto ok ✓" conferma tutti i compiti aperti del gruppo (campo verified): spariscono dalla lista
     e non si possono più contestare né togliere.
   - Contestare: un tocco sulla ✓; per 5 secondi resta "Annulla", poi parte la penalità (contest() in parent.js).
   - Filtro "In scadenza": solo i gruppi con compiti che tra meno di 6 ore non si potranno più contestare. */

const SOON_MS = 6 * 3600e3, UNDO_MS = 5000;
let verSoonOnly = store('get', 'cdc.verSoon') === '1';
let verGroups = {};                                   // gruppo → completamenti da confermare con "Tutto ok"

const verDeadline = c => ms(c.completeAt || c.doneAt) + R().contestHours * 3600e3;
const isApart = c => !!c.collab || isBoardComp(c);
// aperto = aspetta una decisione del genitore: non contestato, non confermato, ancora contestabile
const verOpen = c => !c.contested && !c.verified && verDeadline(c) > Date.now();
const verSoon = c => verOpen(c) && verDeadline(c) - Date.now() < SOON_MS;
const hhmm = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
const dayLabel = ds => ds === today() ? 'Oggi' : ds === addDays(today(), -1) ? 'Ieri'
  : weekdayName(ds).replace(/^./, x => x.toUpperCase());
const leftTxt = t => { const h = Math.floor((t - Date.now()) / 3600e3); return h >= 1 ? `${h} h` : `${Math.max(1, Math.floor((t - Date.now()) / 60e3))} min`; };

function renderVerify(){
  const r = R();
  $('pVerifyHint').innerHTML = `Compiti segnati nelle ultime ${r.contestHours} ore. Tocca <b>✓</b> su un compito non vero per contestarlo; <b>Tutto ok ✓</b> conferma il gruppo. <button class="link helpq" data-helpsec="checks" aria-label="Guida: controlli">❓</button>`;
  const comps = data.verify.filter(c => c.collab ? (c.team || []).some(kidById) : kidById(c.doneBy));
  const open = comps.filter(verOpen), soonN = open.filter(verSoon).length;
  if (verSoonOnly && !soonN) verSoonOnly = false;
  $('pVerifyFilters').innerHTML = !open.length ? '' :
    `<button type="button" class="vfilter ${verSoonOnly ? 'on' : ''}" data-vsoon="1" aria-pressed="${verSoonOnly}" ${soonN ? '' : 'disabled'}>⏰ In scadenza <b>${soonN}</b></button>`;
  verGroups = {};
  const days = [...new Set(open.map(c => c.date))].sort().reverse();
  const html = days.map(ds => {
    const dayComps = comps.filter(c => c.date === ds);
    const parts = [];
    for (const s of SLOTS()){
      const g = slotGrid(ds, s, dayComps.filter(c => !isApart(c)));
      if (g) parts.push(g);
    }
    const ap = apartGroup(ds, dayComps.filter(isApart));
    if (ap) parts.push(ap);
    if (!parts.length) return '';
    const n = dayComps.filter(verOpen).length;
    return `<h3 class="vday"><span>${dayLabel(ds)} <small>${fmtDate(ds)}</small></span><small>${n} da verificare</small></h3>${parts.join('')}`;
  }).join('');
  $('pVerify').innerHTML = html || (verSoonOnly ? '<div class="empty">Nessun compito in scadenza 🎉</div>'
                                                : '<div class="empty">Nessun compito da verificare 🎉</div>');
  return open.length;
}

/* intestazione di un gruppo, con la scadenza più vicina e "Tutto ok" */
function verHead(key, icon, name, range, list){
  const ok = list.filter(c => verOpen(c) && !contestQ.has(c.id) && !(c.collab && !teamDone(c)));
  verGroups[key] = ok.map(c => c.id);
  const first = Math.min(...list.filter(verOpen).map(verDeadline));
  const soon = first - Date.now() < SOON_MS;
  return `<div class="vhead ${soon ? 'soon' : ''}"><span>${icon} ${name}${range ? ` <small>${range}</small>` : ''}</span>
    <span class="vacts">${soon ? `<span class="vsoon">⏰ scade tra ${leftTxt(first)}</span>` : ''}
    ${ok.length ? `<button type="button" class="btn ok vok" data-vok="${key}">Tutto ok ✓</button>` : ''}</span></div>`;
}

/* una casella della griglia (o il pulsante a destra di una riga compatta) */
function verCell(c, item){
  if (!c){
    if (!item) return '<span class="vc na"></span>';
    return `<span class="vc no" title="Non fatto">—</span>`;
  }
  const t = hhmm(ms(c.doneAt));
  if (c.contested) return `<span class="vc bad" title="Contestato">🟨</span>`;
  if (contestQ.has(c.id)) return `<button type="button" class="vc pend" data-vc="${c.id}" aria-label="Annulla la contestazione">🟨<small>annulla</small></button>`;
  if (c.verified) return `<span class="vc okd" title="Confermato">👍<small>${t}</small></span>`;
  if (!verOpen(c)) return `<span class="vc old" title="Non più contestabile">✓<small>${t}</small></span>`;
  const sw = item?.received ? ' 🤝' : '';
  return `<button type="button" class="vc done ${verSoon(c) ? 'soon' : ''}" data-vc="${c.id}" aria-label="Fatto alle ${t}: tocca per contestare">✓<small>${t}${sw}</small></button>`;
}

/* griglia di una fascia: righe = compiti (compito + orario), colonne = figli che hanno qualcosa nella fascia */
function slotGrid(ds, slot, comps){
  const rows = new Map();
  const row = (task, time) => {
    const k = `${task?.id}|${time}`;
    if (!rows.has(k)) rows.set(k, {task, time, cells:{}});
    return rows.get(k);
  };
  for (const k of kidsList()){
    for (const i of itemsFor(k.id, ds, data.verSwaps)){
      if (i.collab || slotOf(i.time) !== slot.name) continue;
      row(i.task, i.time).cells[k.id] = {item:i, comp: comps.find(c => c.id === `${i.key}_${ds}`)};
    }
  }
  // spunte senza assegnazione corrispondente (orario cambiato, assegnazione eliminata): non vanno perse
  for (const c of comps){
    if (slotOf(compTime(c)) !== slot.name || !kidById(c.doneBy)) continue;
    const rw = row(data.tasks[c.taskId] || {id:c.taskId, title:'?'}, compTime(c));
    rw.cells[c.doneBy] = {...(rw.cells[c.doneBy] || {}), comp:c};
  }
  const list = [...rows.values()];
  const inGroup = list.flatMap(rw => Object.values(rw.cells).map(x => x.comp).filter(Boolean));
  if (!inGroup.some(verOpen)) return '';
  if (verSoonOnly && !inGroup.some(verSoon)) return '';
  list.sort((a,b) => a.time.localeCompare(b.time) || (a.task?.title || '').localeCompare(b.task?.title || ''));
  const kids = kidsList().filter(k => list.some(rw => rw.cells[k.id]));
  const key = `${ds}|${slot.name}`;
  return `<div class="vgroup">${verHead(key, slot.icon, slot.name, slot.range, inGroup)}
    <div class="vgrid" style="--n:${kids.length}" role="table" aria-label="${slot.name} ${fmtDate(ds)}">
      <div class="vrow vh" role="row"><span role="columnheader"></span>${kids.map(k =>
        `<span class="vk" role="columnheader" style="--k:${k.color}"><i>${k.avatar || ''}</i>${esc(k.name)}</span>`).join('')}</div>
      ${list.map(rw => `<div class="vrow" role="row"><span class="vt" role="rowheader"><i aria-hidden="true">${taskIcon(rw.task)}</i>
          <b>${esc(rw.task?.title ?? '?')}</b><small>${rw.time}${rw.task?.optional ? ' · ✨' : ''}${rw.task?.punishment ? ' · 🔄' : ''}</small></span>${
        kids.map(k => verCell(rw.cells[k.id]?.comp, rw.cells[k.id]?.item)).join('')}</div>`).join('')}
    </div></div>`;
}

/* squadra e lavoretti extra di un giorno: una riga compatta per compito */
function apartGroup(ds, comps){
  const list = comps.filter(c => verOpen(c) || c.contested || contestQ.has(c.id))
    .sort((a,b) => ms(a.doneAt) - ms(b.doneAt));
  if (!list.some(verOpen)) return '';
  if (verSoonOnly && !list.some(verSoon)) return '';
  const rows = list.map(c => {
    const t = data.tasks[c.taskId], board = isBoardComp(c);
    const who = c.collab ? listNames((c.team || []).filter(kidById)) : kidName(c.doneBy);
    const color = c.collab ? 'var(--ink)' : kidColor(c.doneBy);
    if (c.collab && !teamDone(c) && !c.contested) return `<div class="vline">
      <span class="vt"><i aria-hidden="true">${taskIcon(t)}</i><b>${esc(t?.title ?? '?')}</b>
        <small><span style="color:${color}">🤝 ${esc(who)}</span> · manca ${esc(listNames(teamMissing(c)))}</small></span>
      <button type="button" class="btn ok vok" data-pconf="${c.id}">Confermo io</button></div>`;
    return `<div class="vline"><span class="vt"><i aria-hidden="true">${taskIcon(t)}</i><b>${esc(t?.title ?? '?')}</b>
        <small><span style="color:${color}">${c.collab ? '🤝 ' : ''}${esc(who)}</span> · ${board ? '🧹 extra' : 'squadra'} · ⭐${c.points || 0}</small></span>
      ${verCell(c, null)}</div>`;
  }).join('');
  return `<div class="vgroup">${verHead(`${ds}|apart`, '🤝', 'Squadra e 🧹 lavoretti extra', '', list)}<div class="vlines">${rows}</div></div>`;
}

/* ---------- "Tutto ok ✓": conferma tutti i compiti aperti del gruppo ---------- */
async function verifyGroup(key){
  const ids = (verGroups[key] || []).filter(id => { const c = data.verify.find(x => x.id === id); return c && verOpen(c) && !contestQ.has(id); });
  if (!ids.length) return;
  const batch = chunkedBatch(), now = serverTimestamp();
  ids.forEach(id => batch.update(dref('completions', id), {verified:true, verifiedAt:now, verifiedBy:me.uid}));
  await batch.commit();
  toast(`👍 ${ids.length === 1 ? 'Compito confermato' : `${ids.length} compiti confermati`}`);
}

/* ---------- contestazione con "Annulla" ----------
   Il tocco sulla ✓ mette il compito in attesa per 5 secondi; poi la contestazione parte, una alla volta
   (così i cartellini gialli si contano sempre giusti). Se l'app va in secondo piano, partono subito. */
const contestQ = new Map();                            // completamento → {timer, at}
let contestChain = Promise.resolve();
function contestText(c){
  const t = data.tasks[c.taskId], base = t?.points || 1, mult = R().cheatMultiplier;
  if (c.collab) return `🟨 ${esc(t?.title ?? 'Compito')}: cartellino giallo a ${esc(listNames((c.team || []).filter(kidById)))}`;
  return `🟨 ${esc(kidName(c.doneBy))} · ${esc(t?.title ?? 'compito')}: −${(c.points || 0) + mult * base} ⭐ e cartellino giallo`;
}
function startContest(id){
  if (contestQ.has(id)) return undoContest(id);
  const c = data.verify.find(x => x.id === id); if (!c || !verOpen(c)) return;
  contestQ.set(id, {at: Date.now(), timer: setTimeout(() => commitContest(id), UNDO_MS)});
  render(); drawUndo();
}
function undoContest(id){
  const q = contestQ.get(id); if (!q) return;
  clearTimeout(q.timer); contestQ.delete(id);
  render(); drawUndo(); toast('Contestazione annullata');
}
function commitContest(id){
  const q = contestQ.get(id); if (!q) return;
  clearTimeout(q.timer);
  contestChain = contestChain.then(() => contest(id)).catch(fail).finally(() => { contestQ.delete(id); render(); drawUndo(); });
  q.sent = true; drawUndo();
}
function flushContests(){ for (const [id, q] of contestQ) if (!q.sent) commitContest(id); }
document.addEventListener('visibilitychange', () => { if (document.hidden) flushContests(); });
addEventListener('pagehide', flushContests);

function drawUndo(){
  const wait = [...contestQ.entries()].filter(([, q]) => !q.sent).sort((a,b) => b[1].at - a[1].at);
  const bar = $('undoBar');
  if (!wait.length){ bar.hidden = true; bar.innerHTML = ''; return; }
  const [id, q] = wait[0], c = data.verify.find(x => x.id === id);
  const left = Math.max(0, UNDO_MS - (Date.now() - q.at));
  bar.hidden = false;
  bar.innerHTML = `<span class="ut">${c ? contestText(c) : '🟨 Contestazione'}${wait.length > 1 ? ` <small>(+${wait.length - 1})</small>` : ''}</span>
    <button type="button" class="btn" data-undo="${id}">Annulla</button>
    <i class="ubar" style="animation-duration:${left}ms"></i>`;
}
$('undoBar').onclick = e => { const b = e.target.closest('[data-undo]'); if (b) undoContest(b.dataset.undo); };

$('pVerify').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  try {
    if (d.vc) return startContest(d.vc);
    if (d.vok) return await verifyGroup(d.vok);
    if (d.pconf){ const c = data.verify.find(x => x.id === d.pconf); if (c && !teamDone(c)) await collabConfirm(c, true); }
  } catch(err){ fail(err); }
});
$('pVerifyFilters').onclick = e => {
  if (!e.target.closest('[data-vsoon]')) return;
  verSoonOnly = !verSoonOnly; store('set', 'cdc.verSoon', verSoonOnly ? '1' : '0'); render();
};
