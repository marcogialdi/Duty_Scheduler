/* BeBeans · prova delle Cloud Functions nell'emulatore (cartella ../functions).
   Controlla che le funzioni si carichino come farebbe Firebase alla pubblicazione e rispondano nella regione giusta.
   Si lancia con `npm run test:functions` da questa cartella (vedi README.md). */
const PROGETTO = 'demo-compiti', REGIONE = 'europe-west1';
const url = nome => `http://127.0.0.1:5011/${PROGETTO}/${REGIONE}/${nome}`;
let ok = 0, errori = 0;
async function prova(nome, fn){
  try { await fn(); ok++; console.log('  ok     ', nome); }
  catch(e){ errori++; console.log('  ERRORE ', nome, '→', e.message); }
}
const chiama = (nome, data = {}, headers = {}) =>
  fetch(url(nome), {signal: AbortSignal.timeout(30000), method: 'POST', headers: {'Content-Type': 'application/json', ...headers}, body: JSON.stringify({data})});

// token di prova: l'emulatore li legge senza controllare la firma (nel vero Firebase servono accesso e App Check veri)
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const adesso = Math.floor(Date.now() / 1000);
const jwt = dati => `${b64({alg: 'none', typ: 'JWT'})}.${b64({iat: adesso, exp: adesso + 3600, ...dati})}.`;
const ACCESSO = uid => ({Authorization: 'Bearer ' + jwt({sub: uid, user_id: uid, aud: PROGETTO, iss: `https://securetoken.google.com/${PROGETTO}`, auth_time: adesso})});
const APP_CHECK = {'X-Firebase-AppCheck': jwt({sub: '1:106420224624:web:prova', aud: [`projects/${PROGETTO}`], iss: 'https://firebaseappcheck.googleapis.com/106420224624'})};
const errore = async r => (await r.json()).error?.status;

console.log('Cloud Functions nell\'emulatore');
await prova('ping con accesso e App Check risponde con regione e giorno di Roma', async () => {
  const r = await chiama('ping', {}, {...ACCESSO('par'), ...APP_CHECK});
  const j = await r.json();
  if (!r.ok || j.result?.ok !== true || j.result.regione !== REGIONE || !/^\d{4}-\d{2}-\d{2}$/.test(j.result.oggi))
    throw new Error(`risposta ${r.status} ${JSON.stringify(j)}`);
});
await prova('ping senza accesso (ma con App Check) → negato', async () => {
  const r = await chiama('ping', {}, APP_CHECK);
  if (r.status !== 401 || await errore(r) !== 'UNAUTHENTICATED') throw new Error(`risposta ${r.status}`);
});
await prova('ping senza App Check (uno script fuori dalla pagina pubblicata) → negato', async () => {
  const r = await chiama('ping', {}, ACCESSO('par'));
  if (r.status !== 401 || await errore(r) !== 'UNAUTHENTICATED') throw new Error(`risposta ${r.status}`);
});
await prova('ping non esiste in un\'altra regione', async () => {
  const r = await fetch(`http://127.0.0.1:5011/${PROGETTO}/us-central1/ping`, {signal: AbortSignal.timeout(30000), method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{"data":{}}'});
  if (r.ok) throw new Error('trovata anche in us-central1');
});

console.log(`\n${ok} ok, ${errori} errori`);
process.exit(errori ? 1 : 0);
