'use strict';
/* Compiti di casa · stato dell'app e dispositivo */

/* =====================================================================
   DISPOSITIVO (cosa resta salvato su questo telefono/tablet)
   ===================================================================== */
const DEV_KEY = 'cdc.device';
let device = (() => { try { return JSON.parse(localStorage.getItem(DEV_KEY)) || null; } catch(e){ return null; } })();
function saveDevice(d){ device = d; d ? store('set', DEV_KEY, JSON.stringify(d)) : store('del', DEV_KEY); }

/* =====================================================================
   STATO
   ===================================================================== */
let fid = null, fam = null, me = null, busy = false;
let view = null, owner = null, subView = 'day', day = today(), swapPick = null;
const blank = () => ({ tasks:{}, sched:[], swaps:[], comps:[], rewards:[], verify:[], parents:[], invites:[],
                       kidState:{}, ledger:{}, cards:{}, redemptions:{}, pending:{}, balance:{}, proposals:{}, propPending:{} });
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
const isParent = () => me?.role === 'parent';
const col = (...p) => collection(db, 'families', fid, ...p);
const dref = (...p) => doc(db, 'families', fid, ...p);
const kidEmail = (kidId, ver) => `${fid}.${kidId}.${ver}@kids.${firebaseConfig.authDomain}`.toLowerCase();
const cardsOf = k => data.cards[k] || [];
