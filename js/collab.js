'use strict';
/* Compiti di casa · compiti di squadra (collaborazione)

   Un compito facoltativo con "Collaborazione" ha una sola assegnazione per una squadra di figli
   (owner: 'team', team: [id, id, …]) e un solo documento in completions per giorno.
   1. Un figlio lo segna: completions/{assegnazione}_{data} con confirmed: [lui] → nessuna stella.
   2. Ogni altro membro conferma ("Confermo, l'abbiamo fatto") e si aggiunge a confirmed.
   3. Chi completa la squadra scrive le stelle a tutti: kids/{k}/ledger/collab_{completamento}
      (se qualcosa si interrompe, collabRepair le aggiunge dopo, senza doppioni).
   Un genitore può confermare al posto dei figli; se contesta, il cartellino va a tutta la squadra.
   Non conta per giornata perfetta, serie e penalità (è un facoltativo). */

const isCollabTask = t => !!(t?.optional && t?.collab);
const isTeamSched = s => s?.owner === 'team';
const teamDone = c => !!c?.collab && (c.team || []).every(k => (c.confirmed || []).includes(k));
const teamMissing = c => (c?.team || []).filter(k => !(c.confirmed || []).includes(k));
// un completamento "conta" se non è contestato e, per la squadra, se hanno confermato tutti
const compDone = c => !!c && !c.contested && (!c.collab || teamDone(c));
// le stelle di un membro: zero durante il primo cartellino rosso (niente stelle)
const collabPoints = (c, kid) => redOn(kid, c.date)?.effect === 'nostars' ? 0 : (c.points || 0);
const compPoints = (c, kid) => c.collab ? collabPoints(c, kid) : (c.points || 0);
function listNames(ids){
  const n = ids.map(kidName);
  return n.length < 2 ? n.join('') : n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1];
}
const teamBoxes = (sel = []) => kidsList().map(k =>
  `<label><input type="checkbox" value="${k.id}" ${sel.includes(k.id) ? 'checked' : ''}>${k.avatar || ''} ${esc(k.name)}</label>`).join('');

/* il figlio segna il compito di squadra: niente stelle finché non confermano tutti */
async function collabMark(item, ds){
  const cid = `${item.key}_${ds}`;
  await setDoc(dref('completions', cid), {scheduleId:item.key, taskId:item.task.id, date:ds, doneBy:owner,
    points:item.task.points || 1, collab:true, team:item.s.team, confirmed:[owner], doneAt:serverTimestamp()});
  const others = item.s.team.filter(k => k !== owner);
  toast(`Segnato! Ora ${listNames(others)} ${others.length > 1 ? 'devono' : 'deve'} confermare 🤝`);
}

/* conferma di un membro (o di un genitore per tutti).
   Prima si salva la conferma; quando la squadra è completa, chi conferma per ultimo scrive le stelle di ognuno,
   una scrittura per volta (così ogni salvataggio resta piccolo per le regole di Firebase). */
async function collabConfirm(c, byParent){
  const team = c.team || [];
  const confirmed = byParent ? team.slice() : [...(c.confirmed || []), owner];
  const complete = team.every(k => confirmed.includes(k));
  await updateDoc(dref('completions', c.id), {confirmed, ...(complete ? {completeAt:serverTimestamp()} : {}), ...(byParent ? {parentConfirmed:true} : {})});
  if (complete){
    const done = {...c, confirmed};
    await Promise.all(team.map(k => collabStars(done, k)));
  }
  toast(complete ? `🤝 Fatto insieme! Stelle a tutta la squadra` : `Confermato: manca ${listNames(teamMissing({...c, confirmed}))}`);
}
// stelle di un membro per un compito di squadra completato: id fisso, quindi mai doppie
function collabStars(c, k){
  const t = data.tasks[c.taskId];
  collabSent.add(`${c.id}|${k}`);
  return setDoc(dref('kids', k, 'ledger', `collab_${c.id}`), {kid:k, amount:collabPoints(c, k), type:'collab', completionId:c.id,
    date:c.date, createdAt:serverTimestamp(), reason:`${t?.title ?? 'Compito di squadra'} (insieme a ${listNames((c.team || []).filter(x => x !== k))}) 🤝`})
    .catch(e => console.warn('Stelle di squadra rimandate alla prossima apertura', e));
}
/* rete di sicurezza: se le stelle di qualcuno non sono state scritte (app chiusa, rete caduta),
   le aggiunge il genitore (per tutti) o il figlio (per sé) appena vede il compito completato */
const collabSent = new Set();
function collabRepair(){
  const comps = isParent() ? data.verify : data.comps;
  for (const c of comps){
    if (!c.collab || c.contested || !teamDone(c)) continue;
    for (const k of c.team){
      if (!isParent() && k !== me.kidId) continue;
      if (!data.ledger[k] || collabSent.has(`${c.id}|${k}`)) continue;           // movimenti non ancora caricati
      if (data.ledger[k].some(l => l.id === `collab_${c.id}`)){ collabSent.add(`${c.id}|${k}`); continue; }
      if (Date.now() - ms(c.completeAt) < 20000) continue;                          // chi ha confermato le sta ancora scrivendo
      collabStars(c, k);
    }
  }
}

/* chi l'ha segnato può toglierlo finché nessun altro ha confermato */
async function collabUndo(c){ await deleteDoc(dref('completions', c.id)); }

/* pulsanti e stato sulla scheda del compito */
function collabCheck(comp, isToday){
  if (!comp) return {cls:'', mark:'', can: isToday};
  if (comp.contested) return {cls:'', mark:'', can:false};
  if (teamDone(comp)) return {cls:'', mark:'✓', can:false};
  const mineOnly = comp.doneBy === owner && (comp.confirmed || []).length === 1;
  return {cls:'wait', mark:'⏳', can: isToday && mineOnly};
}
function collabAction(item, comp, isToday){
  if (!comp) return '';
  if (comp.contested) return `<span class="chip" style="--c:var(--minus)">⚠️ Non era vero</span>`;
  if (teamDone(comp)) return `<span class="chip" style="--c:var(--plus)">🤝 fatto insieme</span>${comp.verified ? ' ' + VCHIP : ''}`;
  if (!(comp.confirmed || []).includes(owner))
    return `<span class="cwait">${esc(kidName(comp.doneBy))} l'ha segnato come fatto</span>` +
      (isToday && !isParent() ? ` <button class="btn ok" data-cconf="${comp.id}">✅ Confermo, l'abbiamo fatto</button>` : '');
  return `<span class="cwait">⏳ aspetta la conferma di ${esc(listNames(teamMissing(comp)))}</span>`;
}
