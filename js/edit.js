'use strict';
/* Compiti di casa · finestra di modifica di compiti e assegnazioni */

/* ---------- finestra di modifica ---------- */
let editing = null;
const kindOf = t => t.punishment ? 'pun' : t.board ? 'board' : t.optional ? 'optional' : 'normal';
const KIND_NAME = {normal:'Pianificato', optional:'Facoltativo', board:'Lavoretto extra', pun:'Compito di recupero'};
// taskOnly: modifica solo il compito (titolo, tipo, stelle…), senza toccare le sue assegnazioni
function openEdit({schedId, taskId, taskOnly}){
  const s = schedId ? data.sched.find(x => x.id === schedId) : null;
  const t = data.tasks[s ? s.taskId : taskId]; if (!t) return;
  const teamS = isTeamSched(s);
  editing = {schedId: s?.id, taskId: t.id, origKind: kindOf(t), origCollab: isCollabTask(t), teamS, taskOnly: !s && !!taskOnly};
  $('eCollab').checked = isCollabTask(t);
  $('eTeam').innerHTML = teamBoxes(teamS ? (s.team || []) : kidsList().map(k => k.id));
  $('eTitle').value = t.title; $('eDesc').value = t.description || '';
  $('eIcon').textContent = taskIcon(t);
  $('eKind').value = kindOf(t);
  $('eMax').value = t.maxPerDay || 1;
  $('eCat').innerHTML = fam.categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  $('eCat').value = fam.categories.some(c => c.id === t.categoryId) ? t.categoryId : fam.categories[0].id;
  $('ePts').value = String(Math.min(5, Math.max(1, t.points || 1)));
  $('ePTime').value = t.defaultTime || T().evening;
  // assegnazione: quella esistente, oppure valori proposti se il compito diventa pianificato
  // un'assegnazione di squadra che torna "normale" si divide tra i figli, come una nuova assegnazione
  const perKid = s && !teamS;
  $('eOwner').innerHTML = kidOpts() + (perKid ? (kidById(s.owner) ? '' : `<option value="${s.owner}">(figlio rimosso)</option>`)
                                              : (kidsList().length > 1 ? '<option value="all">Tutti</option>' : ''));
  $('eOwner').value = perKid ? s.owner : (kidsList().length > 1 ? 'all' : kidsList()[0]?.id || '');
  $('eTime').value = s ? s.startTime : (t.defaultTime || '17:00'); $('eTime').min = T().wake; $('eTime').max = T().bed;
  $('eTimeLbl').textContent = `Orario (${T().wake} – ${T().bed})`;
  $('eDays').innerHTML = dayBoxes(s ? (s.weekdays || []) : [1,2,3,4,5,6,7]);
  setDate('eStart', s ? s.startDate : today()); setDate('eEnd', s?.endDate || '');
  $('eToggle').textContent = s?.active === false ? '▶️ Riattiva' : '⏸️ Sospendi';
  $('eDelete').textContent = s ? '🗑️ Elimina assegnazione' : '🗑️ Elimina compito';
  // un compito di squadra cambia tipo solo dalla sua assegnazione (servono squadra e orari)
  $('eKind').disabled = editing.taskOnly && editing.origCollab;
  syncEdit();
  $('editDlg').showModal();
}
// mostra i campi giusti per il tipo scelto e spiega cosa succede cambiandolo
function syncEdit(){
  const t = data.tasks[editing.taskId], kind = $('eKind').value, from = editing.origKind;
  const sched = kind === 'normal' || kind === 'optional';
  const collab = kind === 'optional' && $('eCollab').checked;
  const others = data.sched.filter(x => x.taskId === t.id);
  const only = editing.taskOnly && sched;
  $('eCollabBox').hidden = kind !== 'optional' || editing.taskOnly;
  $('eTeamBox').hidden = !(sched && collab);
  $('eOwnerBox').hidden = sched && collab;
  $('eHead').textContent = `✏️ ${kind === 'pun' ? 'Compito di recupero' : kind === 'board' ? 'Lavoretto extra' : t.title}`;
  $('eCatPts').hidden = kind === 'pun';
  $('eMaxBox').hidden = kind !== 'board';
  $('ePunTime').hidden = kind !== 'pun';
  $('eSchedBox').hidden = !sched || only;
  $('eToggle').hidden = !(sched && editing.schedId);
  $('eSchedLegend').textContent = collab ? '🤝 Squadra e orario' : sched && (!editing.schedId || editing.teamS) ? '📅 Nuova assegnazione' : '📅 Assegnazione';
  const whoOf = x => isTeamSched(x) ? listNames(x.team || []) : kidName(x.owner);
  $('eShared').textContent = sched && (others.length > 1 || only)
    ? `Titolo, tipo, icona, descrizione, categoria e stelle valgono per ${others.length === 1 ? 'la sua assegnazione' : `tutte le ${others.length} assegnazioni`} di questo compito${others.length ? ` (${[...new Set(others.map(whoOf))].join(', ')})` : ''}.` : '';
  let hint = '';
  const sep = others.filter(x => !isTeamSched(x)).length, tm = others.filter(isTeamSched).length;
  if (collab && !editing.origCollab)
    hint = `🤝 Diventa un compito di squadra: uno lo segna, gli altri confermano, e le stelle arrivano a tutti insieme.${sep ? ` ${sep === 1 ? 'L\'assegnazione attuale diventa' : `Le ${sep} assegnazioni separate diventano`} una sola, per la squadra scelta.` : ''}`;
  else if (!collab && editing.origCollab && sched)
    hint = `Non è più di squadra: scegli a chi assegnarlo. ${tm === 1 ? 'L\'assegnazione di squadra viene sostituita' : `Le ${tm} assegnazioni di squadra vengono sostituite`} da assegnazioni separate.`;
  else if (kind !== from){
    if (!sched && others.length) hint = `⚠️ Diventando "${KIND_NAME[kind]}" il compito non ha più giorni e orari: ${others.length === 1 ? 'la sua assegnazione verrà eliminata' : `le sue ${others.length} assegnazioni verranno eliminate`}. Lo storico delle stelle resta.`;
    else if (sched && !editing.schedId && !editing.taskOnly) hint = `Scegli a chi assegnarlo, in quali giorni e a che ora.`;
    else if (kind === 'optional') hint = 'Da ora dà stelle se fatto, ma non conta più per la giornata perfetta, la serie e le penalità.';
    else if (kind === 'normal') hint = 'Da ora conta per la giornata perfetta: se non viene fatto toglie stelle e interrompe la serie.';
    else if (kind === 'board') hint = 'Comparirà nella bacheca dei lavoretti extra di tutti i figli.';
    else if (kind === 'pun') hint = 'Comparirà solo durante un cartellino rosso, senza stelle.';
  }
  if (!hint && editing.taskOnly && editing.origCollab) hint = 'Per cambiare il tipo di un compito di squadra usa ✏️ sulla sua assegnazione in "Compiti assegnati".';
  $('eKindHint').textContent = hint; $('eKindHint').hidden = !hint;
  $('eKindDesc').textContent = KIND_DESC[kind];
}
$('eKind').onchange = syncEdit; $('eCollab').onchange = syncEdit;
$('eIcon').onclick = () => pickIcon(TASK_ICONS, $('eIcon').textContent, ic => { $('eIcon').textContent = ic; });
$('eCancel').onclick = () => $('editDlg').close();
$('eToggle').onclick = async () => {
  const s = data.sched.find(x => x.id === editing?.schedId); if (!s) return;
  try { await updateDoc(dref('schedule', s.id), {active: !s.active}); $('editDlg').close(); toast(s.active ? 'Compito sospeso' : 'Compito riattivato'); }
  catch(err){ fail(err); }
};
$('eDelete').onclick = async () => {
  const whole = !editing.schedId;
  const scheds = whole ? data.sched.filter(x => x.taskId === editing.taskId) : [];
  if (!confirm(whole ? `Eliminare questo compito${scheds.length ? ` e ${scheds.length === 1 ? 'la sua assegnazione' : `le sue ${scheds.length} assegnazioni`}` : ''}? Lo storico delle stelle resta.`
                     : 'Eliminare questa assegnazione? Lo storico delle stelle resta.')) return;
  try {
    const batch = chunkedBatch();
    if (whole){ scheds.forEach(x => batch.delete(dref('schedule', x.id))); batch.delete(dref('tasks', editing.taskId)); }
    else batch.delete(dref('schedule', editing.schedId));
    await batch.commit(); $('editDlg').close(); toast('Eliminato');
  } catch(err){ fail(err); }
};
$('eSave').onclick = async () => {
  const t = data.tasks[editing.taskId], kind = $('eKind').value;
  const sched = kind === 'normal' || kind === 'optional';
  const title = $('eTitle').value.trim();
  if (!title) return toast('Il titolo non può essere vuoto');
  const only = editing.taskOnly && sched;
  const collab = only ? editing.origCollab && kind === 'optional' : kind === 'optional' && $('eCollab').checked;
  const taskUpd = {title, description:$('eDesc').value.trim(), icon:$('eIcon').textContent,
                   optional: kind === 'optional', board: kind === 'board', punishment: kind === 'pun', collab};
  if (kind === 'pun'){
    const pt = $('ePTime').value;
    if (!pt || pt < T().wake || pt > T().bed) return toast(`Orario tra ${T().wake} e ${T().bed}`);
    Object.assign(taskUpd, {defaultTime:pt, points:0});
  } else {
    Object.assign(taskUpd, {categoryId:$('eCat').value, points:+$('ePts').value});
    if (kind === 'board') taskUpd.maxPerDay = Math.min(10, Math.max(1, parseInt($('eMax').value, 10) || 1));
  }
  let schedData = null;
  if (sched && !only){
    const time = $('eTime').value, weekdays = checkedDays('eDays');
    const startDate = dateVal('eStart'), endDate = dateVal('eEnd');
    if (!time || time < T().wake || time > T().bed) return toast(`Orario tra ${T().wake} e ${T().bed}`);
    if (!weekdays.length) return toast('Scegli almeno un giorno');
    if (!startDate) return toast('Data "Dal" non valida: usa gg/mm/aaaa');
    if (endDate === null) return toast('Data "Al" non valida: usa gg/mm/aaaa');
    if (endDate && endDate < startDate) return toast('La data "Al" è prima della data "Dal"');
    if (!collab && !$('eOwner').value) return toast('Prima aggiungi i figli dal Setup');
    schedData = {startTime:time, weekdays, startDate, endDate: endDate || null};
    if (collab){
      const team = [...document.querySelectorAll('#eTeam input:checked')].map(i => i.value);
      if (team.length < 2) return toast('Scegli almeno 2 figli per la squadra');
      Object.assign(schedData, {owner:'team', team});
    }
  }
  const others = data.sched.filter(x => x.taskId === t.id);
  if (!sched && others.length && !confirm(`Il compito diventa "${KIND_NAME[kind]}": ${others.length === 1 ? 'la sua assegnazione verrà eliminata' : `le sue ${others.length} assegnazioni verranno eliminate`}. Continuare?`)) return;
  try {
    const batch = chunkedBatch();
    batch.update(dref('tasks', t.id), taskUpd);
    const cur = editing.schedId, newRow = d => batch.set(doc(col('schedule')), {taskId:t.id, ...d, active:true, createdAt:serverTimestamp()});
    if (only){ /* solo il compito: le assegnazioni restano come sono */ }
    else if (sched && collab){
      // squadra: un'unica assegnazione; quelle separate del compito spariscono
      if (cur) batch.update(dref('schedule', cur), schedData); else newRow(schedData);
      others.filter(x => x.id !== cur && !isTeamSched(x)).forEach(x => batch.delete(dref('schedule', x.id)));
    } else if (sched){
      const o = $('eOwner').value;
      if (cur && !editing.teamS) batch.update(dref('schedule', cur), {...schedData, owner:o});
      else for (const ow of (o === 'all' ? kidsList().map(k => k.id) : [o])) newRow({owner:ow, ...schedData});
      // non più di squadra: le assegnazioni di squadra del compito spariscono
      others.filter(isTeamSched).forEach(x => batch.delete(dref('schedule', x.id)));
    }
    if (!sched) others.forEach(x => batch.delete(dref('schedule', x.id)));
    await batch.commit();
    $('editDlg').close();
    toast(kind !== editing.origKind ? `Ora è: ${KIND_NAME[kind]} ✅` : 'Modifiche salvate ✅');
  } catch(err){ fail(err); }
};
