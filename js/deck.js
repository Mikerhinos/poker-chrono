  'use strict';

  /* ============================================================
   * BARÈME — réutilisé VERBATIM depuis poker-rush/index.html
   * (RANKS, RANK_LABEL, SUIT_LABEL, SUIT_NAME, HAND_SCORES,
   *  HAND_LABEL, isValidCard, evaluate5, isFull, rowScore,
   *  boardScore, boardBreakdown — texte identique, inchangé)
   * ============================================================ */
  // v2.1 — 13 rangs complets (2→A), 52 cartes (Texas Hold'em).
  const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const RANK_LABEL = { 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "V", 12: "D", 13: "R", 14: "A" };
  const SUIT_LABEL = ["♠", "♥", "♦", "♣"];
  const SUIT_NAME = ["pique", "cœur", "carreau", "trèfle"];
  const HAND_SCORES = {
    quinte_flush: 500, quatre: 300, full: 150, couleur: 100, quinte: 75,
    brelan: 40, double_paire: 25, paire: 10, carte_haute: 2
  };
  const HAND_LABEL = {
    quinte_flush: "Quinte flush", quatre: "Quatre", full: "Full", couleur: "Couleur",
    quinte: "Quinte", brelan: "Brelan", double_paire: "Double paire", paire: "Paire",
    carte_haute: "Carte haute"
  };
  const DIFFICULTIES = ["facile", "normal", "difficile"];

  function isValidCard(c) {
    return !!c && typeof c.r === "number" && c.r >= 2 && c.r <= 14
      && typeof c.s === "number" && c.s >= 0 && c.s <= 3;
  }

  /* Évalue exactement 5 cartes. Renvoie {type, label, score}. */
  function evaluate5(cards) {
    if (!Array.isArray(cards) || cards.length !== 5) {
      throw new Error("evaluate5 : exactement 5 cartes requises");
    }
    for (const c of cards) if (!isValidCard(c)) throw new Error("evaluate5 : carte invalide");
    const count = new Array(15).fill(0);
    let flush = true;
    for (const c of cards) {
      count[c.r] += 1;
      flush = flush && c.s === cards[0].s;
    }
    const ranks = RANKS.filter((r) => count[r] > 0);
    /* Quinte = 5 rangs distincts consécutifs (rangs 2→A). */
    // v2.1 — quinte normale (5 rangs consécutifs) OU wheel basse A-2-3-4-5 autorisée (l'As y est BAS) ;
    // 10-J-Q-K-A est une quinte (broadway) ; K-A-2-3-4 n'est pas une quinte (unique enroulement exclu).
  const wheel = [2, 3, 4, 5, 14].every((r) => count[r] > 0);
  const straight = ranks.length === 5 && (ranks[ranks.length - 1] - ranks[0] === 4 || wheel);
    const counts = ranks.map((r) => count[r]).sort((a, b) => b - a);
    let type;
    if (straight && flush) type = "quinte_flush";
    else if (counts[0] === 4) type = "quatre";
    else if (counts[0] === 3 && counts[1] === 2) type = "full";
    else if (flush) type = "couleur";
    else if (straight) type = "quinte";
    else if (counts[0] === 3) type = "brelan";
    else if (counts[0] === 2 && counts[1] === 2) type = "double_paire";
    else if (counts[0] === 2) type = "paire";
    else type = "carte_haute";
    return { type, label: HAND_LABEL[type], score: HAND_SCORES[type] };
  }

  function isFull(row) { return row.every((c) => c !== null); }

  /* Score d’une ligne terminée (0 si incomplète). */
  function rowScore(row) { return isFull(row) ? evaluate5(row).score : 0; }

  /* Score officiel d’un plateau : somme des 3 lignes. */
  function boardScore(board) { return board.reduce((t, row) => t + rowScore(row), 0); }

  function boardBreakdown(board) {
    return board.map((row) => isFull(row) ? evaluate5(row) : { type: null, label: "Incomplet", score: 0 });
  }

  /* ============================================================
   * POKER CHRONO — logique de jeu (aucune dépendance DOM)
   * Plateau 3×5 par joueur, toujours plein. 32 cartes : 15 + 15 + 2 (jeau).
   * Humain : glisser-déposer sur son plateau (swap). IA : swaps sur son
   * plateau à cadence fixe (2 s / 1 s / 0,5 s selon difficulté).
   * ============================================================ */
  const TIME_OPTIONS = [10, 20, 30, 60, 90];
  const AI_INTERVAL = { facile: 2000, normal: 1000, difficile: 500 }; // ms

  // Paires de cellules (i<j), ordre déterministe
  const PAIRS = [];
  for (let i = 0; i < 15; i++) for (let j = i + 1; j < 15; j++) PAIRS.push([i, j]);

  function rowIdx(i) { return Math.floor(i / 5); }
  function colIdx(i) { return i % 5; }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (a >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* xoshiro128** — PRNG 128 bits (fix H1) : le deck d'une partie réelle
   * n'est plus recouvrable par brute-force 2^32 depuis les cartes visibles. */
  function xoshiro128ss(master) {
    let a = master[0] >>> 0, b = master[1] >>> 0, c = master[2] >>> 0, d = master[3] >>> 0;
    if (a === 0 && b === 0 && c === 0 && d === 0) a = 0x9E3779B9; // état nul interdit
    const rotl = (x, k) => ((x << k) | (x >>> (32 - k))) >>> 0;
    return function () {
      const result = Math.imul(rotl(Math.imul(b, 5) >>> 0, 7), 9) >>> 0;
      const t = (b << 9) >>> 0;
      c = (c ^ a) >>> 0;
      d = (d ^ b) >>> 0;
      b = (b ^ c) >>> 0;
      c = (c ^ d) >>> 0;
      d = (d ^ t) >>> 0;
      c = (c ^ (a << 11)) >>> 0;
      d = rotl(d, 14);
      return result / 4294967296;
    };
  }

  /* Dérivation d'un flux 128 bits depuis le seed maître (splitmix par mot). */
  function deriveStream(master, constant) {
    const out = new Uint32Array(4);
    for (let i = 0; i < 4; i++) {
      let z = (master[i] ^ (constant + i * 0x9E3779B9)) >>> 0;
      z = (z ^ (z >>> 16)) >>> 0;
      z = Math.imul(z, 0x85EBCA6B) >>> 0;
      z = (z ^ (z >>> 13)) >>> 0;
      z = Math.imul(z, 0xC2B2AE35) >>> 0;
      out[i] = z >>> 0;
    }
    return out;
  }

  