// PORTE GO (UI, temps réel) — bouton « Finish! » (clé i18n go_btn) piloté par CDP sur le vrai DOM.
// Scénario : 90 s → GO désactivé à t<5 s → activé à t≈5 s → clic → bonus 16 (cap),
// détail affiché (plateau + bonus), titre non vide, double-clic idempotent,
// puis fin normale (10 s) → bonus 0.
// Usage : node test/run-headless.mjs test/go-ui.mjs [port]
import { connect, evalJs } from './cdp.mjs';
import { fileURLToPath } from 'node:url';

const PAGE_URL = 'file:///' + fileURLToPath(new URL('../index.html', import.meta.url)).replace(/\\/g, '/');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdp = await connect(process.argv[2] || '127.0.0.1:9349');
let pass = 0, fail = 0;
const check = (label, ok, detail = '') => {
  if (ok) { pass++; console.log('  ok  ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? ' — ' + detail : '')); }
};
async function page(expr) { return evalJs(cdp, expr); }

async function waitForPage() {
  for (let i = 0; i < 100; i++) {
    const r = await page(`(document.readyState === 'complete' && window.G && window.G.UI) ? 'ready' : 'loading'`);
    if (r === 'ready') return;
    await sleep(200);
  }
  throw new Error('page jamais prête');
}

const run = async () => {
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Page.navigate', { url: PAGE_URL });
  await waitForPage();

  const started = await page(`(() => {
    document.querySelector('#time').value = '90';
    document.querySelector('#start').click();
    return !document.querySelector('#start').disabled;
  })()`);
  check('partie lancée (90 s)', started === true);

  // GO désactivé avant t = 5 s
  const early = await page(`(() => {
    const b = document.querySelector('#go');
    return { disabled: b.disabled, elapsed: window.G.UI.goInfo().elapsedMs };
  })()`);
  check('GO désactivé à t<5 s', early.disabled === true && early.elapsed < 5000, JSON.stringify(early));

  // Attendre l'activation (t≈5 s)
  let info = null;
  for (let i = 0; i < 120; i++) {
    info = await page(`(() => {
      const b = document.querySelector('#go');
      return { disabled: b.disabled, e: window.G.UI.goInfo() };
    })()`);
    if (!info.disabled) break;
    await sleep(50);
  }
  check('GO activé à t≈5 s (5000–5500 ms)', info && info.e.elapsedMs >= 5000 && info.e.elapsedMs <= 5500,
    info ? String(info.e.elapsedMs) : 'jamais activé');

  // Clic GO
  const clicked = await page(`(() => {
    const b = document.querySelector('#go');
    if (b.disabled) return false;
    b.click();
    return true;
  })()`);
  check('clic GO effectué', clicked === true);
  await sleep(250);

  const g1 = await page(`(() => {
    const i = window.G.UI.goInfo();
    return {
      over: i.over, bonus: i.bonus, total: i.totalHuman, human: i.human,
      finalScores: document.querySelector('#final-scores').textContent,
      finalTitle: document.querySelector('#final-title').textContent,
      rowsHuman: document.querySelectorAll('#rows-human .row-line').length,
      rowsAI: document.querySelectorAll('#rows-ai .row-line').length
    };
  })()`);
  check('fin affichée après GO (plateaux décomposés)', g1.over === true && g1.rowsHuman === 3 && g1.rowsAI === 3,
    JSON.stringify(g1));
  check('bonus = 16 pts (cap v2.1)', g1.bonus === 16, String(g1.bonus));
  check('total = plateau + 16', g1.total === g1.human + 16, `human=${g1.human}, total=${g1.total}`);
  check('détail en fin : bonus affiché avec les plateaux',
    /bonus/i.test(g1.finalScores) && g1.finalScores.includes('16'), g1.finalScores);
  check('titre de fin non vide (W3C)', g1.finalTitle.length > 0, g1.finalTitle);

  // Double-clic : idempotent
  const again = await page(`(() => {
    document.querySelector('#go').click();
    const i = window.G.UI.goInfo();
    return { bonus: i.bonus, over: i.over };
  })()`);
  check('double-clic : 1 seul bonus (idempotent)', again.bonus === 16 && again.over === true, JSON.stringify(again));

  // Fin normale → bonus 0
  await page(`(() => {
    document.querySelector('#time').value = '10';
    document.querySelector('#start').click();
    return true;
  })()`);
  let g2 = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 15000) {
    g2 = await page('window.G.UI.goInfo()');
    if (g2 && g2.over) break;
    await sleep(200);
  }
  check('fin normale : bonus 0', g2 && g2.over === true && g2.bonus === 0 && g2.totalHuman === g2.human,
    g2 ? JSON.stringify(g2) : 'jamais terminé');

  console.log(`go-ui : ${pass} ok, ${fail} fail`);
  process.exit(fail ? 1 : 0);
};

await run();
