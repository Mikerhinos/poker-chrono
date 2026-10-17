// G12 — Entropie du seed : parties réelles uniques (128 bits CSPRNG),
// override 32 bits déterministe inchangé (fix H1, PoC L34K).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_HTML = join(__dirname, '..', 'index.html');
const OUT = join(__dirname, 'results', 'porte-12.log');
mkdirSync(join(__dirname, 'results'), { recursive: true });

const lines = [];
let failures = 0;
function check(name, ok, info) {
  if (!ok) failures++;
  lines.push((ok ? '[ OK ] ' : '[ FAIL] ') + name + (info !== undefined ? ' — ' + info : ''));
}

async function main() {
  const { connect, evalJs } = await import('./cdp.mjs');
  const cdp = await connect(process.argv[2] || '127.0.0.1:9322');
  try {
    const r = await cdp.send('Page.navigate', { url: 'file:///' + INDEX_HTML.replace(/\\\\/g, '/') });
    if (!r || r.error) throw new Error('Page.navigate a échoué: ' + JSON.stringify(r));
    const deadline = Date.now() + 15000;
    let ready = false;
    while (Date.now() < deadline && !ready) {
      try {
        ready = (await evalJs(cdp, "(document.readyState === 'complete' && window.G && window.G.version === '2.0.0' && window.G.UI) ? 'ready' : 'loading'")) === 'ready';
      } catch (e) { /* pas prêt */ }
      if (!ready) await new Promise((res) => setTimeout(res, 200));
    }
    if (!ready) throw new Error('ready timeout');
    // Référence locale du chemin override v1 : la variante mulberry32 exacte du jeu
    // (corps « a >>> 7 »), Fisher-Yates 32 cartes, ordre s(0..3) × r(7..14).
    function mulberry32(seed) {
      let a = seed >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (a >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const RANKS = [7, 8, 9, 10, 11, 12, 13, 14];
    function refDeck(seed) {
      const deck = [];
      for (const s of [0, 1, 2, 3]) for (const r of RANKS) deck.push({ r, s });
      const rng = mulberry32(seed ^ 0x9e3779b9);
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
      }
      return JSON.stringify(deck);
    }
    const mkDeck = 'JSON.stringify((function (o) { const s = G.createGame(o); return [...s.boards.human.flat(), ...s.boards.ai.flat(), ...s.deck]; })(' + '{ time: 20' + (', seed: ' + '$SEED') + '})' + ')';

    // a) 2 parties « réelles » (sans seed) → decks différents (128 bits CSPRNG).
    const dA = await evalJs(cdp, mkDeck.replace('{ time: 20', '{ time: 20').replace(', seed: $SEED', ''));
    const dB = await evalJs(cdp, mkDeck.replace(', seed: $SEED', ''));
    check('decks de 32 cartes', JSON.parse(dA).length === 32 && JSON.parse(dB).length === 32);
    check('2 parties réelles → decks différents', dA !== dB);

    // b) même seed 32 bits d override → decks identiques (déterminisme conservé).
    const dS = await evalJs(cdp, mkDeck.replace('$SEED', '1234'));
    const dS2 = await evalJs(cdp, mkDeck.replace('$SEED', '1234'));
    check('même seed override → decks identiques', dS === dS2);

    // c) override 32 bits = chemin mulberry32 v1 inchangé (référence locale).
    check('override seed 1234 = deck mulberry32 v1 de référence', dS === refDeck(1234));

    // d) seeds invalides (négatif, non entier) → chemin réel, pas d exception.
    const bad = await evalJs(cdp, 'JSON.stringify({ a: ' + mkDeck.replace('$SEED', '-1').replace('JSON.stringify', 'JSON.stringify') + ', b: ' + mkDeck.replace('$SEED', '3.5') + ' })');
    const bv = JSON.parse(bad);
    check('seed négatif → chemin réel (≠ deck override)', bv.a !== dS);
    check('seed non entier → chemin réel (≠ deck override)', bv.b !== dS);
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
