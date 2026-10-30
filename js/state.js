'use strict';
/* Compiti di casa · stato dell'app e dispositivo */

/* =====================================================================
   DISPOSITIVO (cosa resta salvato su questo telefono/tablet)
   ===================================================================== */
const DEV_KEY = 'cdc.device';
let device = (() => {
  try { const d = JSON.parse(localStorage.getItem(DEV_KEY)) || null; return d && {...d, kids: cleanKids(d.kids)}; }
  catch(e){ return null; }
})();
function saveDevice(d){ device = d; d ? store('set', DEV_KEY, JSON.stringify(d)) : store('del', DEV_KEY); }

/* =====================================================================
   STATO
   ===================================================================== */
let fid = null, fam = null, me = null, busy = false;
let view = null, owner = null, subView = 'day', day = today(), swapPick = null;
const blank = () => ({ tasks:{}, sched:[], swaps:[], comps:[], rewards:[], verify:[], parents:[], invites:[],
                       kidState:{}, ledger:{}, cards:{}, redemptions:{}, pending:{}, balance:{}, proposals:{}, propPending:{}, verSwaps:[] });
let data = blank();
const loaded = {};
let currentItems = [];

const R = () => fam.rules;
const T = () => fam.times;
const kidsList = () => fam?.kids || [];
const kidById = id => kidsList().find(k => k.id === id);
const kidName = id => kidById(id)?.name ?? '—';
const kidColor = id => kidById(id)?.color ?? 'var(--ink)';
const kidAvatar = id => kidById(id)?.avatar || '🙂';
const catOf = t => fam.categories.find(c => c.id === t?.categoryId) || {name:'Altro', color:'#94a3b8'};
const slotOf = t => t < T().afternoon ? 'Mattina' : t < T().evening ? 'Pomeriggio' : 'Sera';
const SLOTS = () => [
  {name:'Mattina',    icon:'🌅', range:`${T().wake} – ${T().afternoon}`},
  {name:'Pomeriggio', icon:'☀️', range:`${T().afternoon} – ${T().evening}`},
  {name:'Sera',       icon:'🌙', range:`${T().evening} – ${T().bed}`},
];
// raggruppa un elenco per fascia (solo le fasce che hanno qualcosa), nell'ordine Mattina, Pomeriggio, Sera
const bySlot = (list, timeOf) => SLOTS().map(s => ({...s, items: list.filter(x => slotOf(timeOf(x)) === s.name)})).filter(g => g.items.length);
// intestazione di fascia per gli elenchi dei genitori
const slotHead = (s, right) => `<div class="slothead"><span>${s.icon} ${s.name} <small>${s.range}</small></span><small>${right}</small></div>`;

const isParent = () => me?.role === 'parent';
const col = (...p) => collection(db, 'families', fid, ...p);
const dref = (...p) => doc(db, 'families', fid, ...p);
const kidEmail = (kidId, ver) => `${fid}.${kidId}.${ver}@kids.${firebaseConfig.authDomain}`.toLowerCase();
const cardsOf = k => data.cards[k] || [];
