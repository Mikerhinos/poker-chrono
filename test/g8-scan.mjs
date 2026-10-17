// PORTE 8 — Zéro dépendance externe : scan statique du fichier index.html.
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeChecker } from './lib.mjs';

const INDEX_HTML = fileURLToPath(new URL('../index.html', import.meta.url));
const { check, summary } = makeChecker('PORTE 8');

const html = readFileSync(INDEX_HTML, 'utf8');
const bytes = statSync(INDEX_HTML).size;

const pats = [
  ['URL http(s)://', /https?:\/\//i],
  ['protocole // (protocol-relative)', /["']\/\/[a-z0-9]/i],
  ['<script src=', /<script[^>]*\ssrc\s*=/i],
  ['<link', /<link\b/i],
  ['<img', /<img\b/i],
  ['<iframe|<object|<embed|<video|<audio|<source', /<(iframe|object|embed|video|audio|source)\b/i],
  ['@import', /@import\b/i],
  ['url() non data:', /url\(\s*(?!["']?data:)/i],
  ['attribut src= (non data:/blob:/about:)', /\bsrc\s*=\s*["'](?!(?:data:|blob:|about:))/i],
  ['fetch(/XMLHttpRequest/WebSocket', /\bfetch\s*\(|new\s+(XMLHttpRequest|WebSocket)\b/i],
  ['import/export externe (module URL)', /\bimport\s+.*from\s+["']https?/i]
];

for (const [label, re] of pats) {
  const m = html.match(re);
  check(`zéro occurrence : ${label}`, m === null, m ? 'trouvé : …' + html.slice(Math.max(0, m.index - 60), m.index + 60).replace(/\n/g, ' ') + '…' : '');
}

const fonts = (html.match(/data:font\/woff2;base64/g) || []).length;
check('2 polices embarquées en data:font/woff2;base64', fonts === 2, `trouvées : ${fonts}`);
check('aucun chargement de police externe (@font-face + src local)', (html.match(/@font-face/g) || []).length === fonts, `@font-face : ${html.match(/@font-face/g)?.length}`);
check('taille finale entre 100 et 200 Ko', bytes >= 100 * 1024 && bytes <= 200 * 1024, `${bytes} octets`);

summary('PORTE 8');
