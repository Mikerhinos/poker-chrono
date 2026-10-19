// Probe : rects + styles calculés à 1920x1080 (diagnostic décision D)
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { connect, evalJs } from './cdp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_BIN || 'chromium';
const PORT = 9471;
const udd = mkdtempSync(join(os.tmpdir(), 'probe-d-'));
const url = 'file://' + resolve(HERE, '..', 'index.html');

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${PORT}`, `--user-data-dir=${udd}`, '--window-size=1920,1080', url], { stdio: 'ignore' });
const cdp = await connect(`127.0.0.1:${PORT}`);
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await new Promise((r) => setTimeout(r, 1500));

const probe = JSON.parse(await evalJs(cdp, `(() => {
  const rc = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width }; };
  const cs = (el, props) => { const s = getComputedStyle(el); const o = {}; for (const p of props) o[p] = s[p]; return o; };
  const main = document.querySelector('main');
  const human = document.querySelector('#board-human');
  const ai = document.querySelector('#board-ai');
  const h2 = human.querySelector('h2');
  const total = human.querySelector('.total');
  const rowH = human.querySelector('.row');
  const rowA = ai.querySelector('.row');
  const cellsA = [...ai.querySelectorAll('.row')].map((row) => [...row.querySelectorAll('.cell')].map((c) => c.getBoundingClientRect().left));
  const cellsH = [...human.querySelectorAll('.row')].map((row) => [...row.querySelectorAll('.cell')].map((c) => c.getBoundingClientRect().left));
  return JSON.stringify({
    viewport: [innerWidth, innerHeight],
    main: rc(main),
    mainCS: cs(main, ['gridTemplateColumns', 'gap', 'padding', 'width', 'alignItems', 'justifyItems']),
    human: rc(human),
    humanCS: cs(human, ['display', 'width', 'padding', 'borderRightWidth', 'boxSizing', 'margin']),
    ai: rc(ai),
    aiCS: cs(ai, ['display', 'width', 'padding', 'borderLeftWidth', 'boxSizing']),
    h2: rc(h2), h2CS: cs(h2, ['display', 'margin', 'width']),
    total: rc(total), totalCS: cs(total, ['display', 'width', 'margin']),
    rowH: rc(rowH), rowA: rc(rowA),
    rowHCS: cs(rowH, ['display', 'width', 'justifyContent', 'gridTemplateColumns']),
    rowACS: cs(rowA, ['display', 'width', 'justifyContent', 'gridTemplateColumns']),
    cellsA, cellsH
  });
})()`));
console.log(JSON.stringify(probe));
try { cdp.close(); } catch {}
try { chrome.kill('SIGKILL'); } catch {}
process.exit(0);
