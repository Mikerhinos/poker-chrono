// Charge le module de logique de poker-chrono (js/deck.js + js/game.js) dans Node (sans DOM).
// Split v2.0.0 : le mono index.html est décomposé en shell + css/ + js/ ; la logique vit dans js/.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..');
export const INDEX_HTML = join(ROOT, 'index.html');
export const DECK_JS = join(ROOT, 'js', 'deck.js');
export const GAME_JS = join(ROOT, 'js', 'game.js');
export const RUSH_HTML = join(ROOT, '..', 'poker-rush', 'index.html');

export function loadLogic() {
  const deck = readFileSync(DECK_JS, 'utf8');
  const game = readFileSync(GAME_JS, 'utf8');
  new Function(deck + '\n' + game)(); // IIFE : s'attache à globalThis.G
  const G = globalThis.G;
  if (!G || typeof G.evaluate5 !== 'function') throw new Error('globalThis.G manquant');
  return G;
}

// Extraire le texte exact d'une fonction `function name(` de n'importe quel HTML.
export function extractFn(src, name) {
  const idx = src.indexOf('function ' + name + '(');
  if (idx < 0) return null;
  const brace = src.indexOf('{', idx);
  let depth = 0;
  for (let j = brace; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(idx, j + 1); }
  }
  return null;
}

// Extraire la constante littérale `const NAME = {...}` ou `[...]` de n'importe quel HTML.
export function extractConstObject(src, name) {
  const idx = src.indexOf('const ' + name + ' = ');
  if (idx < 0) return null;
  const open = src[idx + name.length + 9]; // après 'const NAME = '
  if (open !== '{' && open !== '[') return null;
  const close = open === '{' ? '}' : ']';
  const brace = src.indexOf(open, idx);
  let depth = 0;
  for (let j = brace; j < src.length; j++) {
    if (src[j] === open) depth++;
    else if (src[j] === close) { depth--; if (depth === 0) return src.slice(idx, j + 1); }
  }
  return null;
}

// Petit harness de assertions
export function makeChecker(prefix) {
  let pass = 0, fail = 0;
  const failures = [];
  const check = (name, cond, info = '') => {
    if (cond) { pass++; console.log(`  ok   ${name}${info ? ' — ' + info : ''}`); }
    else { fail++; failures.push(name); console.log(`  FAIL ${name}${info ? ' — ' + info : ''}`); }
  };
  const summary = (gate) => {
    console.log(`\n[${prefix}] ${pass} OK, ${fail} FAIL`);
    if (failures.length) console.log(`[${prefix}] échecs : ${failures.join(' | ')}`);
    console.log(`[${prefix}] ${fail === 0 ? 'PORTE PASSÉE' : 'PORTE ÉCHOUÉE'}`);
    return fail === 0;
  };
  return { check, summary };
}
