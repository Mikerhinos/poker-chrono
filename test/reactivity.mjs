// PORTE RÉACTIVITÉ (v2.1, point 3 du brief) — test par contrôle CDP.
// Preuve de la cause racine : 1 clic = 1 changement d'état + feedback visuel
// immédiat (même tick). Avant le fix (baseline v2.0.0), le PREmier clic
// bascule l'état à l'envers par rapport à l'affichage (le son est ON par
// défaut ; le clic met OFF) et aucun son ne part au premier geste (politique
// autoplay : le contexte n'est armé que par le listener capture L899, qui
// respecte l'état — donc OFF). Ce test ÉCHEC sur la baseline, PASSE sur le fix.
//
// Usage : node test/run-headless.mjs test/reactivity.mjs [port] [index.html]
import { connect, evalJs } from './cdp.mjs';
import { fileURLToPath } from 'node:url';

const IDX = process.argv[3] ? process.argv[3].replace(/\\/g, '/')
  : fileURLToPath(new URL('../index.html', import.meta.url)).replace(/\\/g, '/');
const PAGE_URL = 'file:///' + IDX;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdp = await connect(process.argv[2] || '127.0.0.1:9348');
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
  const jsErrors = [];
  cdp.setEventHandler((ev) => {
    if (ev.method === 'Runtime.exceptionThrown') jsErrors.push(JSON.stringify(ev.params.exceptionDetails));
  });
  await cdp.send('Page.navigate', { url: PAGE_URL });
  await waitForPage();

  const st0 = await page(`JSON.stringify({
    audio: !!window.G.AUDIO,
    ctx: !!(window.G.AUDIO && window.G.AUDIO.state && window.G.AUDIO.state.ctx),
    ready: !!(window.G.AUDIO && typeof window.G.AUDIO.ready === 'function' && window.G.AUDIO.ready())
  })`);
  const s0 = JSON.parse(st0);
  check('état initial : contexte audio pas encore créé (aucun geste)', s0.ctx === false && s0.ready === false,
    st0);

  // --- 1er clic sur « Musique » : le clic ARME le son (ON affiché → ON reste).
  const r1 = await page(`(() => {
    const b = document.querySelector('#music-toggle');
    b.click();
    return {
      musicOn: window.G.AUDIO.state.musicOn,
      ctx: !!window.G.AUDIO.state.ctx,
      gain: window.G.AUDIO.state.musicGain ? window.G.AUDIO.state.musicGain.gain.value : 0,
      cls: b.className
    };
  })()`);
  check('1er clic musique : état = ON (le clic ne coupe pas l’état affiché)', r1.musicOn === true,
    JSON.stringify(r1));
  check('1er clic musique : contexte créé + gain > 0 (même tick, feedback immédiat)',
    r1.ctx === true && r1.gain > 0, JSON.stringify(r1));
  check('1er clic musique : feedback visuel immédiat (.on sur le bouton)', r1.cls.includes('on'), r1.cls);

  // --- 1er clic sur « SFX » : audible.
  const r2 = await page(`(() => {
    const b = document.querySelector('#sfx-toggle');
    b.click();
    return {
      sfxOn: window.G.AUDIO.state.sfxOn,
      gain: window.G.AUDIO.state.sfxGain ? window.G.AUDIO.state.sfxGain.gain.value : 0,
      cls: b.className
    };
  })()`);
  check('1er clic SFX : état ON + gain > 0', r2.sfxOn === true && r2.gain > 0, JSON.stringify(r2));

  // --- Le contexte passe à « running » (resume), et le feedback visuel suit.
  let ready = false;
  for (let i = 0; i < 40; i++) {
    ready = await page(`!!(window.G.AUDIO && typeof window.G.AUDIO.ready === 'function' && window.G.AUDIO.ready())`);
    if (ready) break;
    await sleep(50);
  }
  check('contexte audio « running » atteint', ready === true);
  await sleep(300);
  const live = JSON.parse(await page(`JSON.stringify({
    m: document.querySelector('#music-toggle').className,
    s: document.querySelector('#sfx-toggle').className
  })`));
  check('feedback visuel immédiat : .on sur musique + SFX', live.m.includes('on') && live.s.includes('on'),
    JSON.stringify(live));

  // --- Clics suivants : 1 clic = 1 changement d'état, feedback cohérent.
  const seq = JSON.parse(await page(`(() => {
    const b = document.querySelector('#music-toggle');
    const out = [];
    for (let i = 0; i < 3; i++) { b.click(); out.push(window.G.AUDIO.state.musicOn); }
    return JSON.stringify(out);
  })()`));
  check('3 clics consécutifs : 3 basculements (OFF/ON/OFF)', JSON.stringify(seq) === JSON.stringify([false, true, false]),
    JSON.stringify(seq));
  const offReflected = await page(`(() => document.querySelector('#music-toggle').className.includes('on'))()`);
  check('état final OFF reflété sur le bouton (aucun état fantôme)', offReflected === false);

  check('0 exception JS pendant la séquence', jsErrors.length === 0, String(jsErrors.length));
};

const ok = await run();
console.log(`reactivity : ${pass} ok, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
