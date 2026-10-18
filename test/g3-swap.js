// PORTE 3 — Deal miroir (v2.1) + mécanique du swap humain (niveau logique).
// Contrat miroir (D1.1 v2.1) : 52 cartes, 15 tirées, main joueur = main IA =
// cette même sélection, 37 cartes non utilisées (aucune réserve jouable).
import { loadLogic, makeChecker } from './lib.mjs';

const G = loadLogic();
const { check, summary } = makeChecker('PORTE 3');
const snap = (b) => JSON.stringify(b);

// --- Contrat miroir
{
  const st = G.createGame({ seed: 42, time: 20 });
  const h = st.boards.human, a = st.boards.ai;
  const uniq52 = new Set([...h.flat(), ...a.flat(), ...st.deck].map((c) => c.r + ':' + c.s));
  check('miroir : 52 cartes, 15 + 15 + 37, toutes uniques',
    h.flat().length === 15 && a.flat().length === 15 && st.deck.length === 37 && uniq52.size === 52);
  check('miroir : main joueur == main IA (même sélection)', snap(h) === snap(a));
  check('miroir : aucune carte dupliquée dans les mains',
    new Set(h.flat().map((c) => c.r + ':' + c.s)).size === 15);
}
{
  // même seed → mêmes 15 cartes, aucune duplication (déterminisme du deal)
  const s1 = G.createGame({ seed: 77, time: 20 });
  const s2 = G.createGame({ seed: 77, time: 20 });
  check('même seed → mêmes 15 cartes (joueur)', snap(s1.boards.human) === snap(s2.boards.human));
  check('même seed → mêmes 15 cartes (IA, miroir)', snap(s1.boards.ai) === snap(s2.boards.ai));
  const all = [...s1.boards.human.flat(), ...s1.boards.ai.flat(), ...s1.deck];
  const uniq = new Set(all.map((c) => c.r + ':' + c.s));
  check('aucune duplication dans le deal (67 cartes listées, 52 uniques : miroir)', all.length === 67 && uniq.size === 52);
}

// 1) Swap valide → les deux cartes sont échangées.
{
  const st = G.createGame({ seed: 7, time: 20 });
  G.start(st);
  const b = st.boards.human;
  const before00 = { ...b[0][0] }, before01 = { ...b[0][1] };
  const before = snap(b);
  const res = G.humanSwap(st, 0, 1);
  check('swap valide accepté', res.ok === true, JSON.stringify(res));
  check('swap valide : cellules 0 et 1 échangées',
    b[0][0].r === before01.r && b[0][0].s === before01.s && b[0][1].r === before00.r && b[0][1].s === before00.s);
  check('swap valide : le reste du plateau inchangé', snap(b) !== before);
  check('swap valide : humanMoves incrémenté', st.humanMoves === 1);
}

// 2) Case identique (from === to) → rien ne change, motif 'self'.
{
  const st = G.createGame({ seed: 8, time: 20 });
  G.start(st);
  const before = snap(st.boards.human);
  const res = G.humanSwap(st, 2, 2);
  check('case identique : refus "self"', res.ok === false && res.reason === 'self');
  check('case identique : plateau inchangé', snap(st.boards.human) === before);
}

// 3) Dépôt hors plateau (to === null) → annulation, rien ne change.
{
  const st = G.createGame({ seed: 9, time: 20 });
  G.start(st);
  const before = snap(st.boards.human);
  const res = G.humanSwap(st, 3, null);
  check('hors plateau : refus "out"', res.ok === false && res.reason === 'out');
  check('hors plateau : plateau inchangé', snap(st.boards.human) === before);
}

// 4) Dépôts invalides → refus propre, plateau intact.
{
  const st = G.createGame({ seed: 10, time: 20 });
  G.start(st);
  const before = snap(st.boards.human);
  const bad = [
    [-1, 1], [0, 15], [14, 20], [0.5, 1], [0, 1.5], ['x', 1]
  ];
  let allInvalid = true;
  for (const [f, t] of bad) {
    const res = G.humanSwap(st, f, t);
    if (res.ok !== false || res.reason !== 'invalid') allInvalid = false;
  }
  check('dépôts invalides (6 formes) → refus "invalid"', allInvalid);
  const rU = G.humanSwap(st, 0, undefined);
  check('dépôt undefined → refus "out"', rU.ok === false && rU.reason === 'out', JSON.stringify(rU));
  check('dépôts invalides : plateau inchangé', snap(st.boards.human) === before);
}

// 5) Partie non lancée → refus 'not_running'.
{
  const st = G.createGame({ seed: 11, time: 20 });
  const res = G.humanSwap(st, 0, 1);
  check('non lancée : refus "not_running"', res.ok === false && res.reason === 'not_running');
}

// 6) Partie terminée → refus 'over'.
{
  const st = G.createGame({ seed: 12, time: 10 });
  G.start(st);
  while (!st.over) G.tick(st, 100);
  check('tick jusqu’à terme', st.over === true && st.result !== null);
  const before = snap(st.boards.human);
  const res = G.humanSwap(st, 0, 1);
  check('terminée : refus "over"', res.ok === false && res.reason === 'over');
  check('terminée : plateau inchangé', snap(st.boards.human) === before);
}

// 7) Invariants sur une partie simulée complète : plateaux toujours pleins (miroir), 52 cartes uniques (15 miroir + 37 non utilisées).
{
  const { st } = G.simulateGame({ seed: 13, time: 10, difficulty: 'normal' });
  const all = [...st.boards.human.flat(), ...st.boards.ai.flat(), ...st.deck];
  const uniq = new Set(all.map((c) => c.r + ':' + c.s));
  check('simulation : 67 cartes listées, 52 uniques (miroir)', all.length === 67 && uniq.size === 52);
  check('simulation : plateaux toujours pleins (15+15)', st.boards.human.flat().length === 15 && st.boards.ai.flat().length === 15);
  check('simulation : résultat cohérent (total = somme des lignes)',
    st.result.human === G.boardScore(st.boards.human) && st.result.ai === G.boardScore(st.boards.ai));
}

process.exit(summary('PORTE 3') ? 0 : 1);
