// Probe v2.1.2 item 3 : position de la cellule IA data-idx="3" et comportement
// de elementFromPoint au centre de sa bounding box (viewport headless 800x600).
import { connect, evalJs } from '../../cdp.mjs';
import { fileURLToPath } from 'node:url';

const PAGE_PATH = fileURLToPath(new URL('../../../index.html', import.meta.url)).replace(/\\/g, '/');
const PAGE_URL = 'file:///' + PAGE_PATH;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdp = await connect(process.argv[2] || '127.0.0.1:9361');
const page = (expr) => evalJs(cdp, expr);

await cdp.send('Page.enable');
await cdp.send('Page.navigate', { url: PAGE_URL });
for (let i = 0; i < 100; i++) {
  const r = await page(`document.readyState === 'complete' && window.G && window.G.UI ? 'ready' : 'loading'`);
  if (r === 'ready') break;
  await sleep(200);
}

const dbg = JSON.parse(await page(`JSON.stringify({ title: document.title, href: location.href, hasBoard: !!document.querySelector('#board-human'), ready: document.readyState })`));
console.log('PAGE:', JSON.stringify(dbg));
if (!dbg.hasBoard) { console.log('BOARD ABSENT — navigation en échec'); process.exit(1); }

const info = JSON.parse(await page(`JSON.stringify({
  viewport: { w: window.innerWidth, h: window.innerHeight },
  docHeight: document.documentElement.scrollHeight,
  humanBoard: (r => ({ top: r.top, bottom: r.bottom, w: r.width, h: r.height }))
    (document.querySelector('#board-human').getBoundingClientRect()),
  aiBoard: (r => ({ top: r.top, bottom: r.bottom, w: r.width, h: r.height }))
    (document.querySelector('#board-ai').getBoundingClientRect()),
  aiCell3: (r => ({ top: r.top, bottom: r.bottom, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }))
    (document.querySelector('#board-ai .cell[data-idx="3"]').getBoundingClientRect())
})`));
console.log('AVANT SCROLL:', JSON.stringify(info, null, 2));

const probe1 = JSON.parse(await page(`(() => {
  const el = document.elementFromPoint(${info.aiCell3.cx}, ${info.aiCell3.cy});
  return JSON.stringify({ tag: el && el.tagName, cls: el && el.className, cell: el && el.closest && !!el.closest('.cell') });
})()`));
console.log('elementFromPoint centre AVANT scroll:', JSON.stringify(probe1));

const probe2 = JSON.parse(await page(`(() => {
  const cell = document.querySelector('#board-ai .cell[data-idx="3"]');
  cell.scrollIntoView({ block: 'center' });
  const r = cell.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const el = document.elementFromPoint(cx, cy);
  return JSON.stringify({ rect: { top: r.top, bottom: r.bottom, cx, cy },
    el: el && el.tagName, cls: el && el.className, cell: el && el.closest && !!el.closest('.cell'),
    isHuman: el && el.closest && !!el.closest('#board-human') });
})()`));
console.log('APRES scrollIntoView:', JSON.stringify(probe2, null, 2));
process.exit(0);
