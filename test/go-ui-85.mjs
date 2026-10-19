// PORTE GO (UI, cas tardif) — « 5 pts à t=85 s » : le GO au bout de 85 s
// rapporte exactement 5 pts (90 − 85 = 5 s restantes × 1 pt).
// Usage : node test/run-headless.mjs test/go-ui-85.mjs [port]
import { connect, evalJs } from './cdp.mjs';
import { fileURLToPath } from 'node:url';

const PAGE_URL = 'file:///' + fileURLToPath(new URL('../index.html', import.meta.url)).replace(/\\/g, '/');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdp = await connect(process.argv[2] || '127.0.0.1:9350');
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

  // Attendre t ≥ 85 s (clic juste après le franchissement)
  let info = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 95000) {
    info = await page('window.G.UI.goInfo()');
    if (info && info.elapsedMs >= 85000) break;
    await sleep(100);
  }
  check('GO toujours actif a t=85 s (jusqua la fin)', info && !info.over && info.elapsedMs >= 85000,
    info ? JSON.stringify({ e: info.elapsedMs, over: info.over }) : 'jamais atteint');

  const clicked = await page(`(() => {
    const b = document.querySelector('#go');
    if (b.disabled) return false;
    b.click();
    return true;
  })()`);
  check('clic GO effectué (t≈85 s)', clicked === true);
  await sleep(250);

  const g = await page(`(() => {
    const i = window.G.UI.goInfo();
    return { over: i.over, bonus: i.bonus, total: i.totalHuman, human: i.human,
      finalScores: document.querySelector('#final-scores').textContent };
  })()`);
  check('GO à t=85 s : bonus = 5 pts', g.over === true && g.bonus === 5, JSON.stringify(g));
  check('total = plateau + 5', g.total === g.human + 5, `human=${g.human}, total=${g.total}`);
  check('détail en fin : 5 pts de bonus affichés', /bonus/i.test(g.finalScores) && g.finalScores.includes('5'), g.finalScores);

  console.log(`go-ui-85 : ${pass} ok, ${fail} fail`);
  process.exit(fail ? 1 : 0);
};

await run();
