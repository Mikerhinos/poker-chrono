# Compte-rendu — Poker Chrono (POC)

**Date** : 2026-10-16 · **Auteur** : K0D3R · **Environnement** : Windows 11, Node v26.7.0, Chrome 155.0.8059.82 (headless, CDP port 9347).
**Dossier** : `C:\Users\Mikerhinos\.openmausbot\workspaces\8b7108b4-e038-49f5-90ef-53f03bd46b30\poker-chrono\`

**Bilan : 5 portes / 5 passées.**

---

## PORTE 1 — Régression barème + verbatim poker-rush — ✅ PASSÉE (30 OK, 0 FAIL)

Commande : `node test/g1-scores.js`

| Cas d'épreuve | Résultat attendu | Résultat obtenu |
|---|---|---|
| Quinte flush 7-8-9-10-V ♠ | `quinte_flush` (500) | ✅ 500 |
| Quatre d'as | `quatre` (300) | ✅ 300 |
| Full RRRDD | `full` (150) | ✅ 150 |
| Couleur sans quinte | `couleur` (100) | ✅ 100 |
| Quinte sans couleur | `quinte` (75) | ✅ 75 |
| Quinte 10-J-Q-D-A (A haute) | `quinte` (75) | ✅ 75 |
| Brelan | `brelan` (40) | ✅ 40 |
| Double paire | `double_paire` (25) | ✅ 25 |
| Paire | `paire` (10) | ✅ 10 |
| Carte haute | `carte_haute` (2) | ✅ 2 |
| **Pas de quinte enroulée** A-7-8-9-10 | `carte_haute` (2) | ✅ 2 |
| Quatre (300) > full (150) | ordre strict | ✅ |
| Ordre complet du barème | 500>300>150>100>75>40>25>10>2 | ✅ |
| Éval 4 cartes / cartes invalides (r=15, s=5) | erreur levée | ✅ |
| `boardScore` sur 500+300+2 | 802 | ✅ 802 |
| `boardBreakdown` 3 lignes étiquetées | 3 lignes | ✅ |
| `evaluate5`, `rowScore`, `boardScore`, `boardBreakdown`, `isFull`, `isValidCard` | source identique poker-rush | ✅ byte-identique |
| `RANKS`, `RANK_LABEL`, `SUIT_LABEL`, `SUIT_NAME`, `HAND_SCORES`, `HAND_LABEL` | const identiques poker-rush | ✅ byte-identique |

## PORTE 2 — ≥ 900 parties headless, 0 erreur JS — ✅ PASSÉE

Commande : `node test/g2g4-headless.js` (protocole : tick 100 ms, humain = swap aléatoire/1 s, 300 parties × 3 difficultés, temps 20 s, seeds 1000–1299)

- **900 parties jouées** en **109,1 s** (wall clock).
- **0 erreur JS** sur les 900 parties.

## PORTE 3 — Mécanique de swap — ✅ PASSÉE (20 OK, 0 FAIL)

Commande : `node test/g3-swap.js`

- Deal : 32 cartes uniques (15 + 15 + 2 réserve). ✅
- Swap valide : accepté, cellules 0/1 échangées, reste du plateau inchangé, `humanMoves` incrémenté. ✅
- Case identique → refus `self`, plateau inchangé. ✅
- Hors plateau → refus `out`, plateau inchangé. ✅
- 6 formes invalides → refus `invalid` ; dépôt `undefined` → refus `out`. ✅
- Partie non lancée → `not_running` ; partie terminée → `over`, plateau inchangé. ✅
- Simulation complète : 32 cartes uniques conservées, plateaux toujours pleins (15+15), total = somme des 3 lignes. ✅

## PORTE 4 — IA réellement graduée — ✅ PASSÉE

Commande : `node test/g2g4-headless.js` (même run que la PORTE 2)

| Difficulté | Score IA moyen | Score humain moyen | Victoires IA | Humain / Égalités |
|---|---|---|---|---|
| facile | **254,93** | 44,55 | 289/300 (96,3 %) | 10 / 1 |
| normal | **311,47** | 44,55 | 298/300 (99,3 %) | 2 / 0 |
| difficile | **371,87** | 44,55 | 300/300 (100,0 %) | 0 / 0 |

- **Score moyen strictement croissant** : 254,93 < 311,47 < 371,87 ✅
- **Taux de victoire IA strictement croissant** : 96,3 % < 99,3 % < 100,0 % ✅
- **Scores non constants** : 27 valeurs humaines distinctes par difficulté (min 6, max 320), ≥ 5 exigées ✅
- **Pas d'égalités systématiques** : 1 / 0 / 0 égalités sur 300 (≤ 50 % exigées) ✅

## PORTE 5 — Smoke test UI (drag & drop DOM réel, Chrome headless CDP) — ✅ PASSÉE (20 OK, 0 FAIL)

Commande : `node test/g5-run.mjs` (Chrome headless, CDP 127.0.0.1:9347, `file://` vers `index.html`)

Pour chaque difficulté (20 s, drag & drop DOM réel sur 31 drops/partie jusqu'au score final) :

| Difficulté | Humain | IA | Vainqueur | Écran final | 3 lignes/joueur | Timer final | Affiché = calculé |
|---|---|---|---|---|---|---|---|
| facile | 75 | 325 | ai | ✅ | ✅ 3/3 | 0,0 s | ✅ |
| normal | 30 | 950 | ai | ✅ | ✅ 3/3 | 0,0 s | ✅ |
| difficile | 110 | 535 | ai | ✅ | ✅ 3/3 | 0,0 s | ✅ |

Cas de refus (partie 10 s, dépôts pendant le jeu) :

- Dépôt hors plateau → « Dépôt hors du plateau : annulé. » ✅
- Dépôt sur le plateau IA → « Refusé : le plateau de l'IA est en lecture seule. » ✅
- Partie de refus menée à son final ✅
- **0 erreur JS console** sur les 3 parties + cas de refus ✅

---

## Réjouabilité

Toutes les commandes ci-dessus se relaunchent depuis le dossier `poker-chrono/` sans paramètre ; les sorties sont archivées dans `test/g1-result.txt`, `test/g2g4-result.txt`, `test/g3-result.txt`, `test/g5-result.txt`. Les parties headless sont **déterministes** (seeds 1000–1299, RNG mulberry32 seedé) : une re-exécution reproduit exactement les mêmes scores.

## Bugs corrigés (voir aussi README §5)

1. Barème d'abord non verbatim → bloc extrait byte-exact de `poker-rush/index.html` et inséré (6 constantes + 6 fonctions identifiées, vérification automatique à la PORTE 1).
2. Extracteur `lib.mjs` : offset du préfixe `const NAME = ` de 2 caractères (renvoyait `null` en silence).
3. `test/g2g4-headless.js` : variable `errs` inexistante dans la chaîne de résumé (`ReferenceError`).
4. `eval3ply` (IA difficile) : recherche 3-coups non bornée ≈ 150 ms/coup (timeout 420 s sur 900 parties) → beam 2 borné à 12 candidats (≈ 40 ms/coup, 900 parties en 109 s).
5. IA `normal` 2-coups : métrique « marge d'amélioration restante » piégée par optimum local (moyenne 178,8 < facile bruitée 287,4) → remplacée par glouton 1-coup exact ; gradient strict obtenu.
6. `test/cdp.mjs` : course au démarrage CDP (`/json` vide juste après `/json/version` 200) → retry/backoff 40 × 300 ms.

## Limites

- POC single-page : un seul humain local, pas de multi-joueurs réseau.
- Le drag & drop est exercé via événements DOM synthétiques (CDP) sur Chrome headless, non via des gestes pointeur physiques.
- Le barème est réutilisé verbatim de poker-rush, mais le moteur de jeu chrono/swap est une nouvelle écriture (poker-rush est un autre mode de jeu).

---
---

# v2 — Couche « dopamine » + 10 portes (2026-10-17)

**Auteur** : K0D3R · **Option retenue (NI4NI)** : option A — DOM + logique v1 verbatim + canvas 2D additif + Web Audio API. Zéro dépendance externe, zéro three.js, architecture v1 non réécrite.

**État final : `index.html` v2 = 115 695 octets (≈ 113 Ko, dans la contrainte 100–200 Ko), LF pur, single-file jouable hors-ligne `file://`. Bilan : 10 portes / 10 passées (dont les 5 portes v1 inchangées).**

**Versionne** : Windows 11 · Node v26.7.0 · Chrome 155.0.8059.82 headless (CDP) · Python (venv Hermes) avec fonttools 4.67.0 + brotli (subsetting).

## Architecture v2

`index.html` contient 4 blocs `<script>`, **dans cet ordre d'exécution** : `game-logic` (logique v1 verbatim, 11 sources byte-identiques à poker-rush, vérifié par `test/cmp-src.mjs`) → `audio` (module Web Audio IIFE) → `fx` (module canvas 2D IIFE) → `ui` (UI v2 : wiring audio/FX, seed, render). Cet ordre est **contraint** : le bloc `ui` lit `G.AUDIO` et `G.FX` à l'initialisation — s'il précède les blocs modules, les listeners ne sont jamais attachés (bug réel rencontré, voir §Tentatives).

- **Polices embarquées** `@font-face` base64 woff2 : VT323 subset (U+0020–007E + U+00A0–00FF ; 44 692 B → 59 590 chars b64) et PressStart2P subset (A-Z, 0-9, ` !?.,-` ; 3 748 B → 4 998 chars b64). Total 64 588 chars. Les symboles poker U+2660–2663 ne sont **pas** dans VT323 (cmap vérifié) → fallback `serif` via `font-family` en chaîne ; le rendu dépend du fallback système pour les atouts (rendu uniquement, logique inchangée).
- **Audio** : 100 % Web Audio (oscillateurs + gains), aucun média. Musique de fond (séquence d'accords en boucle) + 9 SFX : `deal`, `swap`, `swapSoft`, `tick`, `tock`, `sirene`, `victoire`, `defaite`, `egalite`. Toggles `#music-toggle` / `#sfx-toggle` (aria-pressed) + sliders `#music-vol` / `#sfx-vol` (indépendants). Démarrage du `AudioContext` au premier geste (autoplay policy). Résilient headless : si `AudioContext` est absent/stub, le module est silencieux, aucune exception.
- **FX** : canvas 2D plein écran `#fx` (pointer-events:none), pool de particules pré-alloué, compositing additif (`lighter`), `devicePixelRatio` clamped ≤ 2. `G.FX.burst(x, y, count, {col})`, `G.FX.fps()`. Particules au deal, lueur sur lignes qui se renforcent, secousse d'écran au final, chrono pulsé.
- **Seed** : aléatoire par partie réelle via `G.lastSeed` (entier 32 bits, non affiché, non paramétrable dans le DOM) ; l'override seed des portes passe par l'API `createGame({seed})`, inchangée. `mulberry32`, tirage visible/anticipable et IA déterministe **conservés** (règle du cahier).
- **Couleurs** : toggle 2 couleurs (rouge #b3352c / noir #1a1f2b) ↔ 4 couleurs (pique noir, cœur rouge, carreau vert, trèfle bleu), persisté `localStorage` (`poker-chrono-colors`). Rendu uniquement ; paquet (32 cartes 7→A × 4 atouts) et barème inchangés.
- **Noms de mains** : `.row-name` en face de chaque ligne, mis à jour au deal et à chaque swap, calculé par l'évaluateur verbatim.

## Commandes exactes (exécutées depuis `poker-chrono/`)

| Porte | Commande | Résultat |
|---|---|---|
| 1 — barème verbatim | `node test/g1-scores.js` | **30 OK, 0 FAIL** ✅ |
| 2 — swap | `node test/g3-swap.js` | **20 OK, 0 FAIL** ✅ |
| 3 — 900 parties headless + gradient | `node test/g2g4-headless.js` | **900 parties, 0 erreur JS, gradient 254,93 < 311,47 < 371,87** ✅ |
| 4 — toggle couleur 2↔4 DOM + persisté | `node test/run-headless.mjs g4-colors.mjs 9351` | **18 OK, 0 FAIL** ✅ |
| 5 — nom de main = main évaluée | `node test/run-headless.mjs g5-rownames.mjs 9352` | **4 OK, 0 FAIL** ✅ (100 % des mains testées) |
| 6 — audio 0 erreur console, init headless | `node test/run-headless.mjs g6-audio.mjs 9353` | **13 OK, 0 FAIL** ✅ |
| 7 — FX 0 erreur, effets, 60 fps | `node test/run-headless.mjs g7-fx.mjs 9354` | **8 OK, 0 FAIL** ✅ (fps mesuré headless = 60) |
| 8 — zéro dépendance externe (scan fichier) | `node test/g8-scan.mjs` | **14 OK, 0 FAIL** ✅ |
| 9 — 2 parties successives ≠ plateaux | `node test/run-headless.mjs g9-boards.mjs 9355` | **7 OK, 0 FAIL** ✅ |
| 10 — smoke drag & drop | `node test/run-headless.mjs g5-run.mjs 9356` | **20 OK, 0 FAIL** ✅ |

Logs bruts : `test/results/porte-1.log` … `test/results/porte-10.log`. Les 5 scripts v1 (`g1-scores.js`, `g3-swap.js`, `g2g4-headless.js`, `g5-run.mjs`, `g5-ui.mjs`) n'ont été **modifiés en aucune manière** ; leurs étiquettes internes conservent la numérotation v1 (ex. `g3-swap.js` affiche « PORTE 3 » mais couvre la porte 2 de la nouvelle numérotation).

`run-headless.mjs` (nouveau lanceur générique) : démarre Chrome headless avec `--headless --no-first-run --no-default-browser-check --disable-gpu --disable-background-networking --user-data-dir=<tmp> --remote-debugging-port=<PORT> --remote-allow-origins=* --allow-file-access-from-files`, connecte CDP, exécute le test, nettoie le processus. Usage : `node test/run-headless.mjs <test.mjs> [port]`.

## Tentatives substantielles (échecs inclus)

1. **Subsetting fonttools** — `Subsetter.__init__() got multiple values for argument 'options'` puis `populate() got unexpected keyword 'chars'` : API corrigée en `Subsetter(options)` + `populate(text=...)`. Résultat : 2 woff2 valides.
2. **PORTE 1 FAIL (1er build)** — 5 comparaisons CRLF vs LF : `poker-rush/index.html` est en CRLF, le build v2 en LF. Fix : `build.py` normalise `\r\n` → `\n` à l'écriture (`newline="\n"`). Re-run : 30 OK / 0 FAIL.
3. **PORTE 8 FAIL (1er build)** — faux positif : le scan `src=` matchait un identifiant JS. Fix : regex `\bsrc\s*=\s*["'](?!(?:data:|blob:|about:))/i`. Un 1er `patch` avait échoué (chaîne non trouvée après re-l Lecture du fichier) → 2e patch sur le texte réel. Re-run : 14 OK / 0 FAIL.
4. **PORTE 4 — 1er essai sans lanceur** : Chrome ne démarrait pas quand `g4-colors.mjs` était lancé directement (le test attend un CDP déjà prêt). Fix : tout passe par `run-headless.mjs`.
5. **PORTE 6 FAIL — toggles audio inopérants** (investigation complète) :
   - Symptôme : `G.AUDIO.state` lisible (défauts `m:true, s:true, mv:0.7`), mais click sur `#music-toggle` et `input` sur `#music-vol` sans effet ; `G.AUDIO.setMusic()` direct fonctionnait (LS écrit).
   - Isolation (probe headless) : élément présent, bon tag, events dispatchables, `G.AUDIO === G.AUDIO.state` false (attendu), API directe OK → les **listeners n'étaient jamais attachés**.
   - **Cause racine** : ordre des blocs dans le build — `ui` avant `audio`. À l'init du bloc `ui`, `G.AUDIO` était `undefined`, le garde `if (G.AUDIO)` échouait silencieusement ; le bloc `audio` courait ensuite trop tard.
   - **Fix** : réordonnancement dans `build.py` : `game-logic → audio → fx → ui`. Re-build, re-run **toutes** les portes : 13 OK / 0 FAIL (état + LS + aria-pressed aux toggles, volumes séparés 0.33/0.5, 9 SFX sans exception, partie complète, 0 erreur console).
6. **PORTE 9 FAIL — attente de test incorrecte** : le test attendait 32 cartes uniques sur le plateau ; le plateau réel fait **3×5 par joueur = 30 cartes** (+ 2 restes dans `state.deck`, 32 au total). Fix du test (pas du jeu) : `cards.length === 30 && seen.size === 30` + contrôle global board+deck sans doublon. Re-run : 7 OK / 0 FAIL (seeds 32 bits différents, plateaux différents, aucun seed visible dans le DOM, 0 erreur).
7. **Mapping des logs** — un batch a écrit `g2g4-headless` dans `porte-2.log` et `g3-swap` dans `porte-3.log` (inversé vs numérotation v2) ; corrigé en relançant avec la correspondance correcte (logs finaux reflètent le mapping ci-dessus).
8. **MSYS/Node** — `node` invoqué avec un chemin `/c/Users/...` dans une commande composite → `MODULE_NOT_FOUND`/exit 1 : exécuté via `execute_code` ou chemins natifs `C:/...`.
9. `chrome.exe --version` fait **geler** le shell headless (processus résiduel) : version Chrome récupérée du compte-rendu v1 (même installation) = 155.0.8059.82.

## Surfaces d'audit pour L34K (après ce build)

À auditer dans `index.html` v2 (rien n'y a été corrigé — c'est le périmètre de l'audit) :
- **best-score** `localStorage` (`poker-chrono-best-score`) : aucune intégrité ni signature → tricherie locale possible (écriture directe du score).
- **mulberry32 seedé** (`state.rngHuman`/`state.rngAI`) : tirage entièrement visible/anticipable — **règle du cahier**, à confirmer comme acceptable par l'audit.
- **Seed aléatoire par partie réelle** : `G.lastSeed` (Math.random) — non dérivable du code, non exposé au DOM ; override `createGame({seed})` réservé aux portes.
- **IA déterministe** : stratégies facile/normal/difficile purement déterministes (pas de hasard IA hors du tirage partagé).
- **localStorage audio/couleurs** : 6 clés `poker-chrono-*` — aucune donnée sensible.
- **Zéro surface réseau** : pas de `fetch`/`XHR`/`WebSocket` (vérifié porte 8) ; surface d'attaque = le fichier lui-même (single-file `file://`).

## Limites v2

- Le test headless du FX mesure les fps via `requestAnimationFrame` (60 fps constatés sur cet host) ; le rendu réel dépend du matériel.
- Les symboles de couleur des atouts reposent sur le fallback système (absents du subset VT323) — le corps des cartes (7-10, V, D, A, chiffres) est 100 % dans le subset.
- Audio headless : le contexte audio réel est créé par Chrome headless (vérifié porte 6) mais la sortie sonore n'est pas audible en test — la conformité « 0 erreur console + API complète » est ce qui est vérifié.
- POC single-player local : aucun multi-joueurs, aucun serveur.

## v2.0.0 — Corrections de l'audit L34K (tâche poker-chrono-v2-audit-fix, 2026-10-17)

**Contexte.** L'audit L34K (black-box, 5 PoC exécutés) a prouvé 5 vecteurs de triche sur le v2 livré (115 695 o, sha256 `55364dc0…`). Objectif : les rendre non reproductibles via l'API publique, **sans toucher au barème verbatim/évaluateur** et **sans masquer les cartes IA** (tirage visible = règle du cahier).

### Corrections appliquées (index.html : 115 695 o → 119 687 o, v2.0.0)

1. **H1 (HIGH) — seed 32 bits recouvrable par brute-force 2^32 depuis le deck visible** (mulberry32 état 32 bits ; PoC : seed 1103544327 → deck 32/32).
   - Partie réelle : seed **128 bits CSPRNG** (`crypto.getRandomValues(new Uint32Array(4))`) + PRNG **128 bits xoshiro128\*\*** ; streams dérivés shuffle/human/AI conservés (mêmes points d'appel).
   - `G.lastSeed` **retiré du namespace public**.
   - L'override entier `createGame({seed})` (portes, seeds 1000–1299) **conserve le chemin mulberry32 inchangé** → les valeurs des portes existantes restent valides.
   - Corps `mulberry32` conservé tel quel (`a = (a + 0x6D2B79F5) | 0; … (t >>> 14) …`, L318–348).
2. **H2 (HIGH) + M1 (MOYENNE) — `G.state` public/mutable** (score fabriqué en 2 lignes ; `G.state.timeLeft` + `G.tick(state, dt<0)` → temps infini).
   - État de partie dans la **closure de l'UI** ; aucun `G.state`/`G.lastSeed` public mutable.
   - `G` public = fonctions logiques pures + contrôles ; snapshots `G.UI.*` en **lecture seule** (deep clone).
   - `G.tick(state, ms)` : garde `if (!Number.isFinite(ms) || ms < 0) return;` ; la UI tick via `performance.now()`.
3. **M2 (MOYENNE) — best-score localStorage non validé** (`'abc'` → NaN → plus jamais de record ; `'999999'` → record gelé).
   - Lecture : `Number.isFinite(parsedBest) && parsedBest >= 0 ? parsedBest : 0` (L1404–1405).
4. **L1 (FAIBLE) — `innerHTML` sur les lignes de décomposition (PoC XSS).**
   - Rendu 100 % `createElement`/`textContent` ; **zéro occurrence `innerHTML`** dans le fichier.
5. **Version** → `'2.0.0'` (L632).

Contraintes vérifiées après build : **119 687 o < 200 Ko**, **LF pur (0 CR)**, zéro dépendance externe, zéro surface réseau, `file://` standalone.

### Nouvelles portes G11–G14 + rejouage des 5 PoC

| Porte | Fichier | Vérifie | Résultat |
|---|---|---|---|
| G11 | `test/g11-noscore.mjs` | Fabrication de score via API publique impossible ; `tick` non-fini/négatif refusé ; snapshot UI immuable ; score IA final = barème du plateau final | 8 OK, 0 FAIL |
| G12 | `test/g12-seed.mjs` | Entropie : 2 parties réelles ≠ decks ; même override 32 bits → deck identique ; seed non entier/négatif → chemin réel | 7 OK, 0 FAIL |
| G13 | `test/g13-best.mjs` | best `'abc'`/`'-5'` → 0 avec records possibles ; `'999999'` → record réel écrit en fin de partie | 7 OK, 0 FAIL |
| G14 | `test/g14-innertest.mjs` | Scan statique : zéro `innerHTML`, zéro dépendance externe, LF | 4 OK, 0 FAIL |
| — | `test/poc-repro.mjs` | Rejoue les **5 PoC L34K** via l'API publique : tous échouent (H1 : 100 001 seeds mulberry32 testés, 0 deck identique au deck réel ; H2 : `G.state` absent → TypeError ; M1 : `timeLeft` inchangé ; M2 : `'abc'` → 0 puis record écrit ; L1 : 0 `innerHTML`) | FAILURES: 0 — **POCS NON REPRODUCTIBLES** |

Les 10 portes existantes repassent après les corrections (dont 5 v1 inchangées) : G1 30 OK · G2 900 parties 0 erreur · G3 20 OK · G4 18 OK · G5 4 OK · G6 13 OK · G7 8 OK · G8 14 OK · G9 60 plateaux · G10 20 OK — **14/14 vertes**, logs `test/results/porte-1.log` … `porte-14.log` + `test/results/poc-repro.log`.

### Tentatives (échecs inclus)

1. **Patch P1 (H1) — 1er échec** : le marqueur anticipait un corps `mulberry32` avec `a >>> 7` ; le corps réel est `a = (a + 0x6D2B79F5) | 0`. Résolu par extraction de fonction entre marqueurs uniques (début `function mulberry32`, fin `4294967296;`).
2. **Écriture du commentaire P9 bloquée** : le commentaire de patch contenait le token `innerHTML` (interdit dans le commentaire de la correction XSS) → reformulation sans le token.
3. **g5-ui.mjs non modifié au 1er passage** : bloc cible `scores` vs `res` → inspection du texte réel puis re-patch exact.
4. **Token `G.state` dans un commentaire g9** (référence à l'ancien état public) → reformulé.
5. **Erreur d'expression sed** (`unknown command: ','`) lors d'une lecture de plage → remplacée par un marqueur textuel (`globalThis.G = `).
6. **G11–G13 initiales écrites contre une API hypothétique** → réécrites sur l'API réelle (`G.start(state)`, 32 cartes, `state.deck` = 2 restes, `G.UI.*`).
7. **G2 exit 1** : mauvais chemin de runner (`test/g2g4-headless.js` au lieu de `g2g4-headless.js` — le chemin est relatif à `test/`) → relance avec le bon chemin, verte.
8. **G9 exit 1** : import direct de `cdp.mjs` sans runner (il n'exporte que `connect`/`evalJs`) + comparaison de plateaux incorrecte (30 cartes/plateau + 2 restes) → réécriture complète avec le pattern `run-headless.mjs` : 60 plateaux, somme des lignes = boardScore = barème.
9. **G11 ❌ au 1er run corrigé** : `after` (timeLeft post-tick) lu *après* le tick positif de contrôle, donc déjà décrémenté → réordonnancement : capture `after` avant le tick `100` ms.
10. **G12 ❌ au 1er run corrigé** : la référence in-page utilisait la variante composée `let t = (a += 0x6D2B79F5); … t ^ (t >>> 7)`, différente du corps réel du fichier (`a = (a + 0x6D2B79F5) | 0; … (t >>> 14)`) → copie du corps exact (L318–348) dans la référence.
11. **poc-repro.mjs `REAL is not defined`** : guillemets simples imbriqués dans le template Node (le `<<REAL>>` entre guillemets fermait le literal externe) → deck cible injecté via `window.__targetDeck` dans un `evalJs` séparé.
12. **Git non initialisé** (exit 128 aux vérifications initiales) → `git init -b main`, `core.autocrlf=false`, commit unique du livrable v2.0.0.

### État final

- `index.html` v2.0.0 : **119 687 o**, LF pur, zéro `innerHTML`, zéro dépendance, version `2.0.0` (L632).
- Git : branch `main`, commit **`42f8061d8a5976ce75c0cbc4e7cb717a096b325c`** (répo initialisé pour l'occasion ; tout le contenu projet est dans ce commit).
- **14/14 portes vertes** (10 existantes + G11–G14) ; **5 PoC L34K non reproductibles** via l'API publique.
- 4RCH1V **non contacté** (consigne utilisateur explicite : « je gère les handoffs ») — handoff porté par NI4NI.

### Limites / non vérifié

- Preuve complète de l'irreproductibilité 2^128 : théorique (xoshiro128** sur état 128 bits CSPRNG) ; preuve empirique : 100 001 seeds mulberry32 testés contre le deck réel → 0 correspondance, et le deck d'une partie réelle n'est plus produit par le chemin mulberry32 (flux xoshiro128** distinct).
- La porte G12 compare les decks complets (30 cartes visibles + 2 restes) reconstruits in-page avec le même algorithme de deck que le fichier.
- Audio headless : sortie non audible (déjà documenté v2) ; le périmètre de cette phase est logique/sécurité.

---

## v2.1.0 — 2026-10-19 (deck 52 cartes, deal miroir, GO, W3C, pins, rapport)

**Tâche** : poker-chrono-20261018-PLAN-B-v2 (brief NI4NI). Cible `poker-chrono/`. Phase 1 (split) déjà commitée 2026-10-18 (`a4b0915` + `d627359`, 14/14 vertes avant et après).

### Commits
| Commit | Contenu |
|---|---|
| `a4b0915` + `d627359` | Phase 1 : split shell/css/js, 14/14 avant+après, stats 900 identiques |
| `7cb64b5` | A : deck 52 miroir 2.1.0 (deck.js, game.js, g1, g3, g12) |
| `7e22098` | B : GO cap 16 + fix PORTE 4 + item 3 max plateau 1500 + W3C shell |
| `6455080` | C : bench 900 + W3C/réactivité audio + pins 2.1.0 + g6-audio v2.1 + socle v2.1 |
| (commit D) | D : README § v2.1.0 + ce rapport + ANCRE-PARTS + manifeste sha256 |

### Items
1. **Deck 52** ✅ — 13 rangs (2→A) × 4 couleurs, mélange seedé CSPRNG (xoshiro128**), 15 tirées, **deal miroir** (main_joueur == main_IA), 37 jetées. P1 : 41 OK / 0 FAIL.
2. **Extracteur** ✅ — rangs 2-6, wheel A-2-3-4-5, hautes avec basses, kickers couverts par P1 (41 checks) + P12 (seed) ; aucun bug trouvé (aucun correctif extracteur).
3. **Max plateau** ✅ — re-déduit, aucune constante 1500/1501 préexistante (0 occurrence) : **1500**. Simulation `test/max-board.mjs` 7/7 (max plateau 1500, main miroir max 500).
4. **Bench 900** ✅ — `node test/g2g4-headless.js` → exit 0 : **min=6, P1=52, médiane=22, max=215** (300 parties × 3 difficultés, déterministe, identique sur 2 exécutions). Gradient strict 136.09 < 167.89 < 209.57. Preuve : `test/results/bench-900-final.log`.
5. **GO** ✅ — +1 pt/seconde restante, fenêtre 5 s, 2e clic idempotent, l'IA ne fait jamais GO. **Cap anti-abus : min+85 = 137 > P1−30 → on ne garde pas 85 ; cap = floor(P1−min−30) = floor(52−6−30) = 16** (`GO_BONUS_CAP = 16`, game.js). go-logic 18/18, go-ui + go-ui-85 exit 0.
6. **W3C** ✅ — `id="fx"` retiré des `<script>` ; titre de repli `#final-title` non vide ; fix réactivité (brief v2.1) : `js/audio.js` — 1er clic par canal = **armement** (force ON + `ensure()` du AudioContext dans le même tick), clics suivants = basculement (`_musicArmed`/`_sfxArmed`). `test/reactivity.mjs` : 10/10.
7. **Version 2.1.0** ✅ — 12/12 portes pinnées 2.1.0 + `js/game.js` + shell.
8. **Docs** ✅ — README : « 52 cartes (Texas Hold'em), 15 tirées au hasard par partie, deal miroir, 37 non utilisées », GO cap 16, 90 s ; COMPT-RENDU appends (jamais réécrit).

### PORTE 4 — cause racine et correctif
- Symptôme : échec au k=173 (score IA 45), difficile 299/300, plateau bloqué.
- Cause : cycle de swap de 2 plies — l'IA basculait entre les cartes tenues (0,6) et (6,0) ; la 2e ply évaluait le board avec `d` négatif (exclusion incomplète des cartes tenues).
- Tentatives : fix v1 insuffisant (reverté) · fix v2 (`AI_INTERVAL`) → **régression 32 % → REVERT** · **fix final** : v3 `d = max(0, d)` + v4 `eval3ply(board, exI, exJ)` (exclusions croisées des deux cartes tenues). k=173 : 45→127, bench exit 0.

### Commandes exactes (exécution 2026-10-19, Node v26.7.0, foreground)
```
node test/g1-scores.js                            # [PORTE 1] 41 OK, 0 FAIL
node test/g3-swap.js                              # [PORTE 3] 24 OK, 0 FAIL
node test/g2g4-headless.js                        # bench 900 → exit 0
node test/go-logic.mjs                            # 18/18 OK
node test/max-board.mjs                           # 7/7 OK
node test/w3c.mjs                                 # 2/2 OK
node test/g8-scan.mjs ; node test/g14-innertest.mjs
node test/run-headless.mjs go-ui.mjs 9401 </dev/null       # exit 0
node test/run-headless.mjs go-ui-85.mjs 9402 </dev/null    # exit 0
node test/run-headless.mjs reactivity.mjs 9348 </dev/null  # 10 OK, 0 FAIL
node test/run-headless.mjs g4-colors.mjs 9411 </dev/null   # 18 OK
node test/run-headless.mjs g5-rownames.mjs 9411 </dev/null # 4 OK
node test/run-headless.mjs g5-ui.mjs 9412 </dev/null       # 20 OK
node test/run-headless.mjs g6-audio.mjs 9414 </dev/null    # 15 OK
node test/run-headless.mjs g7-fx.mjs 9415 </dev/null       # 8 OK
node test/run-headless.mjs g9-boards.mjs 9416 </dev/null   # 0 FAIL
node test/run-headless.mjs g11-noscore.mjs 9417 </dev/null # 0 FAIL
node test/run-headless.mjs g12-seed.mjs 9418 </dev/null    # 0 FAIL
node test/run-headless.mjs g13-best.mjs 9419 </dev/null    # 0 FAIL
node test/run-headless.mjs poc-repro.mjs 9420 </dev/null   # 0 FAIL
```

### Échecs, tentatives, pièges d'environnement (tous rapportés)
- Bench background ×2 : runner du host = « stdin is not a tty » (node ne démarre pas ; la ligne d'erreur a contaminé `bench-900-final.log` puis `porte-2.log`). **Solution** : re-run foreground ≤ 600 s → exit 0. `porte-2.log` restauré par `git checkout` (preuve phase 1).
- Batch headless 10 portes en background : tout mort sans output (même artefact) → re-run foreground chunké par 3.
- Fix v2 PORTE 4 (AI_INTERVAL) : régression 32 % → reverté, aucune trace dans l'arbre final.
- go-ui.mjs : `g2.total` → `g2.totalHuman` ; `process.exitCode` → `process.exit(fail ? 1 : 0)` (socket CDP ouvert → watchdog 240 s).
- go-ui-85.mjs L47 : apostrophe dans un template literal.
- reactivity.mjs : `state._ctx` → `state.ctx` ; logique de sortie (`fail` undefined avant le correctif).
- g6-audio : 3 checks encodant la sémantique v2.0.0 (1er clic = OFF) → **réalignés sur v2.1** (1er clic = armement ON) : 13→15 checks, 15/15. Mise à jour de gate liée au fix réactivité (item 6), critères de split inchangés.
- `test/probe-audio.mjs` supprimée (probe one-shot sans assertions) — même traitement que `diag-pos.mjs`, `trace-173.mjs`, `trace-173b.mjs`.
- Node 26 : `__dirname` indisponible en .mjs → `import.meta.dirname` (w3c.mjs, diag-p4.mjs).

### État final
- Version **2.1.0** (shell + game.js + 12 portes).
- Gates : 7 NODE + 10 HEADLESS + réactivité + GO UI ×2 → **tous exit 0** (2026-10-19).
- sha256 baseline v2.0.0 mono : `3b3644e6…0e1a8` (119 687 o) ; état final v2.1 : manifeste `sha256-final-v21.txt` (46 fichiers hors `.git` et `test/results`).
- Périmètre respecté : `poker-chrono/` uniquement ; P2/multijoueur non touché.

### Erratum (2026-10-19, après archivage 4RCH1V)
- Section v2.1.0 § GO, ligne « Cap anti-abus » : « min+85 = 137 » → **min+85 = 91** (137 = P1+85, coquille arithmétique). Conclusion inchangée : 91 > P1−30 = 22 → cap = floor(P1−min−30) = **16** (`GO_BONUS_CAP = 16`), conforme au bench log `test/results/bench-900-final.log` et au README (L167, déjà correct).
- Manifeste `sha256-final-v21.txt` régénéré : **46/46 OK** (avant : 44/46 — `ANCRE-PARTS.md` et `COMPT-RENDU.md` étaient stale, le manifeste ayant été généré avant les append finaux).

### Erratum n°2 (2026-10-19) — wheel A-2-3-4-5 : incohérence documentation (REWORK-1)

- **Constat** (NI4NI, vérification indépendante du livrable main @ 729b8a2) : `js/deck.js` L46-47 et `test/g1-scores.js` L23 comptent le wheel **A-2-3-4-5** comme QUINTE (75) / quinte_flush (500) — code, tests et bench déjà cohérents avec le wheel — tandis que le README.md L39 affirmait « l'as est uniquement haute — pas de quinte enroulée (A-2-3-4-5 et A-7-8-9-10 ne sont pas des quintes) ». Le livrable se contredisait lui-même (contradiction visible par le joueur).
- **Décision NI4NI (appliquée telle quelle)** : on **garde le wheel** — Texas Hold'em standard (décision opérateur « Texas Hold'em complet ») ; la décision prime sur la ligne « pas de quinte enroulée » du barème v2.0. Le **barème de scores reste verbatim** (inchangé).
- **Corrections doc-only** :
  - README.md L6 : « verbatim » qualifié — scores du barème verbatim, règle d'as mise à jour pour le deck 52 (THe standard).
  - README.md L39 : règle d'as alignée sur le code v2.1 — l'as est haute, et basse uniquement dans le wheel : A-2-3-4-5 est une quinte (5 haute, wheel standard THe) ; pas d'enroulement élevé (10-J-Q-K-A n'est pas une quinte) ; coquille « A-7-8-9-10 » corrigée.
  - js/deck.js L43 : commentaire obsolète « entre 7 et A (pas d'enroulement) » aligné sur le code v2.1 (2→A, wheel basse autorisée, enroulement élevé exclu).
- **Aucun changement code/tests/bench/cap** : stats min=6, P1=52, cap GO 16 inchangées.
- **Re-run des portes (2026-10-19, doc-only, comportement inchangé)** : g1-scores 41 OK · g3-swap 24 OK · w3c 2 OK · go-logic 18 OK · g8-scan 23 OK · g14-innertest 0 FAIL · max-board 7 OK · bench 900 exit 0 (min=6, max=215, déterministe) — **0 FAIL au total**.
- Manifeste `sha256-final-v21.txt` régénéré (mêmes 46 chemins, même format « N|hash *./path ») → vérifié **46/46 OK** par re-lecture.

### Erratum n°3 (2026-10-19) — delta-audit L34K : corrections doc F1+F2 (REWORK-2)

- **Constat** (audit L34K `AUDIT-L34K-v2.1.md`, verdict YELLOW, 2 findings Low, doc-only) :
  - **F1 — règle d'as** : README.md L40 et js/deck.js L45 disaient « 10-J-Q-K-A n'est pas une quinte », alors que le code (js/deck.js : `ranks[ranks.length−1] − ranks[0] === 4`) et la porte g1 traitent le broadway 10-J-Q-K-A comme quinte (75). THe standard : 10-J-Q-K-A **est** une quinte ; l'unique enroulement exclu est K-A-2-3-4.
  - **F2 — compte max-board obsolète** : README.md L181 « 8 OK », COMPT-RENDU.md L264 « 8/8 », COMPT-RENDU.md L282 « 8/8 OK » ; état réel `node test/max-board.mjs` → **7 OK, 0 FAIL**.
- **Décision NI4NI** : le code est correct (re-vérifié par NI4NI par ses propres re-runs : g1 41 OK dont la ligne « 10-J-Q-K-A → quinte (75) », max-board 7 OK, 0 FAIL) ; les docs sont alignées sur le code (THe standard). Le gate max-board n'est pas touché.
- **Correctifs doc-only** : README.md L40 + commentaire js/deck.js L45 (F1) ; README.md L181 + COMPT-RENDU.md L264/L282 (F2 → 7 OK).
- **Aucune stat/cap modifiée** : code de jeu, tests, bench, cap GO (min=6, P1=52, cap 16) inchangés — hash de `test/g2g4-result.txt` inchangé avant/après (`33e6d93f…`).
- **Re-run (2026-10-19)** : `node test/g1-scores.js` → 41 OK, 0 FAIL · `node test/max-board.mjs` → 7 OK, 0 FAIL.
- Manifeste `sha256-final-v21.txt` régénéré (mêmes 46 chemins, même ordre/format « N|hash *./path ») → recalcul **46/46 OK** par re-lecture.

## v2.1.1 — GO sur le plateau, 30 s par défaut, i18n 5 langues (2026-10-19)

**Base** : `6223b05` (HEAD, tree propre). **Commit** : commit atomique unique au-dessus de `6223b05` (subject conventionnel `feat: GO placement, 30 s par défaut, i18n 5 langues + portes + manifeste`). **Trace** : D-20261016-02 (review_trigger « défaut 20→30 s »). **Hors périmètre** : P2 multijoueur (v2.2 PeerJS).

### Décisions (et alternatives écartées)

1. **Déplacement UI du bouton GO, sémantique inchangée** : `<button id="go" disabled>` retiré de `<header>` > `.controls` (à côté de `#start`) et replacé dans `<section class="board" id="board-human">`, à l'intérieur de la ligne de score `.total`, à droite de `#score-human`. Alternatives écartées : (a) sous la grille de cartes — moins visible ; (b) bouton flottant — non conforme à la contrainte « aligné sur la ligne de score, CSS minimal ». `id`, bindings, état `disabled`, invariants (cap 16, fenêtre 5 s, idempotent, l'IA ne fait jamais GO) strictement inchangés → `go-logic` + `go-ui` + `go-ui-85` re-run, toutes vertes.
2. **Défaut 30 s** — 3 points modifiés : `index.html` (`<option value="20" selected>` → `<option value="30" selected>`, options 10/20/30/60/90 conservées), fallback `js/game.js` (20→30), init `js/ui.js` (`time: 20` → `time: 30`). **Trace D-20261016-02** (review_trigger). Protocole bench **inchangé** : `test/g2g4-headless.js` garde `time: 20` explicite → le défaut ne s'y applique jamais, hash de sortie inchangé (vérifié ci-dessous). Grep repo-wide : aucune autre dépendance implicite au défaut 20 s (tous les `createGame` des tests passent `time` explicite).
3. **i18n 5 langues (EN défaut, FR, ES, IT, DE)** : nouveau module `js/i18n.js` (IIFE, zéro DOM, s'attache à `globalThis.G.I18N`) plutôt qu'une table inline dans `ui.js` — garde `ui.js` lisible, isolable, testable headless ; 60 clés × 5 dictionnaires. API : `G.I18N.t(clé, ...vars)` (placeholders `{...}`), `G.I18N.handName(étiquette)` (étiquettes canoniques FR de `deck.js` — Quinte, Couleur, Full, Carré, Brelan, Paire, Ligne, Incomplet, Quatre, Carte haute — → noms localisés), `G.I18N.apply()` (title, meta, éléments `data-i18n`). Menu `<select id="lang">` dans le header : drapeaux emoji + noms (🇬🇧 English, 🇫🇷 Français, 🇪🇸 Español, 🇮🇹 Italiano, 🇩🇪 Deutsch) ; EN par défaut ; persistance `localStorage` (`poker-chrono-lang`) ; `<html lang>` dynamique. Traduites : toutes les chaînes user-facing (~45 : statuts, messages GO/swap, titres de fin, lignes de décomposition, 9 mains du barème, difficultés, Jouer, GO !, Total, pts, best score…) + rangs de cartes par langue (FR V/D/R ; EN/ES/IT/DE J/Q/K ; A = as partout). Labels de rangs gérés dans `ui.js`/`deck.js` via `G.I18N` sans toucher au barème (labels canoniques FR conservés dans `deck.js`).
4. **Nouvelle porte P15** (`test/g15-i18n.mjs`, headless CDP, port 9359) — déterministe : 5 dictionnaires complets (0 clé vide, clés identiques entre langues), 0 chaîne FR hors dictionnaires sur la page EN, EN par défaut, `<html lang>` dynamique, persistance localStorage.
5. **Adaptation des portes existantes** : 12 pins de version `2.1.0` → `2.1.1` ; `g8-scan` compte modules 5→6 (`readdirSync` → auto-inclusion de `js/i18n.js`) ; `g5-rownames` via `G.I18N.handName()` ; élargissements regex `g5-ui` (annul/cancel, lecture seule/Refus/read-only) et `g13-best` (nouveau meilleur/new best, meilleur score/best score) ; `g1-scores` (Node, sans DOM) inchangé — le fallback FR de `deck.js` est préservé ; `w3c`, `reactivity`, `go-ui`, `go-ui-85` inchangées (textuellement neutres, vérifié).
6. **Manifeste** : `sha256-final-v21.txt` régénéré — **48 entrées** (46 + `js/i18n.js` + `test/g15-i18n.mjs`), même ordre/format.
7. **Plateau joueur aligné à droite (D)** : `#board-human { display:flex; flex-direction:column; align-items:flex-end; }` (`css/base.css`) — h2, `.rows`, `.total` (bouton GO restant à droite de la ligne de score) collent au bord droit intérieur du cadre ; à 1920×1080 le plateau joueur est immédiatement à gauche du plateau IA (`main` = grid 1fr 1fr, écart = gap du grid). **Alternatives écartées** : (a) `margin-left:auto` sur chaque enfant — 3 règles couplées, fragile à tout futur flex-row ; (b) `justify-content:flex-end` sur `.total` seul — ne déplace ni la grille de cartes ni le titre ; (c) largeurs fixes / grilles explicites — casse le responsive mobile <900px. Choix : 1 règle de conteneur, aucun paramètre magique, zéro changement de logique de jeu, `#board-ai` intact, mobile inchangé.

### Portes — compte OK/FAIL avant / après (2026-10-19, host Windows, Node 20, foreground)

| Porte | Avant (`6223b05`) | Après (patché) |
|---|---|---|
| `g1-scores.js` | 41 OK / 0 FAIL | 41 OK / 0 FAIL |
| `g3-swap.js` | 24 OK / 0 FAIL | 24 OK / 0 FAIL |
| `g2g4-headless.js` (bench 900) | 6 OK / 0 FAIL, hash `312841cd…` | 6 OK / 0 FAIL, hash inchangé (×2 runs) |
| `max-board.mjs` | 7 OK / 0 FAIL | 7 OK / 0 FAIL |
| `go-logic.mjs` | 18 OK / 0 FAIL | 18 OK / 0 FAIL |
| `w3c.mjs` | 2 OK / 0 FAIL | 2 OK / 0 FAIL |
| `g8-scan.mjs` | 23 OK / 0 FAIL (5 modules) | 24 OK / 0 FAIL (6 modules) |
| `g14-innertest.mjs` | OK / 0 FAIL | OK / 0 FAIL |
| `g4-colors.mjs` (9344) | 18 OK / 0 FAIL | 18 OK / 0 FAIL |
| `g5-rownames.mjs` (9351) | 4 OK / 0 FAIL | 4 OK / 0 FAIL |
| `g5-run.mjs` (P10, `PORT=9347`) | 20 OK / 0 FAIL | 20 OK / 0 FAIL |
| `g6-audio.mjs` (9348) | 15 OK / 0 FAIL | 15 OK / 0 FAIL |
| `g7-fx.mjs` (9345) | 8 OK / 0 FAIL | 8 OK / 0 FAIL |
| `g9-boards.mjs` (9347) | 31 OK / 0 FAIL (30 seeds + 1 global) | 39 OK / 0 FAIL (30 seeds + 1 global + 8 checks D) |
| **Check D** (g9, 1920×1080, D1-D8) | 7 OK / 1 FAIL (D1 : grille à 435 px du bord droit intérieur) | **8 OK / 0 FAIL** (D1 : d=0 px ; D2-D8 OK) |
| `g11-noscore.mjs` (9353) | OK / 0 FAIL | OK / 0 FAIL |
| `g12-seed.mjs` (9355) | OK / 0 FAIL | OK / 0 FAIL |
| `g13-best.mjs` (9352) | OK / 0 FAIL | OK / 0 FAIL |
| `g15-i18n.mjs` (9359, **nouvelle**) | — | **20 OK / 0 FAIL** |
| `go-ui.mjs` (9346) | 11 OK / 0 FAIL | 11 OK / 0 FAIL |
| `go-ui-85.mjs` (9350) | 6 OK / 0 FAIL | 6 OK / 0 FAIL |
| `reactivity.mjs` (9343) | 10 OK / 0 FAIL | 10 OK / 0 FAIL |
| `poc-repro.mjs` (9357) | Non reproductible (5 vecteurs) | Non reproductible (5 vecteurs) |

**Totaux : 21 portes existantes vertes avant ET après + P15 verte après = 22/22 vertes ; check D (extension g9) : 7/8 avant fix → 8/8 après fix.**

### Bench 900 (foreground — do_not_repeat AT-20261019-06 respecté : aucun background)

- Commande : `node test/g2g4-headless.js` (exit 0, ~112 s, 0 erreur JS), exécutée **2 fois** après le patch (la 1re fois du run 2 a échoué sur le piège tty du host, réessai immédiat OK — voir « Tentatives »).
- **Hash de sortie INCHANGÉ** : `test/g2g4-result.txt` byte-identique avant/après — sha256 brut `33e6d93f…` (identique au HEAD git) ; hash normalisé de référence `312841cd81911460d998d4b4d6a026cfab11b4c7efca4559a8443bc828bc357a` (stdout sans ligne `total : 900 parties en…`, champ `wall` refermé à 111,5 — valeur baseline) ; variante sans champ wall `dec3dbdd…` identique sur 3/3 exécutions (avant, après run 1, après run 2). Seule variance : wall-time (111,5 s → 111,8 s → 111,6 s), horloge réelle, non déterministe et hors hash de sortie.
- Stats inchangées : min=6, P1=52, médiane=22, max=215 ; gradient IA strict 136.09 < 167.89 < 209.57 et 94,7 % < 99,3 % < 99,7 %.
- Preuves : `test/results/v2.1.1/avant-bench900.sha256`, `apres-bench900.sha256`, `apres-bench900-run2.txt`.
- **Re-run phase D (2026-10-19, Node 26.7.0, foreground, unique)** : `node test/g2g4-headless.js` → exit 0, 6 OK / 0 FAIL, wall 113,1 s. **Hash de sortie INCHANGÉ** : stdout normalisé (ligne `total` retirée, wall refermé à 111,5) = `312841cd81911460d998d4b4d6a026cfab11b4c7efca4559a8443bc828bc357a` sur ce run (preuve `test/results/v2.1.1-D/rerun/bench900-normalized.sha256`) ; `test/g2g4-result.txt` reste byte-identique à HEAD (sha256 brut `33e6d93f…`) — le fix CSS n'a aucun effet sur la logique de jeu.

### Fichiers modifiés / créés

- `index.html` (bouton GO déplacé, `<select id="lang">`, option 30 s selected, script `js/i18n.js`)
- `js/i18n.js` (**nouveau** — 60 clés × 5 langues, IIFE)
- `js/ui.js` (init 30 s, `G.I18N.t()` sur toutes les chaînes user-facing, rangs via i18n)
- `js/game.js` (fallback 30 s, version `2.1.1`)
- `css/base.css` (alignement du bouton GO sur la ligne de score + **règle D** `#board-human { display:flex; flex-direction:column; align-items:flex-end; }`)
- `test/g15-i18n.mjs` (**nouveau**, porte P15, port 9359)
- `test/g9-boards.mjs` (**check D D1-D8** — 1920×1080 via CDP, `Emulation.setDeviceMetricsOverride`)
- `test/probe-d.mjs` (**nouveau** — outil de diagnostic des rects Chromium, non couvert par le manifeste 48)
- `test/g5-ui.mjs`, `test/g5-rownames.mjs`, `test/g13-best.mjs` (adaptations i18n)
- `test/g8-scan.mjs` (5→6 modules), `test/go-ui.mjs`, `test/go-ui-85.mjs`, `test/g14-innertest.mjs`, `test/poc-repro.mjs` (+ 8 autres) — pins `2.1.1`
- `README.md`, `COMPT-RENDU.md`, `ANCRE-PARTS.md` (alignés dans le même diff)
- `sha256-final-v21.txt` (régénéré — **48 entrées**)
- `test/results/v2.1.1/` (logs avant/après + sha256 bench)

### Tentatives (échecs / inconclusifs, avec cause)

- **Patch initial multi-fichiers échoué** (assert d'ancrage sur `index.html`) — cause : divergence mineure de l'ancrage attendu vs octets réels (tabulations/attributs). Résolu par re-dump octet à octet et `str.replace` Python avec compteur d'occurrences exact avant écriture. Aucune corruption : les fichiers non patchés n'ont jamais été écrits.
- **Typo dans le remplacement `fs_go` de `js/ui.js`** détectée au re-vérification — corrigée dans le patch suivant, porte `go-ui` verte.
- **Ancre `go-ui.mjs` (pin de version)** : 1er essai raté (ancrage différent sur disque), corrigé au 2e.
- **`g5-rownames.mjs`** : 3 tentatives d'ancrage (concaténation de chaînes, pas de template literals) — résolu avec l'ancrage réel du disque.
- **« stdin is not a tty » (host)** : 1er appel terminal d'un batch headless (bench run 2, batch C2, worktree avant-go-logic) — le node du 1er appel ne démarre pas et la ligne d'erreur peut contaminer un `tee`. Contournement : réessai immédiat + redirection directe `> f 2>&1` (sans `tee`) pour l'`avant-go-logic.txt` capturé sur worktree à `6223b05` (18 OK / 0 FAIL, propre).
- **`g5-run.mjs`** : ne lit pas le port argv mais `process.env.PORT` — invoqué `PORT=9347 node test/g5-run.mjs` (vert).
- **Check D initial : 4 FAIL (D1-D4) au 1er run avant** — cause : les bords intérieurs de référence (`innerRH`/`innerLA`) étaient calculés sans les `padding` des sections. Fix : bords intérieurs = bordure + padding des sections (`hr[2] - borderRight - paddingRight`) ; diagnostic complet des rects réels via `test/probe-d.mjs` (cartes humaines x=167/235/303/371/439, cadre `#board-human` bord droit = 936 px). **Run avant final** (références corrigées, CSS non patché) : **1 seul FAIL — D1, grille à 435 px** du bord droit intérieur, D2-D8 OK. Conditions : Chromium headless 1920×1080, `node test/run-headless.mjs g9-boards.mjs 9347` (logs `test/results/v2.1.1-D/avant-g9-boards.txt`).
- **`test/probe-d.mjs` — 5 corrections successives** : (a) parenthèse fermante manquante de l'IIFE ; (b) `import CDP from './cdp.mjs'` → `import { connect, evalJs } from './cdp.mjs'` (pas d'export par défaut) ; (c) `evalJs` exige 2 args (`evalJs(cdp, expr)`) ; (d) **Node 26.7.0** : `import { os } from 'node:os'` supprimé (alias legacy retirés) → `import os from 'node:os'` ; (e) `connect('127.0.0.1:9471', …)` **sans** préfixe `http://` (contrat de `cdp.mjs`) + sortie `JSON.stringify` pour parsage fiable. Essai inconclusif connexe : spawn Chrome manuel + `curl 127.0.0.1:9472` en timeout (exit -1, non bloquant) — la probe fonctionne ensuite via le spawn interne de `cdp.mjs`.
- **D6 réécrit** : la 1re formulation (« plateau IA non modifié ») mesurait une position non encadrée ; réécrit sur les rects réels du plateau IA : `.rowA` gauche = bord gauche intérieur du cadre IA + gap de grille, et carte IA `track0` = 167 px (symétrique du plateau humain) — confirme que le fix n'affecte pas `#board-ai`.
- **Rien d'autre d'omis** : toutes les portes listées ci-dessus ont été exécutées avant et après, logs dans `test/results/v2.1.1/`.

### Manifeste

`sha256-final-v21.txt` régénéré après les ajouts (docs + `js/i18n.js` + `test/g15-i18n.mjs`) : **48 entrées**, format `<n>|<sha256> *<path>`, recalculé par re-lecture (**48/48 OK**). Re-régénéré en phase D : mêmes 48 entrées, 5 hashs changés (`ANCRE-PARTS.md`, `COMPT-RENDU.md`, `css/base.css`, `README.md`, `test/g9-boards.mjs`) ; `test/g2g4-result.txt` inchangé (`33e6d93f…`). `css/base.css` : `2c6979ac3193ace0e94c7c5ccf2d5d71c0700310026efb44b78b7c6ef7c1a99b`.
