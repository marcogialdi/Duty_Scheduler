/* Legge il rapporto della notte (admin/reports/days/{oggi}) e dice se c'è qualcosa da guardare.
   Lo usa ogni mattina .github/workflows/rapporto.yml; si può lanciare anche a mano:
     node scripts/rapporto.mjs [aaaa-mm-gg]
   Serve un accesso in lettura a Firestore (GOOGLE_APPLICATION_CREDENTIALS con il ruolo «Visualizzatore Cloud Datastore»).
   Scrive il testo della segnalazione in RAPPORTO_FILE (predefinito: rapporto.md) e, su GitHub,
   problema=true|false e titolo=... in GITHUB_OUTPUT. */
import { appendFileSync, writeFileSync } from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { oggi } from '../shared/gioco.js';
import { PERCORSO_RAPPORTI } from '../src/notturna.js';

const giorno = process.argv[2] || oggi();
const it = s => s.split('-').reverse().join('/');
initializeApp({projectId: process.env.GCLOUD_PROJECT || 'duty-scheduler-bdd9e'});
const r = (await getFirestore().collection(PERCORSO_RAPPORTI).doc(giorno).get()).data();

let problema, titolo, testo;
if (!r){
  problema = true;
  titolo = `Migrazione: manca il rapporto della notte del ${it(giorno)}`;
  testo = `La chiusura di mezzanotte non ha scritto il rapporto \`${PERCORSO_RAPPORTI}/${giorno}\`.\n\n`
    + 'Probabilmente la funzione `chiusuraNotturna` non è partita o si è fermata: controllare i log in Google Cloud Console › Cloud Run functions › chiusuraNotturna › Log.';
} else {
  const c = r.confronto, ch = r.chiusure;
  problema = c.differenze > 0 || r.errori.length > 0;
  titolo = `Migrazione: notte del ${it(giorno)}, ${c.differenze} ${c.differenze === 1 ? 'differenza' : 'differenze'}`
    + (r.errori.length ? ` e ${r.errori.length} ${r.errori.length === 1 ? 'errore' : 'errori'}` : '');
  const v = Object.entries(r.versioni || {}).map(([k, n]) => `${k.replace(/_/g, '.')}: ${n.genitori} genitori, ${n.figli} figli`).join(' · ');
  testo = [
    `Rapporto della chiusura di mezzanotte del **${it(giorno)}** (giorno chiuso: ${it(r.ieri)}), in ${Math.round((r.durataMs || 0) / 1000)} s.`,
    '',
    `- Famiglie: ${r.famiglie}, figli: ${r.figli}`,
    `- In ombra: ${r.ombra.giorni} giorni calcolati per ${r.ombra.figli} figli`,
    `- Chiusi davvero dal server: ${ch.giorni} giorni per ${ch.figli} figli (${ch.famiglie} famiglie con l'interruttore acceso), ${ch.voci} voci; già chiusi da un telefono: ${ch.giaChiusi}`,
    `- Confronto con i telefoni: ${c.giorni} giorni, **${c.uguali} uguali**, ${c.spiegate} con differenze spiegate, **${c.differenze} con differenze da guardare**; ${c.inAttesa} in attesa che un telefono li chiuda`,
    `- Versioni dell'app: ${v || '—'}`,
  ];
  const da = r.dettagli.filter(d => !d.spiegazione), sp = r.dettagli.filter(d => d.spiegazione);
  const tab = list => ['| Famiglia | Figlio | Giorno | Voce | Server | Telefono | Spiegazione |', '| --- | --- | --- | --- | --- | --- | --- |',
    ...list.map(d => `| ${d.famiglia} | ${d.figlio} | ${it(d.giorno)} | \`${d.voce}\` | ${d.server ?? '—'} | ${d.telefono ?? '—'} | ${d.spiegazione || ''} |`)];
  if (da.length) testo.push('', '### Differenze da guardare', '', ...tab(da));
  if (sp.length) testo.push('', `<details><summary>Differenze spiegate (${sp.length})</summary>`, '', ...tab(sp), '', '</details>');
  if (r.dettagliTroncati) testo.push('', `_Elenco troncato: nel rapporto ci sono al massimo 200 dettagli._`);
  if (r.errori.length) testo.push('', '### Errori', '', ...r.errori.map(e => `- famiglia \`${e.famiglia}\`: ${e.messaggio}`));
  testo.push('', `Dettagli completi in Firestore: \`${PERCORSO_RAPPORTI}/${giorno}\`; i giorni diversi restano in \`families/{famiglia}/kids/{figlio}/shadow/{giorno}\`.`);
  testo = testo.join('\n');
}
testo += '\n\n_Segnalazione aperta in automatico da .github/workflows/rapporto.yml (docs/migrazione.md, «Verifica automatica»)._';
writeFileSync(process.env.RAPPORTO_FILE || 'rapporto.md', testo);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `problema=${problema}\ntitolo=${titolo}\n`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## ${titolo}\n\n${testo}\n`);
console.log(titolo);
// nei log solo i totali, mai codici di famiglie o figli (i log di un repository pubblico li vede chiunque)
if (r) console.log(JSON.stringify({famiglie: r.famiglie, figli: r.figli, ombra: r.ombra, chiusure: r.chiusure,
  confronto: r.confronto, errori: r.errori.length, durataMs: r.durataMs,
  versioni: Object.fromEntries(Object.entries(r.versioni || {}).map(([k, n]) => [k.replace(/_/g, '.'), n]))}));
console.log(problema ? 'C\'è qualcosa da guardare.' : 'Tutto in ordine.');
