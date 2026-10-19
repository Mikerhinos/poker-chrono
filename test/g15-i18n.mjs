// PORTE 15 — i18n (v2.1.1) : 5 dictionnaires complets, EN par défaut,
// persistance localStorage, <html lang> dynamique, aucune chaîne FR hors
// dictionnaires sur la page EN.
// Usage : node test/run-headless.mjs test/g15-i18n.mjs [port]
import { connect, evalJs } from './cdp.mjs';
import { fileURLToPath } from 'node:url';

const PAGE_URL = 'file:///' + fileURLToPath(new URL('../index.html', import.meta.url)).replace(/\\/g, '/');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdp = await connect(process.argv[2] || '127.0.0.1:9359');
let pass = 0, fail = 0;
const check = (label, ok, detail = '') => {
  if (ok) { pass++; console.log('  ok  ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? ' — ' + detail : '')); }
};
async function page(expr) { return evalJs(cdp, expr); }

async function waitForPage() {
  for (let i = 0; i < 100; i++) {
    const r = await page(`(document.readyState === 'complete' && window.G && window.G.I18N) ? 'ready' : 'loading'`);
    if (r === 'ready') return;
    await sleep(200);
  }
  throw new Error('page jamais prête');
}

const run = async () => {
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Page.navigate', { url: PAGE_URL });
  await waitForPage();

  // 1) Langue par défaut : EN
  check('langue par défaut = en (getLang)', await page(`window.G.I18N.getLang()`) === 'en');
  check('<html lang="en" par défaut', await page(`document.documentElement.lang`) === 'en');
  check('titre EN appliqué', await page(`document.title`) === await page(`window.G.I18N.t('title')`),
    await page(`document.title`));
  check('meta description EN appliquée',
    await page(`document.querySelector('meta[name="description"]').content`) === await page(`window.G.I18N.t('meta_desc')`));

  // 2) 5 langues, dictionnaires complets : même jeu de clés, 0 valeur vide
  const langs = await page(`JSON.stringify(window.G.I18N.LANGS)`);
  check('5 langues (en, fr, es, it, de)', JSON.stringify([...JSON.parse(langs)].sort()) === JSON.stringify(['de', 'en', 'es', 'fr', 'it']), langs);
  const dictAudit = await page(`(() => {
    const D = window.G.I18N.dicts();
    const keysEn = Object.keys(D.en).sort();
    const bad = [];
    for (const l of window.G.I18N.LANGS) {
      const keys = Object.keys(D[l]).sort();
      if (JSON.stringify(keys) !== JSON.stringify(keysEn)) bad.push(l + ': clés divergentes');
      for (const k of keysEn) {
        const v = D[l][k];
        if (v === undefined || v === null || String(v).trim() === '') bad.push(l + '.' + k + ' vide');
      }
    }
    return { nKeys: keysEn.length, bad };
  })()`);
  check('5 dictionnaires : même jeu de clés', dictAudit.bad.length === 0 || dictAudit.bad.every((b) => !b.includes('clés divergentes')), JSON.stringify(dictAudit.bad));
  check('0 clé vide sur les 5 dictionnaires', dictAudit.bad.length === 0, JSON.stringify(dictAudit.bad));
  check('nombre de clés rapporté', dictAudit.nKeys > 40, String(dictAudit.nKeys));

  // 3) Noms de mains : chaque label canonique (FR, deck.js) a un nom non vide dans les 5 langues
  const handAudit = await page(`(() => {
    const labels = Object.values(window.G.HAND_LABEL).concat(['Incomplet']);
    const bad = [];
    for (const l of window.G.I18N.LANGS) {
      for (const lb of labels) {
        const shown = window.G.I18N.setLang(l) ? window.G.I18N.handName(lb) : '';
        if (!shown || String(shown).trim() === '') bad.push(l + '.' + lb);
      }
    }
    window.G.I18N.setLang('en');
    return bad;
  })()`);
  check('noms de mains traduits (9 mains + Incomplet, 5 langues)', handAudit.length === 0, JSON.stringify(handAudit));

  // 4) Aucune chaîne FR (caractères accentués) sur la page EN, hors <select id="lang">
  const frLeak = await page(`(() => {
    const langSel = document.querySelector('#lang');
    const clone = document.body.cloneNode(true);
    const c = clone.querySelector('#lang'); if (c) c.remove();
    const txt = clone.textContent || '';
    const m = txt.match(/[À-ÿ]/g);
    return m ? m.length : 0;
  })()`);
  check('aucun caractère FR accentué sur la page EN (hors menu langue)', frLeak === 0, String(frLeak));

  // 5) Bascule FR : <html lang>, titre, statut, options difficulté, persistance
  await page(`window.G.I18N.setLang('fr')`);
  check('FR : <html lang="fr">', await page(`document.documentElement.lang`) === 'fr');
  check('FR : titre traduit', await page(`document.title`) === await page(`window.G.I18N.t('title')`));
  check('FR : localStorage persisté', await page(`localStorage.getItem('poker-chrono-lang')`) === 'fr');
  const frDiff = await page(`JSON.stringify([...document.querySelectorAll('#diff option')].map((o) => o.textContent))`);
  check('FR : difficultés Facile/Normal/Difficile', frDiff.includes('Facile') && frDiff.includes('Normal') && frDiff.includes('Difficile'), frDiff);
  const frIdle = await page(`document.querySelector('#status').textContent`);
  check('FR : statut idle traduit', frIdle.includes('Prêt'), frIdle);

  // 6) Bascule DE puis retour EN : cohérence + persistance
  await page(`window.G.I18N.setLang('de')`);
  check('DE : <html lang="de">', await page(`document.documentElement.lang`) === 'de');
  check('DE : localStorage', await page(`localStorage.getItem('poker-chrono-lang')`) === 'de');
  await page(`window.G.I18N.setLang('en')`);
  check('EN restauré : <html lang="en">', await page(`document.documentElement.lang`) === 'en');
  check('EN restauré : localStorage', await page(`localStorage.getItem('poker-chrono-lang')`) === 'en');

  // 7) Persistance au rechargement
  await page(`window.G.I18N.setLang('it')`);
  await cdp.send('Page.reload');
  await waitForPage();
  check('persistance au rechargement (it)', await page(`window.G.I18N.getLang()`) === 'it' && await page(`document.documentElement.lang`) === 'it');
  await page(`window.G.I18N.setLang('en')`);

  console.log(`g15-i18n : ${pass} ok, ${fail} fail`);
  process.exit(fail ? 1 : 0);
};

await run();
