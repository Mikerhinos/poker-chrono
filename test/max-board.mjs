// POLE 3 — Max théorique d'un plateau (v2.1, 52 cartes).
// Re-déduction propre (aucune constante 1500/1501 dans le code — valeur dérivée).
//
// ANALYSE (borne supérieure + construction) :
//   - Un plateau = 3 lignes × 5 cartes (15 cartes distinctes tirées des 52).
//   - rowScore(ligne) ∈ {0} ∪ HAND_SCORES, max(HAND_SCORES) = 500 (quinte flush).
//   - Borne sup : 3 × 500 = 1500.
//   - Construction atteignant 1500 avec 15 cartes distinctes :
//       L1 : 2-3-4-5-6  pique  (quinte flush, 500)
//       L2 : 7-8-9-10-V pique  (quinte flush, 500)
//       L3 : 2-3-4-5-6  coeur  (quinte flush, 500)
//     → 15 cartes distinctes (10 pique + 5 coeur), total = 1500.
//   - Max théorique d'un plateau v2.1 = 1500.
//
// SIMULATION : deals aléatoires seedés → max observé ≤ 1500 (borne respectée),
// distribution rapportée (min, P1, médiane, max).
import { loadLogic, makeChecker } from './lib.mjs';

const G = loadLogic();
const { check, summary } = makeChecker('[POLE 3]');

/* 1) Borne supérieure : 3 × max(HAND_SCORES). */
const maxHand = Math.max(...Object.values(G.HAND_SCORES));
check('max(HAND_SCORES) = 500 (quinte flush)', maxHand === 500);
check('borne sup plateau = 3 × 500 = 1500', 3 * maxHand === 1500);

/* 2) Construction : plateau atteignant 1500 (15 cartes distinctes). */
const C = (r, s) => ({ r, s });
const board = [
  [C(2, 0), C(3, 0), C(4, 0), C(5, 0), C(6, 0)],     // 2-3-4-5-6 pique
  [C(7, 0), C(8, 0), C(9, 0), C(10, 0), C(11, 0)],   // 7-8-9-10-V pique
  [C(2, 1), C(3, 1), C(4, 1), C(5, 1), C(6, 1)],    // 2-3-4-5-6 coeur
];
const uniq = new Set(board.flat().map((c) => c.r + ':' + c.s));
check('plateau : 15 cartes distinctes', board.flat().length === 15 && uniq.size === 15);
check('3 lignes quinte flush (500 chacune)', board.every((row) => G.evaluate5(row).type === 'quinte_flush' && G.evaluate5(row).score === 500));
check('plateau construit : boardScore = 1500 (max théorique atteint)', G.boardScore(board) === 1500);

/* 3) Simulation : 20 000 deals seedés → score du plateau humain. */
const N = 20000;
const scores = [];
for (let i = 0; i < N; i++) {
  const st = G.createGame({ seed: 100000 + i, time: 20 });
  scores.push(G.boardScore(st.boards.human));
}
scores.sort((a, b) => a - b);
const q = (p) => scores[Math.min(N - 1, Math.floor(p * N))];
console.log(`  simulation ${N} deals : min=${q(0)}, P1=${q(0.01)}, mediane=${q(0.5)}, P99=${q(0.99)}, max=${q(1)}`);
check('simulation : max observé ≤ 1500 (borne respectée)', q(1) <= 1500);
check('simulation : tous les plateaux pleins (score > 0)', q(0) > 0);

const ok = summary('max plateau v2.1 = 1500');
process.exitCode = ok ? 0 : 1;
