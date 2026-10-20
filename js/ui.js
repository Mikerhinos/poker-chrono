(function () {
  'use strict';

  const G = globalThis.G;
  const $ = (sel) => document.querySelector(sel);

  let state = null;
  let uiTimer = null;
  let dragging = false;
  let lastAiMoveSeen = -1;
  let lastWholeSec = null;
  let sirenPlayed = false;

  const LS = {
    colors: 'poker-chrono-colors',
    best: 'poker-chrono-best-score'
  };

  function readLS(key, dflt) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? dflt : v;
    } catch (err) { return dflt; }
  }
  function writeLS(key, val) {
    try { localStorage.setItem(key, String(val)); } catch (err) { /* stockage indisponible */ }
  }

  /* v2 : mode de rendu des couleurs ('2' rouge/noir ou '4' par atout), persisté. */
  let colorMode = readLS(LS.colors, '2') === '4' ? '4' : '2';

  const REASONS = {
    self: 'reason_self',
    out: 'reason_out',
    invalid: 'reason_invalid',
    over: 'reason_over',
    not_running: 'reason_not_running'
  };

  function msg(text) { $('#msg').textContent = text || ''; }
  function status(text) { $('#status').textContent = text; }

  /* Nom exact de la main d'une ligne : même fonction évaluatrice (G.evaluate5)
   * que le score — l'affichage et l'évaluation ne peuvent pas diverger. */
  function rowLabel(row) {
    return G.I18N.handName(G.isFull(row) ? G.evaluate5(row).label : 'Incomplet');
  }

  /* v2 : seed aléatoire par partie réelle — CSPRNG (crypto.getRandomValues) si
   * disponible, sinon Math.random. Aucun seed fixe dans l'UI ; l'override seed
   * de G.createGame reste réservé aux portes (logique inchangée). */
  function applyColors() { document.body.dataset.colors = colorMode; }

  function cardEl(card, boardName, idx) {
    const d = document.createElement('div');
    d.className = 'card s' + card.s;
    d.dataset.idx = String(idx);
    const rank = document.createElement('span');
    rank.textContent = G.I18N.rankLabel(card.r);
    const suit = document.createElement('span');
    suit.className = 'suit';
    suit.textContent = G.SUIT_LABEL[card.s];
    d.append(rank, suit);
    if (boardName === 'human') {
      d.draggable = true;
      d.addEventListener('dragstart', onDragStart);
      d.addEventListener('dragend', onDragEnd);
    }
    return d;
  }

  /* opts : { animateAll, prevScores, flipIdx } (v2 : rendu animé + nom de ligne). */
  function renderBoard(name, opts = {}) {
    const board = state.boards[name];
    const wrap = $(name === 'human' ? '#board-human .rows' : '#board-ai .rows');
    const prevScores = opts.prevScores || null;
    const flipIdx = opts.flipIdx || null;
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    for (let r = 0; r < 3; r++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'row';
      const nm = document.createElement('span');
      nm.className = 'row-name';
      nm.textContent = rowLabel(board[r]);
      rowEl.appendChild(nm);
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.idx = String(idx);
        const card = cardEl(board[r][c], name, idx);
        if (opts.animateAll) {
          card.classList.add('deal-in');
          card.style.animationDelay = (idx * 25) + 'ms';
        }
        cell.appendChild(card);
        if (name === 'human') {
          cell.addEventListener('dragover', onCellDragOver);
          cell.addEventListener('dragleave', onCellDragLeave);
          cell.addEventListener('drop', onHumanCellDrop);
        } else {
          cell.addEventListener('drop', onAiCellDrop);
        }
        rowEl.appendChild(cell);
      }
      /* v2 : lueur sur la ligne dont le score vient de se renforcer. */
      if (prevScores && G.rowScore(board[r]) > (prevScores[r] || 0)) rowEl.classList.add('glow');
      wrap.appendChild(rowEl);
    }
    /* v2 : flip rotateY sur les deux cellules échangées. */
    if (flipIdx) {
      for (const idx of flipIdx) {
        const card = wrap.querySelector('.cell[data-idx="' + idx + '"] .card');
        if (card) card.classList.add('flip');
      }
    }
  }

  function renderAll(opts) {
    renderBoard('human', opts);
    renderBoard('ai', opts);
    updateScores();
    updateTimer();
  }

  function updateScores() {
    $('#score-human').textContent = String(G.boardScore(state.boards.human));
    $('#score-ai').textContent = String(G.boardScore(state.boards.ai));
  }

  function updateTimer() {
    const el = $('#timer');
    el.textContent = (state.timeLeft / 1000).toFixed(1) + ' s';
    el.classList.toggle('low', state.timeLeft <= 5000);
  }

  function flashAiMove() {
    if (!state.lastAiMove) return;
    const cells = document.querySelectorAll('#board-ai .cell');
    for (const idx of [state.lastAiMove.i, state.lastAiMove.j]) {
      const cell = cells[idx];
      if (!cell) continue;
      cell.classList.remove('flash');
      void cell.offsetWidth; // relance l'animation
      cell.classList.add('flash');
    }
  }

  /* ---------- glisser-déposer (humain uniquement) ---------- */

  function onDragStart(e) {
    if (!state || !state.running || state.over) {
      e.preventDefault();
      msg(state && state.over ? G.I18N.t(REASONS.over) : G.I18N.t('start_first'));
      return;
    }
    const from = e.currentTarget.dataset.idx;
    e.dataTransfer.setData('text/plain', from);
    e.dataTransfer.effectAllowed = 'move';
    dragging = true;
  }

  function onDragEnd() { dragging = false; }

  function onCellDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  }

  function onCellDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }

  function onHumanCellDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    dragging = false;
    if (!state) return;
    if (state.over || !state.running) { msg(G.I18N.t(state.over ? REASONS.over : REASONS.not_running)); return; }
    const fromRaw = e.dataTransfer.getData('text/plain');
    const from = parseInt(fromRaw, 10);
    if (fromRaw === '' || Number.isNaN(from)) { msg(G.I18N.t(REASONS.invalid)); return; }
    const to = parseInt(e.currentTarget.dataset.idx, 10);
    const prevScores = [
      G.rowScore(state.boards.human[0]),
      G.rowScore(state.boards.human[1]),
      G.rowScore(state.boards.human[2])
    ];
    const res = G.humanSwap(state, from, to);
    if (!res.ok) { msg(G.I18N.t(REASONS[res.reason] || REASONS.invalid)); return; }
    renderBoard('human', { prevScores, flipIdx: [from, to] });
    updateScores();
    msg('');
    if (G.AUDIO) G.AUDIO.sfx.swap();
    if (G.FX) {
      G.FX.cellBurst('#board-human .cell[data-idx="' + from + '"]');
      G.FX.cellBurst('#board-human .cell[data-idx="' + to + '"]');
    }
  }

  function onAiCellDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dragging = false;
    msg(G.I18N.t('ai_readonly'));
  }

  function onDocumentDrop(e) {
    if (!dragging) return;
    if (e.target && e.target.closest && e.target.closest('#board-human .cell')) return; // géré par la case
    e.preventDefault();
    dragging = false;
    msg(G.I18N.t(REASONS.out));
  }

  /* ---------- GO ! (v2.1, item 5 du brief) ----------
   * 1 pt / seconde restante, débloqué à 5 s, 2e clic idempotent,
   * l'IA ne fait jamais GO. */
  const GO_REASONS = {
    no_state: 'go_no_state',
    already: '', // idempotent : 2e clic silencieux
    over: 'go_over',
    not_running: 'go_not_running',
    too_early: 'go_too_early'
  };
  function onGoClick() {
    if (!state) return;
    const res = G.goNow(state);
    if (!res.ok) {
      if (res.reason !== 'already' && GO_REASONS[res.reason]) msg(G.I18N.t(GO_REASONS[res.reason]));
      return;
    }
    endGame();
  }
  function updateGoButton() {
    const b = $('#go');
    if (!b || !state) return;
    const elapsed = state.time * 1000 - state.timeLeft;
    b.disabled = state.over || state.goUsed || !state.running || elapsed < G.GO_MIN_MS;
  }

  /* ---------- cycle de vie ---------- */

  function startGame() {
    const difficulty = $('#diff').value;
    const time = parseInt($('#time').value, 10);
    // Fix H1/H2 : seed 128 bits CSPRNG interne (aucun handle public de seed),
    // état vivant dans la closure (aucun handle d'état public mutable).
    state = G.createGame({ difficulty, time });
    G.start(state);
    lastUiMs = performance.now();
    lastAiMoveSeen = -1;
    lastWholeSec = Math.ceil(state.timeLeft / 1000);
    sirenPlayed = false;
    $('#final').hidden = true;
    /* v2.1.2 : la pulsation du bouton de départ s'arrête au démarrage (classe
     * retirée — aucun changement de logique de jeu). */
    $('#start').classList.remove('pulse-glow');
    msg('');
    status(G.I18N.t('running', { time, diff: G.I18N.diffLabel(difficulty) }));
    renderAll({ animateAll: true });
    if (G.AUDIO) { G.AUDIO.ensure(); G.AUDIO.sfx.deal(); }
    if (G.FX) { G.FX.boardBurst('#board-human'); G.FX.boardBurst('#board-ai'); }
    updateGoButton();
    if (uiTimer) clearInterval(uiTimer);
    uiTimer = setInterval(uiTick, 100);
  }

  /* Fix M1 : le chrono avance avec le temps réel (performance.now), jamais
   * avec un dt fourni depuis l'extérieur ; dt borné après suspension d'onglet. */
  let lastUiMs = 0;
  function uiTick() {
    if (!state) return;
    const now = performance.now();
    let dt = lastUiMs > 0 ? now - lastUiMs : 100;
    lastUiMs = now;
    if (!Number.isFinite(dt) || dt < 0) dt = 100;
    if (dt > 1000) dt = 100;
    /* v2 : scores IA AVANT le tick (le swap IA se joue à l'intérieur de tick)
     * pour pouvoir détecter la ligne qui se renforce. */
    const aiPrev = [
      G.rowScore(state.boards.ai[0]),
      G.rowScore(state.boards.ai[1]),
      G.rowScore(state.boards.ai[2])
    ];
    const info = G.tick(state, dt);
    updateTimer();
    updateGoButton();
    if (!state.over) {
      /* v2 : tic-tac chrono (10 dernières secondes) + sirène finale (≤ 5 s). */
      const sec = Math.ceil(state.timeLeft / 1000);
      if (sec !== lastWholeSec) {
        lastWholeSec = sec;
        if (sec >= 1 && sec <= 10 && G.AUDIO) G.AUDIO.sfx[sec % 2 === 0 ? 'tock' : 'tick']();
        if (sec <= 5 && !sirenPlayed && G.AUDIO) { sirenPlayed = true; G.AUDIO.sfx.sirene(); }
      }
    }
    if (state.aiMoves > lastAiMoveSeen) {
      lastAiMoveSeen = state.aiMoves;
      /* v2 : le plateau IA est re-rendu à chaque swap IA (cartes + nom de main
         à jour) — v1 ne flasheait que les cellules sans mettre les cartes à jour. */
      const mv = state.lastAiMove;
      renderBoard('ai', { prevScores: aiPrev, flipIdx: mv ? [mv.i, mv.j] : null });
      flashAiMove();
      updateScores();
      if (G.AUDIO) G.AUDIO.sfx.swapSoft();
      if (G.FX && mv) G.FX.cellBurst('#board-ai .cell[data-idx="' + mv.i + '"]');
    }
    if (info.ended) endGame();
  }

  /* Fix L1 : rendu 100 % createElement/textContent — aucune injection de
   * balises sur données dynamiques (labels issus de l'évaluateur). */
  function renderBreakdown(el, rows) {
    while (el.firstChild) el.removeChild(el.firstChild);
    rows.forEach((row, i) => {
      const div = document.createElement('div');
      div.className = 'row-line';
      div.textContent = G.I18N.t('row_line', { n: i + 1, label: G.I18N.handName(row.label), score: row.score });
      el.appendChild(div);
    });
  }

  function endGame() {
    if (uiTimer) { clearInterval(uiTimer); uiTimer = null; }
    const r = state.result;
    $('#final-title').textContent =
      r.winner === 'human' ? G.I18N.t('win')
      : r.winner === 'ai' ? G.I18N.t('lose')
      : G.I18N.t('draw');
    renderBreakdown($('#rows-human'), r.rowsHuman);
    renderBreakdown($('#rows-ai'), r.rowsAI);
    const goBonus = r.bonus || 0;
    $('#final-scores').textContent =
      G.I18N.t('fs_human', { n: r.human }) +
      (goBonus > 0 ? G.I18N.t('fs_go', { b: goBonus, t: r.human + goBonus }) : '') +
      G.I18N.t('fs_ai', { n: r.ai });
    let best = 0;
    let record = false;
    try {
      // Fix M2 : valeur lue validée (Number.isFinite && >= 0), sinon 0 —
      // plus de NaN bloquant les records, record ré-armable.
      const parsedBest = Number(localStorage.getItem(LS.best));
      best = Number.isFinite(parsedBest) && parsedBest >= 0 ? parsedBest : 0;
      if (r.human > best) {
        best = r.human;
        record = true;
        localStorage.setItem(LS.best, String(best));
      }
    } catch (err) { /* stockage indisponible : on continue sans persistance */ }
    $('#best').textContent = record
      ? G.I18N.t('new_best', { n: best })
      : G.I18N.t('best', { n: best });
    $('#final').hidden = false;
    status(G.I18N.t('ended', { h: state.humanMoves, a: state.aiMoves }));
    /* v2 : dopamine finale — SFX (explosion victoire / chute défaite) + FX (secousse + burst). */
    if (G.AUDIO) {
      if (r.winner === 'human') G.AUDIO.sfx.victoire();
      else if (r.winner === 'ai') G.AUDIO.sfx.defaite();
      else G.AUDIO.sfx.egalite();
    }
    if (G.FX) {
      G.FX.shake();
      if (r.winner === 'human') G.FX.winBurst();
      else if (r.winner === 'ai') G.FX.loseBurst();
    }
    /* v2.1.2 : la pulsation du bouton de départ est ré-armée — une nouvelle
     * partie est à nouveau possible depuis le bouton #start. */
    $('#start').classList.add('pulse-glow');
  }

  /* ---------- init ---------- */

  document.addEventListener('drop', onDocumentDrop);
  document.addEventListener('dragover', (e) => e.preventDefault());
  $('#start').addEventListener('click', startGame);
  $('#go').addEventListener('click', onGoClick);
  $('#replay').addEventListener('click', startGame);

  /* v2 : toggle de rendu 2 ↔ 4 couleurs (persisté, rendu uniquement). */
  const colorsSel = $('#colors');
  colorsSel.value = colorMode;
  applyColors();
  colorsSel.addEventListener('change', (e) => {
    colorMode = e.target.value === '4' ? '4' : '2';
    writeLS(LS.colors, colorMode);
    applyColors();
  });

  /* v2.1.1 : langue (EN par défaut, persistance localStorage, <html lang> dynamique). */
  const langSel = $('#lang');
  langSel.value = G.I18N.getLang();
  langSel.addEventListener('change', (e) => {
    G.I18N.setLang(e.target.value);
    renderAll();
  });

  /* v2 : contrôles audio (toggles ON/OFF + sliders séparés, persistés). */
  if (G.AUDIO) {
    const musicBtn = $('#music-toggle');
    const sfxBtn = $('#sfx-toggle');
    const musicVol = $('#music-vol');
    const sfxVol = $('#sfx-vol');
    function syncAudioUI() {
      musicBtn.classList.toggle('on', G.AUDIO.state.musicOn);
      musicBtn.setAttribute('aria-pressed', String(G.AUDIO.state.musicOn));
      sfxBtn.classList.toggle('on', G.AUDIO.state.sfxOn);
      sfxBtn.setAttribute('aria-pressed', String(G.AUDIO.state.sfxOn));
    }
    syncAudioUI();
    musicBtn.addEventListener('click', () => { G.AUDIO.setMusic(!G.AUDIO.state.musicOn); syncAudioUI(); });
    sfxBtn.addEventListener('click', () => { G.AUDIO.setSfx(!G.AUDIO.state.sfxOn); syncAudioUI(); });
    musicVol.value = String(Math.round(G.AUDIO.state.musicVol * 100));
    sfxVol.value = String(Math.round(G.AUDIO.state.sfxVol * 100));
    musicVol.addEventListener('input', () => G.AUDIO.setMusicVol(Number(musicVol.value) / 100));
    sfxVol.addEventListener('input', () => G.AUDIO.setSfxVol(Number(sfxVol.value) / 100));
  }

  /* v2 : hook de test additif — donne aux portes accès aux fonctions de rendu
   * (n'affecte ni la logique ni le barème). */
  G.UI = {
    renderBoard, renderAll, updateScores, updateTimer,
    startGame, endGame, rowLabel,
    colorMode: () => colorMode,
    setColors: (m) => {
      colorMode = m === '4' ? '4' : '2';
      writeLS(LS.colors, colorMode);
      if (colorsSel) colorsSel.value = colorMode;
      applyColors();
    },
    /* Fix H2 : snapshots lecture seule (deep copy) de l'état vivant, qui
     * reste dans la closure — aucune mutation possible depuis l'extérieur. */
    boards: () => state ? JSON.parse(JSON.stringify(state.boards)) : null,
    board: (who) => (state && state.boards[who])
      ? JSON.parse(JSON.stringify(state.boards[who])) : null,
    deck: () => state ? JSON.parse(JSON.stringify(state.deck)) : null,
    result: () => (state && state.result) ? JSON.parse(JSON.stringify(state.result)) : null,
    humanMoves: () => state ? state.humanMoves : null,
    aiMoves: () => state ? state.aiMoves : null,
    stateInfo: () => state
      ? { difficulty: state.difficulty, timeLeft: state.timeLeft, running: state.running,
          over: state.over, humanMoves: state.humanMoves, aiMoves: state.aiMoves,
          ended: state.result !== null }
      : null,
    /* v2.1 — GO ! : état du chrono + résultat (test / automatisation) */
    goInfo: () => {
      if (!state) return null;
      const human = state.result ? state.result.human : G.boardScore(state.boards.human);
      const bonus = state.result ? state.result.bonus : 0;
      return {
        elapsedMs: state.time * 1000 - state.timeLeft,
        over: state.over,
        human,
        bonus,
        totalHuman: human + bonus
      };
    }
  };

  /* Init : partie réelle (seed 128 bits CSPRNG interne), aucun handle public. */
  state = G.createGame({ difficulty: 'normal', time: 30 });
  renderAll();
})();
