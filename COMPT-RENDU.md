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
