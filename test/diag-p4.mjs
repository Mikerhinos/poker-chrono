// Diagnostic PORTE 4 (v2.1) : normal vs difficile, même seed, game-by-game.
// Usage : node test/diag-p4.mjs
import { loadLogic } from './lib.mjs';
const G = loadLogic();

const N = 300;
const rows = [];
for (let k = 0; k < N; k++) {
  const mk = (d) => {
    const { st } = G.simulateGame({ difficulty: d, time: 20, seed: 1000 + k });
    return { h: st.result.human, a: st.result.ai, w: st.result.winner, m: st.aiMoves };
  };
  const n = mk('normal'), h = mk('difficile');
  rows.push({ k, hn: n.h, an: n.a, mn: n.m, ah: h.a, mh: h.m, wn: n.w, wh: h.w });
}

let hardBetter = 0, equal = 0, hardWorse = 0;
let aiWinsN = 0, aiWinsH = 0;
for (const r of rows) {
  if (r.ah > r.an) hardBetter++;
  else if (r.ah === r.an) equal++;
  else hardWorse++;
  if (r.wn === 'ai') aiWinsN++;
  if (r.wh === 'ai') aiWinsH++;
}
const avg = (f) => rows.reduce((s, r) => s + f(r), 0) / N;
console.log(`parties: ${N} (même seed normal/difficile, time=20s)`);
console.log(`victoires IA : normal ${aiWinsN}/${N}  difficile ${aiWinsH}/${N}`);
console.log(`score IA final : difficile > normal ${hardBetter}, égal ${equal}, < ${hardWorse}`);
console.log(`moyennes : humain ${avg((r) => r.hn).toFixed(2)}, IA normal ${avg((r) => r.an).toFixed(2)} (coups ${avg((r) => r.mn).toFixed(1)}), IA difficile ${avg((r) => r.ah).toFixed(2)} (coups ${avg((r) => r.mh).toFixed(1)})`);
const flips = rows.filter((r) => r.wn !== r.wh);
console.log(`\nflips de résultat (normal vs difficile) : ${flips.length}`);
for (const r of flips) console.log(`  k=${r.k} humain=${r.hn} | normal ${r.an} (${r.wn}, ${r.mn} coups) | difficile ${r.ah} (${r.wh}, ${r.mh} coups)`);
