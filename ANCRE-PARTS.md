# ANCRE-PARTS — poker-chrono (fichier d'ancres, MAJ à chaque étape)

> Discipline : AUCUNE lecture complète > 15 Ko. grep → fenêtres ±20-60 lignes autour des ancres → patch sur snippets en contexte. Ne jamais re-lire pour redécouvrir.

## Baseline mono (HEAD 855a12fe9bc1d86585ebfdbc5b9f8f461a352163, v2.0.0)
- `index.html` : 119 687 o, 1503 lignes (LF), sha256 `3b3644e63de266294d965a1bb27d18b6986f1e9d77868941fa0e7ad843a0e1a8`.
- L1-6 : doctype / html lang=fr / head / meta×2 / title. L7 `<style>` … L174 `</style>` (72 028 o, CSS v1 L8-75 + couche v2 L77-173). L175 `</head>`, L176 `<body>`, L177 `<canvas id="fx">`, L178 `<header>`.
- L1499 `})();`, L1500 `</script>`, L1501 `</body>`, L1502 `</html>`, L1503 vide.

### Blocs script du mono (ancres)
| Bloc | Lignes (mono) | Contenu | Ancres clés |
|---|---|---|---|
| S1 `id="game-logic"` | 236-642 | IIFE L238-641, corps L239-640 | RANKS L247 (8 rangs 7..14), isFull L262, evaluate5 L268, boardScore L302, boardBreakdown L304, TIME_OPTIONS L314, AI_INTERVAL L315, PAIRS L318, rowIdx/colIdx L321-322, mulberry32 L324, xoshiro128ss L336, deriveStream L355, swapCells L368, deltaSwap L377, bestNextDelta L397, evalGreedy L407, eval3ply L419, neutralMove L445, createGame L453 (deck L485-489, **deal L490-493 : 15+15+2, PAS miroir**), simulateGame L610, cardText L627, `globalThis.G =` L631 (**version L632 : '2.0.0'**) |
| S2 `id="audio"` | 644-914 | IIFE, WebAudio | `globalThis.G.AUDIO =` L903 |
| S3 `id="fx"` | 916-1093 | IIFE, canvas FX | `globalThis.G.FX =` L1055 |
| S4 `id="ui"` | 1095-1500 | IIFE, DOM/rendu | `const G = globalThis.G` L1099, init `start(); tick(); render(); startAudio()` L1496-1498 |

### W3C / version (phase 2)
- `id="fx"` double : canvas L177 + `<script id="fx">` L916 → retirer l'id du `<script>` (p2.6).
- `#final-title` : `<h2 id="final-title" class="final"></h2>` L224, vide → titre de repli non vide (p2.6).
- Pin version '2.0.0' : S1 L632 + g14 (check version) + README + COMPT-RENDU ; g12-seed.mjs / poc-repro.mjs déjà pin 2.1.0 (scaffold A1/A2).

### Écueils v2.1 (phase 2)
- Scaffold A1/A2 g3-swap.js / g12-seed.mjs : **contradiction** `deck.length===17` vs `uniq52.size===52` et vs brief « 37 non utilisées » → corriger en **37** (main 15 + main 15 + deck 37 = 67 objets, 52 uniques).
- 900 sims : « même méthode que les 250-370 » → méthode exacte à récupérer dans COMPT-RENDU avant re-fire.
- Max théorique d'un plateau : **à re-déduire** (0 occurrence de 1500/1501 dans le code — valeur dérivée, pas de constante).
- GO : 1 pt/s restante, activation 5 s, 2e clic idempotent, IA ne fait jamais GO. Cap anti-abus : 85 UNIQUEMENT si min+85 ≤ P1−30, sinon cap = floor(P1−min−30). Scaffolds non trackés : test/go-logic.mjs (bug parse L82 à corriger), go-ui.mjs, go-ui-85.mjs, probe-audio.mjs, reactivity.mjs, w3c.mjs.
- README : « 52 cartes (Texas Hold'em), 15 tirées au hasard par partie, deal miroir, 37 non utilisées ».

## Phase 1 — SPLIT (plan exécuté)
- `css/base.css` = mono L8-76 (3,456 o) · `css/fonts.css` = L77-92 (~65 Ko : 2 @font-face, **VT323 base64 59 646 o L84 — asset atomique, > 20 Ko justifié**) · `css/theme.css` = L93-143 · `css/anim.css` = L144-173. Concatenation byte-identique au `<style>` mono.
- `js/deck.js` = S1 L239-367 (barème + config + PRNG, `'use strict'` d'origine L239 conservé) · `js/game.js` = `'use strict';` inséré + S1 L368-640 (diff justifié : wrapper IIFE L238/L641 retiré) · `js/audio.js` = S2 L645-913 · `js/fx.js` = S3 L917-1092 · `js/ui.js` = S4 L1096-1499 (byte-identiques, IIFEs conservées).
- Shell `index.html` : L1-6 + 4 `<link rel="stylesheet">` + L175-235 + 5 `<script src>` (ids `audio`/`fx`/`ui` conservés — retrait `id="fx"` = p2.6, zéro changement comportemental sinon).
- `test/lib.mjs` `loadLogic()` : `new Function(deck + '\n' + game)()` (même portée que l'IIFE mono) ; `INDEX_HTML` toujours exporté.
- Portes mises à jour structure (critères inchangés) : `test/g8-scan.mjs` (scan index.html+css/++js/, taille = somme fichiers) ; `test/g14-innertest.mjs` (concatenation tous fichiers, check src local non http) ; `test/poc-repro.mjs` (comptage innerHTML sur tous fichiers).

### Étape 1.1 — Baseline « avant » (worktree 855a12f)
- Worktree : `pc-baseline-855a12f` (detached @ 855a12f), logs `test/results/porte-1..14.log` (redirections stdout).
- Commandes : `node test/g1-scores.js` · `node test/g2g4-headless.js` · `node test/g3-swap.js` · `node test/run-headless.mjs g4-colors.mjs 9351` · `g5-rownames.mjs 9352` · `g6-audio.mjs 9353` · `g7-fx.mjs 9354` · `node test/g8-scan.mjs` · `g9-boards.mjs 9355` · `g5-run.mjs 9356` · `g11-noscore.mjs 9358` · `g12-seed.mjs 9359` · `g13-best.mjs 9360` · `node test/g14-innertest.mjs`.
- Logs recopiés ensuite → `test/results/pre-split-baseline/porte-N.log` (preuve « avant »).

### Étape 1.2 — « Après » (arbre principal, split commité)
- idem, SAUF P3/P12 via copies `test/tmp14/g3-swap.js` + `test/tmp14/g12-seed.mjs` = versions **commitées 2.0.0** (le working tree porte les versions 2.1 A1/A2, hors périmètre phase 1).
- Logs → `test/results/porte-1..14.log` (commités = preuve « après »).

## État courant (MAJ progressive)
- 2026-10-18 18:55 : lecture complète du mono terminée (carte ci-dessus), baseline sha256 confirmée, tree git = 8 M + 8 ?? (résidus A1/A2 conservés).
- 2026-10-18 18:57 : baseline « avant » lancée en fond (worktree).
- [à compléter : split, patchs portes, vérif byte-identique, commit, suites, commits preuves]
