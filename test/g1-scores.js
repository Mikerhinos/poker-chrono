// PORTE 1 — Réggression du barème + preuve de réutilisation VERBATIM depuis poker-rush.
import { readFileSync } from 'node:fs';
import { loadLogic, INDEX_HTML, DECK_JS, RUSH_HTML, extractFn, extractConstObject, makeChecker } from './lib.mjs';

const G = loadLogic();
const { check, summary } = makeChecker('PORTE 1');

const C = (r, s) => ({ r, s });
const cases = [
  { name: 'quinte flush 7-8-9-10-V pique',  cards: [C(7,0), C(8,0), C(9,0), C(10,0), C(11,0)], type: 'quinte_flush', score: 500 },
  { name: 'quatre d’as',                     cards: [C(14,0), C(14,1), C(14,2), C(14,3), C(7,0)], type: 'quatre', score: 300 },
  { name: 'full RRRDD',                      cards: [C(13,2), C(13,3), C(13,1), C(12,0), C(12,2)], type: 'full', score: 150 },
  { name: 'couleur sans quinte',             cards: [C(7,0), C(9,0), C(11,0), C(12,0), C(13,0)], type: 'couleur', score: 100 },
  { name: 'quinte (sans couleur)',           cards: [C(8,0), C(9,1), C(10,2), C(11,3), C(12,0)], type: 'quinte', score: 75 },
  { name: 'quinte 10-J-Q-D-A (A haute)',     cards: [C(10,0), C(11,1), C(12,2), C(13,3), C(14,0)], type: 'quinte', score: 75 },
  { name: 'brelan',                          cards: [C(10,0), C(10,1), C(10,2), C(7,3), C(8,0)], type: 'brelan', score: 40 },
  { name: 'double paire',                    cards: [C(10,0), C(10,1), C(12,2), C(12,3), C(7,0)], type: 'double_paire', score: 25 },
  { name: 'paire',                           cards: [C(14,0), C(14,1), C(7,3), C(8,2), C(9,0)], type: 'paire', score: 10 },
  { name: 'carte haute',                     cards: [C(13,0), C(12,1), C(11,2), C(8,3), C(7,0)], type: 'carte_haute', score: 2 },
];
for (const t of cases) {
  const res = G.evaluate5(t.cards);
  check(t.name, res.type === t.type && res.score === t.score, `→ ${res.type} (${res.score})`);
}

// Absence de quinte enroulée : A-7-8-9-10 n'est PAS une quinte.
check('pas de quinte enroulée (A-7-8-9-10)', (() => {
  const res = G.evaluate5([C(14,0), C(7,1), C(8,2), C(9,3), C(10,0)]);
  return res.type === 'carte_haute' && res.score === 2;
})(), '→ carte_haute (2)');

// Quatre > full (barème) et tri des types.
check('quatre (300) > full (150)', G.HAND_SCORES.quatre > G.HAND_SCORES.full);
check('ordre complet du barème', G.HAND_SCORES.quinte_flush > G.HAND_SCORES.quatre &&
  G.HAND_SCORES.quatre > G.HAND_SCORES.full && G.HAND_SCORES.full > G.HAND_SCORES.couleur &&
  G.HAND_SCORES.couleur > G.HAND_SCORES.quinte && G.HAND_SCORES.quinte > G.HAND_SCORES.brelan &&
  G.HAND_SCORES.brelan > G.HAND_SCORES.double_paire && G.HAND_SCORES.double_paire > G.HAND_SCORES.paire &&
  G.HAND_SCORES.paire > G.HAND_SCORES.carte_haute);

// Défense : 4 cartes → erreur ; carte invalide → erreur.
check('éval de 4 cartes → erreur', (() => { try { G.evaluate5([C(7,0), C(8,0), C(9,0), C(10,0)]); return false; } catch { return true; } })());
check('carte invalide (r=15) → erreur', (() => { try { G.evaluate5([C(15,0), C(7,0), C(8,0), C(9,0), C(10,0)]); return false; } catch { return true; } })());
check('carte invalide (s=5) → erreur', (() => { try { G.evaluate5([C(7,5), C(8,0), C(9,0), C(10,0), C(11,0)]); return false; } catch { return true; } })());

// barScore de plateau : somme exacte des 3 lignes
{
  const board = [
    [C(7,0), C(8,0), C(9,0), C(10,0), C(11,0)], // 500
    [C(14,0), C(14,1), C(14,2), C(14,3), C(7,1)], // 300
    [C(13,0), C(12,1), C(11,2), C(8,3), C(7,2)]  // 2
  ];
  const total = G.boardScore(board);
  check('boardScore = 500+300+2 = 802', total === 802, `→ ${total}`);
  const bd = G.boardBreakdown(board);
  check('boardBreakdown 3 lignes étiquetées', bd.length === 3 && bd[0].label === 'Quinte flush' && bd[1].label === 'Quatre' && bd[2].label === 'Carte haute');
}

/* ---- Preuve VERBATIM : texte identique entre poker-chrono (js/deck.js, post-split) et poker-rush ---- */
const chrono = readFileSync(DECK_JS, 'utf8');
const rush = readFileSync(RUSH_HTML, 'utf8');
for (const fn of ['evaluate5', 'rowScore', 'boardScore', 'boardBreakdown', 'isFull', 'isValidCard']) {
  const a = extractFn(chrono, fn);
  const b = extractFn(rush, fn);
  check(`source ${fn} identique poker-chrono ↔ poker-rush`, a !== null && a === b);
}
for (const cn of ['RANKS', 'RANK_LABEL', 'SUIT_LABEL', 'SUIT_NAME', 'HAND_SCORES', 'HAND_LABEL']) {
  const a = extractConstObject(chrono, cn);
  const b = extractConstObject(rush, cn);
  check(`const ${cn} identique poker-chrono ↔ poker-rush`, a !== null && a === b);
}

process.exit(summary('PORTE 1') ? 0 : 1);
