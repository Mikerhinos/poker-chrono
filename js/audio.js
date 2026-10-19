/* Poker Chrono v2 — couche audio 100 % Web Audio API (zéro fichier, zéro dépendance).
 * Musique de fond (séquenceur lookahead, gamme de la mineur) + SFX synthétiques.
 * Démarrage au premier geste utilisateur (politique autoplay des navigateurs).
 * Toggles ON/OFF musique & SFX + volumes séparés, persistés en localStorage.
 * Conçu pour être testable headless : si le AudioContext est absent/stub, aucune
 * exception ne fuit — le module reste fonctionnel (silencieux). */
(function () {
  'use strict';

  const KEY = {
    music: 'poker-chrono-audio-music',
    sfx: 'poker-chrono-audio-sfx',
    mv: 'poker-chrono-audio-music-vol',
    sv: 'poker-chrono-audio-sfx-vol'
  };

  function lsGet(k, dflt) {
    try { const v = localStorage.getItem(k); return v === null ? dflt : v; }
    catch (err) { return dflt; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, String(v)); } catch (err) { /* stockage indisponible */ }
  }
  function clamp01(v) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.7;
  }

  const A = {
    ctx: null,
    musicGain: null,
    sfxGain: null,
    musicOn: lsGet(KEY.music, '1') === '1',
    sfxOn: lsGet(KEY.sfx, '1') === '1',
    musicVol: clamp01(lsGet(KEY.mv, '0.7')),
    sfxVol: clamp01(lsGet(KEY.sv, '0.8')),
    step: 0,
    nextStepTime: 0,
    timer: null,
    /* v2.1 (fix réactivité) : le 1er clic sur un toggle ARME le son
       (force ON, contexte créé/repris dans le même tick) au lieu
       d'inverser l'état affiché. Clics suivants : basculement normal. */
    _musicArmed: false,
    _sfxArmed: false
  };

  /* Partition 16 pas (120 BPM, 1 pas = 1/4 de temps). 0 = repos. */
  const STEP = 0.25;
  const BASS = [45, 45, 0, 45, 48, 0, 48, 0, 43, 43, 0, 43, 47, 0, 48, 0];
  const LEAD = [69, 0, 72, 74, 0, 72, 0, 69, 67, 0, 69, 71, 0, 74, 0, 71];

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function musicGainValue() {
    return A.musicOn ? Math.pow(A.musicVol, 2) * 0.5 : 0;
  }
  function sfxGainValue() {
    return A.sfxOn ? Math.pow(A.sfxVol, 2) : 0;
  }

  function ensure() {
    if (A.ctx) {
      try { if (A.ctx.state === 'suspended') A.ctx.resume().catch(() => {}); }
      catch (err) { /* déjà prêt ou contexte indisponible */ }
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (typeof AC !== 'function') return false;
    try {
      A.ctx = new AC();
      A.musicGain = A.ctx.createGain();
      A.musicGain.gain.value = musicGainValue();
      A.musicGain.connect(A.ctx.destination);
      A.sfxGain = A.ctx.createGain();
      A.sfxGain.gain.value = sfxGainValue();
      A.sfxGain.connect(A.ctx.destination);
      if (A.ctx.state === 'suspended') A.ctx.resume().catch(() => {});
      startMusic();
    } catch (err) {
      A.ctx = null;
      return false;
    }
    return true;
  }

  function startMusic() {
    if (A.timer || !A.ctx) return;
    A.step = 0;
    A.nextStepTime = A.ctx.currentTime + 0.1;
    A.timer = setInterval(scheduler, 50);
  }

  /* Séquenceur à lookahead : planifie les notes un peu devant currentTime. */
  function scheduler() {
    if (!A.ctx) return;
    try {
      if (A.ctx.state === 'suspended') {
        /* pas de temps qui passe tant que le contexte est en pause : on resynchronise */
        A.nextStepTime = A.ctx.currentTime + 0.1;
        return;
      }
      while (A.nextStepTime < A.ctx.currentTime + 0.18) {
        playStep(A.step, A.nextStepTime);
        A.step = (A.step + 1) % 16;
        A.nextStepTime += STEP;
      }
    } catch (err) { /* la musique est non critique */ }
  }

  function playStep(step, t) {
    if (!A.musicOn) return;
    const b = BASS[step];
    const l = LEAD[step];
    if (b) note(midiToFreq(b), t, STEP * 1.8, 'triangle', 0.5, A.musicGain);
    if (l) note(midiToFreq(l), t, STEP * 1.2, 'sine', 0.28, A.musicGain);
    if (step % 2 === 1) note(6000, t, 0.03, 'square', 0.012, A.musicGain);
  }

  function note(freq, when, dur, type, peak, dest) {
    if (!A.ctx) return;
    try {
      const o = A.ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g);
      g.connect(dest);
      o.start(when);
      o.stop(when + dur + 0.05);
    } catch (err) { /* note perdue : non critique */ }
  }

  function glide(freq0, freq1, when, dur, type, peak, dest) {
    if (!A.ctx) return;
    try {
      const o = A.ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(Math.max(20, freq0), when);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, freq1), when + dur);
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g);
      g.connect(dest);
      o.start(when);
      o.stop(when + dur + 0.05);
    } catch (err) { /* non critique */ }
  }

  function noiseBurst(when, dur, cutoff0, cutoff1, gainVal, dest) {
    if (!A.ctx) return;
    try {
      const len = Math.max(1, Math.floor(A.ctx.sampleRate * dur));
      const buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      const src = A.ctx.createBufferSource();
      src.buffer = buf;
      const f = A.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(Math.max(40, cutoff0), when);
      f.frequency.exponentialRampToValueAtTime(Math.max(40, cutoff1), when + dur);
      const g = A.ctx.createGain();
      g.gain.value = gainVal;
      src.connect(f);
      f.connect(g);
      g.connect(dest);
      src.start(when);
    } catch (err) { /* non critique */ }
  }

  function ready() {
    return !!(A.ctx && A.ctx.state === 'running');
  }

  /* ---------- SFX ---------- */

  const sfx = {
    /* pop du deal : 3 blips montants */
    deal() {
      if (!ready()) return;
      const t = A.ctx.currentTime;
      [520, 660, 820].forEach((f, i) => note(f, t + i * 0.07, 0.12, 'sine', 0.25, A.sfxGain));
    },
    /* swap humain : chirp montant */
    swap() {
      if (!ready()) return;
      glide(320, 760, A.ctx.currentTime, 0.14, 'square', 0.12, A.sfxGain);
    },
    /* swap IA : chirp plus doux */
    swapSoft() {
      if (!ready()) return;
      glide(280, 520, A.ctx.currentTime, 0.12, 'sine', 0.06, A.sfxGain);
    },
    /* tic (secondes impaires) */
    tick() { if (ready()) note(1250, A.ctx.currentTime, 0.05, 'sine', 0.16, A.sfxGain); },
    /* tac (secondes paires) */
    tock() { if (ready()) note(830, A.ctx.currentTime, 0.05, 'sine', 0.14, A.sfxGain); },
    /* sirène finale (≤ 5 s) */
    sirene() {
      if (!ready()) return;
      const t = A.ctx.currentTime;
      glide(700, 220, t, 0.9, 'sawtooth', 0.18, A.sfxGain);
      glide(1400, 440, t + 0.05, 0.8, 'sine', 0.08, A.sfxGain);
    },
    /* explosion de victoire : bruit filtré + descente de grave + fanfare */
    victoire() {
      if (!ready()) return;
      const t = A.ctx.currentTime;
      noiseBurst(t, 0.9, 1800, 120, 0.5, A.sfxGain);
      glide(110, 40, t, 0.7, 'sine', 0.4, A.sfxGain);
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        note(f, t + 0.15 + i * 0.12, 0.5, 'triangle', 0.22, A.sfxGain));
    },
    /* chute de défaite */
    defaite() {
      if (!ready()) return;
      glide(300, 120, A.ctx.currentTime, 0.8, 'sawtooth', 0.15, A.sfxGain);
    },
    /* accord neutre pour l'égalité */
    egalite() {
      if (!ready()) return;
      const t = A.ctx.currentTime;
      [440, 554.37].forEach((f, i) => note(f, t + i * 0.18, 0.4, 'sine', 0.18, A.sfxGain));
    }
  };

  /* ---------- API publique ---------- */

  function setMusic(on) {
    if (!A._musicArmed) { A._musicArmed = true; on = true; }
    A.musicOn = !!on;
    lsSet(KEY.music, A.musicOn ? '1' : '0');
    if (A.musicOn) ensure(); // arme le contexte au premier geste (autoplay)
    if (A.musicGain) A.musicGain.gain.value = musicGainValue();
  }
  function setSfx(on) {
    if (!A._sfxArmed) { A._sfxArmed = true; on = true; }
    A.sfxOn = !!on;
    lsSet(KEY.sfx, A.sfxOn ? '1' : '0');
    if (A.sfxOn) ensure(); // arme le contexte au premier geste (autoplay)
    if (A.sfxGain) A.sfxGain.gain.value = sfxGainValue();
  }
  function setMusicVol(v) {
    A.musicVol = clamp01(v);
    lsSet(KEY.mv, String(A.musicVol));
    if (A.musicGain) A.musicGain.gain.value = musicGainValue();
  }
  function setSfxVol(v) {
    A.sfxVol = clamp01(v);
    lsSet(KEY.sv, String(A.sfxVol));
    if (A.sfxGain) A.sfxGain.gain.value = sfxGainValue();
  }

  /* Démarrage au premier clic / touche (autoplay policy). */
  function onFirstGesture() {
    try { ensure(); } catch (err) { /* non critique */ }
  }
  ['pointerdown', 'keydown', 'click'].forEach((ev) => {
    document.addEventListener(ev, onFirstGesture, { capture: true, passive: true });
  });

  globalThis.G = globalThis.G || {};
  G.AUDIO = {
    ensure,
    setMusic,
    setSfx,
    setMusicVol,
    setSfxVol,
    sfx,
    ready,
    state: A
  };
})();
