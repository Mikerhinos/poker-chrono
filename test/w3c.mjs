// PORTE W3C (v2.1) — vérifications déterministes + validation Nu (réseau si dispo).
//  1) 0 id en double dans le document
//  2) 0 heading vide au parse statique (h2#final-title porte un texte de repli,
//     remplacé par le JS à la fin de partie)
//  3) API Nu (validator.w3.org/nu) si le réseau est disponible, sinon déclaré.
// Usage : node test/w3c.mjs
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.join(import.meta.dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (label, ok, detail = '') => {
  if (ok) { pass++; console.log('  ok  ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? ' — ' + detail : '')); }
};

// 1) ids en double
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
check('0 id en double (' + ids.length + ' ids au total)', dup.length === 0,
  dup.length ? 'doublons : ' + [...new Set(dup)].join(', ') : '');

// 2) headings vides (parse statique) : un heading est vide s'il ne contient
//    aucun texte hors balises.
const heads = [...html.matchAll(/<(h[1-6])([^>]*)>([\s\S]*?)<\/\1>/g)];
let emptyHeads = 0;
const emptyList = [];
for (const m of heads) {
  const textOnly = m[3].replace(/<[^>]*>/g, '').trim();
  if (!textOnly) { emptyHeads++; emptyList.push((m[2].match(/id="([^"]+)"/) || ['', '?'])[1]); }
}
check('0 heading vide (' + heads.length + ' headings au parse statique)', emptyHeads === 0,
  emptyHeads ? 'vides : ' + emptyList.join(', ') : '');

// 3) API Nu (optionnelle — réseau)
try {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  const res = await fetch('https://validator.w3.org/nu/?out=json', {
    method: 'POST',
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: html,
    signal: ctrl.signal
  });
  clearTimeout(t);
  const data = await res.json();
  const errors = (data.messages || []).filter((x) => x.type === 'error');
  const infos = (data.messages || []).filter((x) => x.type === 'info' || x.type === 'warning');
  check('W3C Nu : 0 erreur (' + infos.length + ' info/warning)', errors.length === 0);
  for (const e of errors.slice(0, 10)) console.log('  [W3C-erreur] ' + e.message + ' (L' + e.lastLine + ')');
  for (const i of infos.slice(0, 10)) console.log('  [W3C-info] ' + i.message);
} catch (err) {
  console.log('  info W3C Nu API inaccessible (' +
    (err.name === 'AbortError' ? 'timeout 20 s' : err.message) +
    ') — validation déclarée ; les vérifications statiques ci-dessus sont déterministes.');
}

console.log(`w3c : ${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
