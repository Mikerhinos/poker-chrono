// PORTE 2 — ≥ 900 parties headless, 0 erreur JS.
// PORTE 4 — IA réellement graduée : score moyen ET taux de victoire IA
// strictement croissants facile < normal < difficile ; scores qui varient.
//
// Protocole headless : tick 100 ms, humain = swap aléatoire toutes les 1 s
// (même politique pour les 3 difficultés → le delta attribuable à l'IA).
// 300 parties / difficulté, temps de manche 20 s, seeds 1000..1299.
import { loadLogic, makeChecker } from './lib.mjs';

const G = loadLogic();
const { check, summary } = makeChecker('PORTE 2/4');

const N_PER_DIFF = 300;
const SEED0 = 1000;
const DIFFS = ['facile', 'normal', 'difficile'];

function runBatches() {
  const out = {};
  const allHuman = [];
  for (const d of DIFFS) {
    let humanSum = 0, aiSum = 0;
    let wins = { human: 0, ai: 0, draw: 0 };
    let errors = 0;
    const humanScores = [];
    for (let k = 0; k < N_PER_DIFF; k++) {
      const { st, errors: errs } = G.simulateGame({ difficulty: d, time: 20, seed: SEED0 + k });
      errors += errs.length;
      humanSum += st.result.human;
      aiSum += st.result.ai;
      wins[st.result.winner]++;
      humanScores.push(st.result.human);
      allHuman.push(st.result.human);
    }
    out[d] = {
      n: N_PER_DIFF, errors,
      avgHuman: humanSum / N_PER_DIFF,
      avgAI: aiSum / N_PER_DIFF,
      winAI: wins.ai / N_PER_DIFF,
      wins,
      distinctHuman: new Set(humanScores).size,
      minHuman: Math.min(...humanScores),
      maxHuman: Math.max(...humanScores)
    };
    console.log(`  ${d}: score IA moyen ${out[d].avgAI.toFixed(2)}, score humain moyen ${out[d].avgHuman.toFixed(2)}, ` +
      `victoires IA ${wins.ai}/${N_PER_DIFF} (${(100 * out[d].winAI).toFixed(1)}%), ` +
      `humain ${wins.human}, égalité ${wins.draw}, erreurs JS ${errors}, scores humains distincts ${out[d].distinctHuman}`);
  }
  return { out, allHuman };
}

const t0 = Date.now();
const { out, allHuman } = runBatches();
const wall = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n  total : ${DIFFS.length * N_PER_DIFF} parties en ${wall} s`);

// v2.1 (item 4 du brief) — stats globales des 900 scores humains :
// min, P1 (90e percentile — base du cap d'anti-abus GO), médiane, max.
const sorted = allHuman.slice().sort((a, b) => a - b);
const quantile = (q) => {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};
const stats = {
  n: sorted.length,
  min: sorted[0],
  p1: quantile(0.90), // P1 = 90e percentile des scores humains
  median: quantile(0.50),
  max: sorted[sorted.length - 1]
};
console.log(`  stats 900 parties (humains) : min=${stats.min}, P1 (90e pct)=${stats.p1.toFixed(2)}, ` +
  `médiane=${stats.median.toFixed(2)}, max=${stats.max}`);
// Décision d'anti-abus (item 5 du brief) : on garde 85 UNIQUEMENT si
// min + 85 <= P1 - 30 ; sinon cap = floor(P1 - min - 30).
const cap85ok = stats.min + 85 <= stats.p1 - 30;
console.log(`  GO anti-abus : min + 85 = ${stats.min + 85} vs P1 - 30 = ${stats.p1.toFixed(2)} → ` +
  (cap85ok ? 'cap 85 conservé'
    : `cap recalibré = floor(P1 - min - 30) = ${Math.floor(stats.p1 - stats.min - 30)}`));

const total = DIFFS.reduce((s, d) => s + out[d].n, 0);
const totalErrors = DIFFS.reduce((s, d) => s + out[d].errors, 0);

check('PORTE 2 : ≥ 900 parties jouées', total >= 900, `${total} parties`);
check('PORTE 2 : 0 erreur JS', totalErrors === 0, `${totalErrors} erreur(s)`);

// PORTE 4 — gradients stricts (score ET victoire)
const f = out.facile, n = out.normal, h = out.difficile;
check('PORTE 4 : score IA moyen croissant', f.avgAI < n.avgAI && n.avgAI < h.avgAI,
  `${f.avgAI.toFixed(2)} < ${n.avgAI.toFixed(2)} < ${h.avgAI.toFixed(2)}`);
check('PORTE 4 : taux de victoire IA croissant', f.winAI < n.winAI && n.winAI < h.winAI,
  `${(100 * f.winAI).toFixed(1)}% < ${(100 * n.winAI).toFixed(1)}% < ${(100 * h.winAI).toFixed(1)}%`);

// Scores qui varient (ni égalités systématiques ni scores constants)
check('PORTE 4 : scores non constants (≥ 5 valeurs distinctes par difficulté)',
  f.distinctHuman >= 5 && n.distinctHuman >= 5 && h.distinctHuman >= 5,
  `${f.distinctHuman} / ${n.distinctHuman} / ${h.distinctHuman} valeurs distinctes`);
check('PORTE 4 : pas d’égalités systématiques (≤ 50% égalités par difficulté)',
  f.wins.draw <= N_PER_DIFF / 2 && n.wins.draw <= N_PER_DIFF / 2 && h.wins.draw <= N_PER_DIFF / 2,
  `égalités : ${f.wins.draw}, ${n.wins.draw}, ${h.wins.draw} / ${N_PER_DIFF}`);

const ok = summary('PORTE 2/4');
console.log(JSON.stringify({ total, totalErrors, wall, stats, results: out }, null, 2));
process.exit(ok ? 0 : 1);
