/* Copia il modulo condiviso dell'app (js/shared/gioco.js) dentro functions/shared/, perché Firebase
   carica sul server solo il contenuto di questa cartella. Parte da solo prima dei test (pretest) e
   prima di ogni pubblicazione (predeploy in firebase.json). La copia non va su GitHub (.gitignore):
   l'originale è uno solo, quello dell'app. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const da = new URL('../../js/shared/gioco.js', import.meta.url);
const a = new URL('../shared/gioco.js', import.meta.url);
mkdirSync(new URL('../shared/', import.meta.url), {recursive: true});
writeFileSync(a, '// COPIA GENERATA da js/shared/gioco.js (npm run condiviso): non modificare qui.\n' + readFileSync(da, 'utf8'));
console.log('Modulo condiviso copiato in functions/shared/gioco.js');
