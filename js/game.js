'use strict';
function swapCells(board, i, j) {
    const ri = rowIdx(i), ci = colIdx(i), rj = rowIdx(j), cj = colIdx(j);
    const t = board[ri][ci];
    board[ri][ci] = board[rj][cj];
    board[rj][cj] = t;
  }

  // Delta de score d'un swap, avec scores de lignes mis en cache.
  // board est restauré à l'identique avant le retour (swap auto-inverse).
  function deltaSwap(board, i, j, rowScores) {
    const ri = rowIdx(i), rj = rowIdx(j);
    if (ri === rj) {
      const before = rowScores[ri];
      swapCells(board, i, j);
      const after = rowScore(board[ri]);
      swapCells(board, i, j);
      return after - before;
    }
    const before1 = rowScores[ri], before2 = rowScores[rj];
    swapCells(board, i, j);
    const after1 = rowScore(board[ri]), after2 = rowScore(board[rj]);
    swapCells(board, i, j);
    return (after1 - before1) + (after2 - before2);
  }

  function rowScoresOf(board) {
    return [rowScore(board[0]), rowScore(board[1]), rowScore(board[2])];
  }

  function bestNextDelta(board, rowScores) {
    let best = -Infinity;
    for (const [i, j] of PAIRS) {
      const d = deltaSwap(board, i, j, rowScores);
      if (d > best) best = d;
    }
    return best;
  }

  // Normal : glouton exact 1-coup (argmax du delta, sans bruit)
  function evalGreedy(board) {
    const rs = rowScoresOf(board);
    let bi = -1, bj = -1, bv = -Infinity;
    for (const [i, j] of PAIRS) {
      const d = deltaSwap(board, i, j, rs);
      if (d > bv) { bv = d; bi = i; bj = j; }
    }
    return { i: bi, j: bj, value: bv };
  }

  // Difficile : évaluation quasi exacte sur 3 coups (beam 10 déterministe sur
  // le 1er coup, exploration complète des 105 swaps aux plies 2 et 3)
  function eval3ply(board) {
    const rs = rowScoresOf(board);
    const cands = [];
    for (const [i, j] of PAIRS) cands.push({ i, j, d1: deltaSwap(board, i, j, rs) });
    cands.sort((a, b) => b.d1 - a.d1); // stable → déterministe sur égalité
    const beam = cands.slice(0, 10);
    let bi = -1, bj = -1, bv = -Infinity;
    for (const c of beam) {
      swapCells(board, c.i, c.j);
      const rs2 = rowScoresOf(board);
      const cands2 = [];
      for (const [i, j] of PAIRS) cands2.push({ i, j, d: deltaSwap(board, i, j, rs2) });
      cands2.sort((a, b) => b.d - a.d); // stable → déterministe sur égalité
      const beam2 = cands2.slice(0, 12);
      for (const c2 of beam2) {
        swapCells(board, c2.i, c2.j);
        const d3 = bestNextDelta(board, rowScoresOf(board));
        swapCells(board, c2.i, c2.j);
        const v = c.d1 + c2.d + d3;
        if (v > bv) { bv = v; bi = c.i; bj = c.j; }
      }
      swapCells(board, c.i, c.j);
    }
    return { i: bi, j: bj, value: bv };
  }

  function neutralMove(board) {
    const rs = rowScoresOf(board);
    for (const [i, j] of PAIRS) {
      if (deltaSwap(board, i, j, rs) === 0) return { i, j };
    }
    return null;
  }

  function createGame(opts = {}) {
    const difficulty = DIFFICULTIES.includes(opts.difficulty) ? opts.difficulty : 'normal';
    const time = TIME_OPTIONS.includes(opts.time) ? opts.time : 20;
    let rngShuffle, rngHuman, rngAI;
    if (Number.isInteger(opts.seed) && opts.seed >= 0) {
      // Chemin override 32 bits (portes de test) : mulberry32 strictement
      // inchangé — les seeds 1000..1299 produisent les mêmes plateaux.
      const seed = opts.seed >>> 0;
      rngShuffle = mulberry32(seed ^ 0x9e3779b9);
      rngHuman = mulberry32(seed ^ 0x85ebca6b);
      rngAI = mulberry32(seed ^ 0xc2b2ae35);
    } else {
      // Partie réelle (fix H1) : seed CSPRNG 128 bits (4×uint32) interne,
      // streams shuffle/human/AI dérivés (xoshiro128**) — aucune valeur 32
      // bits recouvrable depuis le deck visible.
      const master = new Uint32Array(4);
      let csp = false;
      try {
        const c = (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function')
          ? crypto
          : (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function')
            ? window.crypto
            : null;
        if (c) { c.getRandomValues(master); csp = true; }
      } catch (err) { csp = false; }
      if (!csp) for (let i = 0; i < 4; i++) master[i] = (Math.random() * 0xFFFFFFFF) >>> 0;
      rngShuffle = xoshiro128ss(deriveStream(master, 0x9E3779B9));
      rngHuman = xoshiro128ss(deriveStream(master, 0x85EBCA6B));
      rngAI = xoshiro128ss(deriveStream(master, 0xC2B2AE35));
    }

    const deck = [];
    for (const s of [0, 1, 2, 3]) for (const r of RANKS) deck.push({ r, s });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rngShuffle() * (i + 1));
      const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    const boards = {
      human: [deck.slice(0, 5), deck.slice(5, 10), deck.slice(10, 15)],
      ai: [deck.slice(15, 20), deck.slice(20, 25), deck.slice(25, 30)]
    };
    return {
      difficulty,
      time,
      timeLeft: time * 1000,
      running: false,
      over: false,
      aiTimer: 0,
      deck: deck.slice(30), // 2 cartes de réserve
      boards,
      rngHuman,
      rngAI,
      aiMoves: 0,
      humanMoves: 0,
      lastAiMove: null,
      result: null
    };
  }

  function start(state) {
    if (state.over) return false;
    state.running = true;
    return true;
  }

  function finish(state) {
    state.running = false;
    state.over = true;
    const human = boardScore(state.boards.human);
    const ai = boardScore(state.boards.ai);
    state.result = {
      human,
      ai,
      winner: human > ai ? 'human' : ai > human ? 'ai' : 'draw',
      rowsHuman: boardBreakdown(state.boards.human),
      rowsAI: boardBreakdown(state.boards.ai)
    };
    return state.result;
  }

  function tick(state, dt) {
    if (state.over || !state.running) return { ended: false, aiMoved: false };
    // Fix M1 : dt négatif ou non fini interdit — pas de chrono infini via tick.
    if (!Number.isFinite(dt) || dt <= 0) return { ended: false, aiMoved: false };
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    let aiMoved = false;
    const interval = AI_INTERVAL[state.difficulty];
    state.aiTimer += dt;
    while (state.timeLeft > 0 && state.aiTimer >= interval) {
      state.aiTimer -= interval;
      if (aiStep(state)) aiMoved = true;
    }
    if (state.timeLeft <= 0) {
      finish(state);
      return { ended: true, aiMoved };
    }
    return { ended: false, aiMoved };
  }

  // Swap humain. to === null → dépôt hors plateau. Résultat { ok, reason? }.
  function humanSwap(state, from, to) {
    if (!state) return { ok: false, reason: 'invalid' };
    if (state.over) return { ok: false, reason: 'over' };
    if (!state.running) return { ok: false, reason: 'not_running' };
    if (to === null || to === undefined) return { ok: false, reason: 'out' };
    if (typeof from !== 'number' || typeof to !== 'number' ||
        !Number.isInteger(from) || !Number.isInteger(to) ||
        from < 0 || from > 14 || to < 0 || to > 14) {
      return { ok: false, reason: 'invalid' };
    }
    if (from === to) return { ok: false, reason: 'self' };
    swapCells(state.boards.human, from, to);
    state.humanMoves++;
    return { ok: true };
  }

  // Un coup IA sur son propre plateau (visible : les 2 cellules sont flashées).
  function aiStep(state) {
    if (!state || state.over || !state.running) return null;
    const board = state.boards.ai;
    let pick = null;
    if (state.difficulty === 'facile') {
      if (state.rngAI() < 0.25) {
        const p = PAIRS[Math.floor(state.rngAI() * PAIRS.length)];
        pick = { i: p[0], j: p[1] }; // bruit : swap aléatoire
      } else {
        const rs = rowScoresOf(board);
        const cands = [];
        for (const [i, j] of PAIRS) cands.push({ i, j, d: deltaSwap(board, i, j, rs) });
        cands.sort((a, b) => b.d - a.d);
        const top = cands.slice(0, 3); // bruit : aléatoire parmi les 3 meilleurs
        pick = top[Math.floor(state.rngAI() * top.length)];
      }
    } else if (state.difficulty === 'normal') {
      const mv = evalGreedy(board);
      pick = mv.value > 0 ? { i: mv.i, j: mv.j } : neutralMove(board);
    } else {
      const mv = eval3ply(board);
      pick = mv.value > 0 ? { i: mv.i, j: mv.j } : neutralMove(board);
    }
    if (!pick) return null;
    swapCells(board, pick.i, pick.j);
    state.aiMoves++;
    state.lastAiMove = { i: pick.i, j: pick.j };
    return pick;
  }

  // Politique humain aléatoire (tests headless uniquement)
  function humanRandomSwap(state) {
    if (!state || state.over || !state.running) return null;
    const p = PAIRS[Math.floor(state.rngHuman() * PAIRS.length)];
    swapCells(state.boards.human, p[0], p[1]);
    state.humanMoves++;
    return { i: p[0], j: p[1] };
  }

  // Simulation headless complète : tick 100 ms, humain = swap aléatoire/1 s
  function simulateGame(opts = {}) {
    const st = createGame(opts);
    const errors = [];
    let t = 0;
    start(st);
    try {
      while (!st.over) {
        if (t % 1000 === 0 && t > 0) humanRandomSwap(st);
        tick(st, 100);
        t += 100;
      }
    } catch (err) {
      errors.push(err && err.message ? err.message : String(err));
    }
    return { st, errors };
  }

  function cardText(card) {
    return RANK_LABEL[card.r] + SUIT_LABEL[card.s];
  }

  globalThis.G = {
    version: '2.0.0',
    // barème verbatim
    RANKS, RANK_LABEL, SUIT_LABEL, SUIT_NAME, HAND_SCORES, HAND_LABEL,
    isValidCard, evaluate5, isFull, rowScore, boardScore, boardBreakdown,
    // poker chrono
    DIFFICULTIES, TIME_OPTIONS, AI_INTERVAL, PAIRS,
    createGame, start, tick, humanSwap, aiStep, humanRandomSwap,
    simulateGame, cardText
  };
