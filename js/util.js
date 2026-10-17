'use strict';
/* Compiti di casa · funzioni di servizio: date, testi, salvataggi a gruppi, messaggi */

/* =====================================================================
   UTILITY
   ===================================================================== */
const $ = id => document.getElementById(id);
function store(op,k,v){ try{ return op==='get' ? localStorage.getItem(k) : op==='del' ? localStorage.removeItem(k) : localStorage.setItem(k,v); }catch(e){ return null; } }
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseISO = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d, 12); };
const addDays = (s,n) => { const d = parseISO(s); d.setDate(d.getDate()+n); return iso(d); };
const today = () => iso(new Date());
const isoWeekday = s => parseISO(s).getDay() || 7;
const quarterKey = s => { const d = parseISO(s); return d.getFullYear() + 'Q' + (Math.floor(d.getMonth()/3)+1); };
// date sempre in formato gg/mm/aaaa
const fmtDate = s => { if (!s) return ''; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };
const fmtMs = t => { const d = new Date(t); return fmtDate(iso(d)); };
const weekdayName = s => parseISO(s).toLocaleDateString('it-IT',{weekday:'long'});
const parseIT = s => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((s || '').trim()); if (!m) return null;
  const ds = `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  return iso(parseISO(ds)) === ds ? ds : null;
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ms = ts => ts?.toMillis ? ts.toMillis() : Date.now();
const amtCls = a => a > 0 ? 'p' : a < 0 ? 'm' : 'z';
const sign = a => (a > 0 ? '+' : '') + a;
const rid = () => Math.random().toString(36).slice(2, 8);
const docs = s => s.docs.map(d => ({id:d.id, ...d.data()}));
// Firebase limita le verifiche delle regole per ogni salvataggio di gruppo (circa 20):
// i salvataggi grandi (esempi, eliminazione famiglia) si dividono in gruppi piccoli
const CHUNK = 6;
function chunkedBatch(){
  const ops = [];
  return {
    set: (r, d, o) => ops.push(b => o ? b.set(r, d, o) : b.set(r, d)),
    update: (r, d) => ops.push(b => b.update(r, d)),
    delete: r => ops.push(b => b.delete(r)),
    async commit(){
      for (let i = 0; i < ops.length; i += CHUNK){ const b = writeBatch(db); ops.slice(i, i + CHUNK).forEach(f => f(b)); await b.commit(); }
    },
  };
}
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove('show'),3200); }
const AUTH_MSG = {
  'auth/invalid-credential':'Credenziali errate', 'auth/wrong-password':'Credenziali errate', 'auth/user-not-found':'Credenziali errate',
  'auth/too-many-requests':'Troppi tentativi: riprova tra qualche minuto', 'auth/email-already-in-use':'Questa email ha già un account: usa "Entra come genitore"',
  'auth/weak-password':'Password troppo corta (almeno 6 caratteri)', 'auth/invalid-email':'Email non valida',
  'auth/operation-not-allowed':'Accesso con email non attivo in Firebase (Authentication › Metodo di accesso)',
  'auth/network-request-failed':'Nessuna connessione', 'auth/requires-recent-login':'Per sicurezza esci e rientra, poi riprova',
  'permission-denied':'Permesso negato', 'unavailable':'Connessione assente: riprova tra poco',
};
function fail(err){ console.error(err); toast('Errore: ' + (AUTH_MSG[err?.code] || err?.code || err?.message || err)); }

/* campi data: si scrive gg/mm/aaaa (le barre si inseriscono da sole) oppure si tocca 📅 */
document.querySelectorAll('.datef').forEach(box => {
  const txt = box.querySelector('.dtxt');
  txt.placeholder = 'gg/mm/aaaa'; txt.inputMode = 'numeric'; txt.maxLength = 10; txt.autocomplete = 'off';
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'btn dbtn'; btn.setAttribute('aria-label', 'Apri il calendario');
  btn.innerHTML = '📅<input type="date" class="dpick" tabindex="-1" aria-hidden="true">';
  box.appendChild(btn);
  const pick = btn.querySelector('.dpick');
  const sync = () => { pick.value = parseIT(txt.value) || today(); };
  pick.addEventListener('focus', sync);
  pick.addEventListener('click', e => { sync(); try { pick.showPicker(); e.preventDefault(); } catch(_){} });
  pick.addEventListener('change', () => { if (pick.value) txt.value = fmtDate(pick.value); });
  txt.addEventListener('input', e => {
    if (e.inputType?.startsWith('delete')) return;
    let v = txt.value.replace(/[^\d]/g, '').slice(0, 8);
    if (v.length > 4) v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
    else if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
    txt.value = v;
  });
});
const dateVal = id => { const v = $(id).value.trim(); return v ? parseIT(v) : ''; };
const setDate = (id, ds) => { $(id).value = fmtDate(ds); };
