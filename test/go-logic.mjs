// PORTE GO — logique pure (Node, sans DOM) : contrat « GO ! » v2.1.
//  - inopérant avant t = 5 s (chrono 90 s)
//  - clic = stop du chrono, fin, plateaux évalués tels quels (l'IA ne fait JAMAIS GO)
//  - bonus = secondes restantes × 1 pt, t_GO ∈ [5 ; 90], cap 16 (recalibrage bench 900 v2.1)
//  - idempotent : 2e clic nul (1 seul bonus)
//  - fin naturelle (t = 0) → bonus 0
// Usage : node test/go-logic.mjs
import { loadLogic } from './lib.mjs';

const G = loadLogic();

let pass = 0, fail = 0;
function check(label, ok, detail = '') {
  if (ok) { pass++; console.log('  ok  ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? ' — ' + detail : '')); }
}

// ---------- Contrat statique ----------
check('contrat : GO_MIN_MS = 5000', G.GO_MIN_MS === 5000, String(G.GO_MIN_MS));
check('contrat : cap bonus = 16', G.GO_BONUS_CAP === 16, String(G.GO_BONUS_CAP));
check('contrat : 90 s dans TIME_OPTIONS', G.TIME_OPTIONS.includes(90), JSON.stringify(G.TIME_OPTIONS));

// ---------- GO avant 5 s : refusé, partie continue ----------
let st = G.createGame({ time: 90, seed: 42 });
G.start(st);
G.tick(st, 4999);
let r = G.goNow(st);
check('GO à t = 4,999 s : refusé (too_early)', r.ok === false && r.reason === 'too_early', JSON.stringify(r));
check('GO trop tôt : la partie continue', st.running === true && st.over === false);

// ---------- GO à t = 5,01 s : bonus 16 (cap), idempotence ----------
st = G.createGame({ time: 90, seed: 42 });
G.start(st);
G.tick(st, 5010);
r = G.goNow(st);
check('GO à t = 5,010 s : accepté', r.ok === true, JSON.stringify(r));
check('bonus = 16 (84,99 s restantes → 85 pts bruts, cap 16)', r.bonus === 16, String(r.bonus));
check('total = plateau + bonus', r.totalHuman === r.human + 16,
  `human=${r.human}, total=${r.totalHuman}`);
check('winner recalculé avec bonus', r.winner ===
  (r.totalHuman > r.ai ? 'human' : r.ai > r.totalHuman ? 'ai' : 'draw'),
  JSON.stringify(r));
check('état terminé après GO', st.over === true && st.running === false && st.goUsed === true);
r = G.goNow(st);
check('2e clic : idempotent (1 seul bonus)', r.ok === false && r.reason === 'already' && st.goBonus === 16,
  JSON.stringify(r));

// ---------- GO à t = 85 s : bonus 5 ----------
st = G.createGame({ time: 90, seed: 777 });
G.start(st);
G.tick(st, 85000);
r = G.goNow(st);
check('GO à t = 85 s : bonus 5 pts', r.ok === true && r.bonus === 5 && r.totalHuman === r.human + 5,
  JSON.stringify({ bonus: r.bonus, total: r.totalHuman }));

// ---------- Fin naturelle (chrono à 0) : bonus 0 ----------
st = G.createGame({ time: 10, seed: 5 });
G.start(st);
let ended = false;
let guard = 0;
while (!ended && guard < 200) { ended = G.tick(st, 1000).ended; guard++; }
check('fin naturelle atteinte', ended && st.over === true);
check('fin naturelle : bonus 0, total = plateau',
  st.result.bonus === 0 && st.result.totalHuman === st.result.human,
  JSON.stringify({ bonus: st.result.bonus, total: st.result.totalHuman, human: st.result.human }));
r = G.goNow(st);
check('GO après fin : refusé (over)', r.ok === false && r.reason === 'over', JSON.stringify(r));
r = G.goNow(null);
check('GO sans partie : refusé (no_state)', r.ok === false && r.reason === 'no_state', JSON.stringify(r));

// ---------- Mode 2P (aiFrozen) : l'IA ne fait jamais GO, le chrono tourne ----------
st = G.createGame({ time: 60, seed: 2024 });
st.aiFrozen = true;
G.start(st);
ended = false; guard = 0;
while (!ended && guard < 200) { ended = G.tick(st, 1000).ended; guard++; }
check('2P (aiFrozen) : 0 swap IA', st.aiMoves === 0, String(st.aiMoves));
check('2P : chrono joué jusqu’à 0', st.over === true && st.timeLeft === 0);

console.log(`go-logic : ${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
