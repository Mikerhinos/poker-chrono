// G9 — Barème des 60 plateaux × 30 seeds (1000..1029), via CDP (règle R).
// v2 : lecture via l état retourné par G.createGame (objet par appel) + G.UI pour la page.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_HTML = join(__dirname, '..', 'index.html');
const OUT = join(__dirname, 'results', 'porte-9.log');
mkdirSync(join(__dirname, 'results'), { recursive: true });

const lines = [];
let failures = 0;
function check(name, ok, info) {
  if (!ok) failures++;
  lines.push((ok ? '[ OK ] ' : '[ FAIL] ') + name + (info !== undefined ? ' — ' + info : ''));
}

async function main() {
  const { connect, evalJs } = await import('./cdp.mjs');
  const cdp = await connect(process.argv[2] || '127.0.0.1:9355');
  try {
    const r = await cdp.send('Page.navigate', { url: 'file:///' + INDEX_HTML.replace(/\\\\/g, '/') });
    if (!r || r.error) throw new Error('Page.navigate a échoué: ' + JSON.stringify(r));
    const deadline = Date.now() + 15000;
    let ready = false;
    while (Date.now() < deadline && !ready) {
      try {
        ready = (await evalJs(cdp, "(document.readyState === 'complete' && window.G && window.G.version === '2.1.1' && window.G.UI) ? 'ready' : 'loading'")) === 'ready';
      } catch (e) { /* pas prêt */ }
      if (!ready) await new Promise((res) => setTimeout(res, 200));
    }
    if (!ready) throw new Error('ready timeout');
    let allOk = true;
    const perSeed = [];
    for (let seed = 1000; seed <= 1029; seed++) {
      const expr = '(() => { const st = G.createGame({ time: 100000, seed: ' + seed + ' }); const out = []; for (const who of ["human", "ai"]) { const b = st.boards[who]; const bd = G.boardBreakdown(b); const sum = b.reduce((t, row) => t + G.rowScore(row), 0); const bs = G.boardScore(b); const ok = bd.reduce((t, r) => t + r.score, 0) === sum && bs === sum; out.push({ who, score: bs, rowSum: sum, bdSum: bd.reduce((t, r) => t + r.score, 0), ok }); } return JSON.stringify(out); })()';
      const v = await evalJs(cdp, expr);
      const boards = JSON.parse(typeof v === 'string' ? v : v.value);
      const okAll = boards.every((b) => b.ok);
      if (!okAll) allOk = false;
      perSeed.push('seed ' + seed + ': h=' + boards[0].score + ' ia=' + boards[1].score + ' ' + (okAll ? 'OK' : 'KO'));
    }
    lines.unshift('== G9 — 30 seeds × 2 plateaux, barème interne cohérent (v2) ==');
    lines.push('file: ' + INDEX_HTML);
    lines.push(...perSeed);
    check('60 plateaux : somme des lignes = boardScore = barème', allOk);
  } finally {
    try { cdp.close(); } catch (e) {}
  }
  lines.push('FAILURES: ' + failures);
  lines.push('RESULT: ' + (failures === 0 ? 'OK' : 'KO'));
  writeFileSync(OUT, lines.join('\n') + '\n', 'utf-8');
  console.log(lines.join('\n'));
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error('ERREUR:', e.message); process.exit(1); });
