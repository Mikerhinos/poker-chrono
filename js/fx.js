/* Poker Chrono v2 — couche FX 100 % canvas 2D (zéro dépendance, zéro fichier).
 * Canvas plein écran au-dessus du DOM, pointer-events:none.
 * Particules poolées (pool fixe, aucun GC par frame), compositing additif
 * (globalCompositeOperation='lighter'), sprites de lueur pré-rendus.
 * Mesure FPS intégrée (G.FX.fps()) pour la porte 7. */
(function () {
  'use strict';

  const cv = document.getElementById('fx');
  if (!cv) return;
  const x2d = cv.getContext('2d');
  if (!x2d) return;

  let W = 1;
  let H = 1;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, window.innerWidth);
    H = Math.max(1, window.innerHeight);
    cv.width = Math.max(1, Math.floor(W * dpr));
    cv.height = Math.max(1, Math.floor(H * dpr));
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    x2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  /* Sprites de lueur radiale pré-rendus (compositing additif). */
  const COLORS = {
    gold: '255,209,102',
    red: '255,107,107',
    green: '62,207,142',
    blue: '91,140,255',
    white: '232,236,244',
    cyan: '102,222,255'
  };
  const SPR = 64;
  const sprites = {};
  for (const k in COLORS) {
    const c = document.createElement('canvas');
    c.width = c.height = SPR;
    const g = c.getContext('2d');
    if (!g) continue;
    const grd = g.createRadialGradient(SPR / 2, SPR / 2, 0, SPR / 2, SPR / 2, SPR / 2);
    grd.addColorStop(0, 'rgba(' + COLORS[k] + ',0.95)');
    grd.addColorStop(0.35, 'rgba(' + COLORS[k] + ',0.35)');
    grd.addColorStop(1, 'rgba(' + COLORS[k] + ',0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, SPR, SPR);
    sprites[k] = c;
  }

  /* Pool fixe de particules : zéro allocation par frame. */
  const POOL = 240;
  const P = [];
  let next = 0;
  for (let i = 0; i < POOL; i++) {
    P.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 10, col: 'gold', on: false });
  }

  function spawn(x, y, o) {
    const p = P[next];
    next = (next + 1) % POOL;
    const ang = (o && o.angle !== undefined) ? o.angle : Math.random() * Math.PI * 2;
    const sp = (o && o.speed !== undefined) ? o.speed : (0.05 + Math.random() * 0.35); // px/ms
    p.x = x;
    p.y = y;
    p.vx = Math.cos(ang) * sp;
    p.vy = Math.sin(ang) * sp - (o && o.up || 0);
    p.max = p.life = (o && o.life !== undefined) ? o.life : (500 + Math.random() * 600);
    p.size = (o && o.size !== undefined) ? o.size : (6 + Math.random() * 10);
    p.col = (o && o.col) || 'gold';
    p.on = true;
  }

  function burst(x, y, n, o) {
    for (let i = 0; i < n; i++) spawn(x, y, o);
  }

  function centerOf(sel) {
    const el = document.querySelector(sel);
    if (!el) return [W / 2, H / 2];
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  /* Boucle rAF : physique + rendu additif + mesure FPS (fenêtre 1 s). */
  let last = (typeof performance !== 'undefined') ? performance.now() : 0;
  let frames = 0;
  let fpsWindowStart = last;
  let fps = 0;

  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(50, now - last);
    last = now;
    frames++;
    if (now - fpsWindowStart >= 1000) {
      fps = Math.round(frames * 1000 / (now - fpsWindowStart));
      frames = 0;
      fpsWindowStart = now;
    }
    x2d.clearRect(0, 0, W, H);
    let any = false;
    for (let i = 0; i < POOL; i++) if (P[i].on) { any = true; break; }
    if (!any) return;
    x2d.globalCompositeOperation = 'lighter';
    for (let i = 0; i < POOL; i++) {
      const p = P[i];
      if (!p.on) continue;
      p.life -= dt;
      if (p.life <= 0) { p.on = false; continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.0004 * dt; // gravité légère
      p.vx *= Math.pow(0.999, dt); // friction
      const a = Math.max(0, p.life / p.max);
      x2d.globalAlpha = a;
      const s = p.size * (0.6 + 0.4 * a);
      x2d.drawImage(sprites[p.col] || sprites.gold, p.x - s / 2, p.y - s / 2, s, s);
    }
    x2d.globalAlpha = 1;
    x2d.globalCompositeOperation = 'source-over';
  }
  requestAnimationFrame(loop);

  function shake() {
    const m = document.querySelector('main');
    if (!m) return;
    m.classList.remove('shake');
    void m.offsetWidth; // relance l'animation
    m.classList.add('shake');
    setTimeout(() => m.classList.remove('shake'), 700);
  }

  globalThis.G = globalThis.G || {};
  G.FX = {
    fps: () => fps,
    burst: burst,
    /* burst sur une cellule (swap). */
    cellBurst: (sel) => {
      const c = centerOf(sel);
      burst(c[0], c[1], 8, { col: 'cyan', speed: 0.15, life: 500, size: 8 });
    },
    /* burst sur tout un plateau (deal). */
    boardBurst: (sel) => {
      const c = centerOf(sel);
      burst(c[0], c[1], 26, { col: 'gold', speed: 0.3, life: 900, size: 12 });
    },
    /* fusée finale de victoire (rafales multi-points). */
    winBurst: () => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => burst(
          W * (0.15 + 0.175 * i), H * 0.35, 30,
          { col: i % 2 ? 'gold' : 'cyan', speed: 0.45, life: 1400, size: 14, up: 0.12 }
        ), i * 120);
      }
    },
    loseBurst: () => {
      burst(W / 2, H / 2, 34, { col: 'red', speed: 0.35, life: 1000, size: 12 });
    },
    rowSparkle: (sel) => {
      const c = centerOf(sel);
      burst(c[0], c[1], 10, { col: 'green', speed: 0.12, life: 600, size: 7 });
    },
    shake: shake,
    poolSize: () => POOL,
    activeCount: () => {
      let n = 0;
      for (let i = 0; i < POOL; i++) if (P[i].on) n++;
      return n;
    }
  };
})();
