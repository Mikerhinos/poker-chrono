# Poker Chrono — POC

Jeu de cartes **humain vs IA** en une page HTML (5 langues — anglais par défaut, français, espagnol, italien, allemand), 3 plateaux de 5 cartes (3×5),
joué en temps limité (chrono) avec une mécanique de **swap** de cartes par drag & drop.

Le barème d'évaluation (scores des mains) est réutilisé **verbatim** (à l'octet près) depuis le projet
`poker-rush` (voir `poker-rush/index.html`, bloc `<script id="game-logic">`). La **règle d'as** est mise
à jour pour le deck 52 (Texas Hold'em standard) : voir §1 « Règle d'as » (wheel A-2-3-4-5 = quinte).

---

## 1. Règles du jeu

- Un jeu de **52 cartes (Texas Hold'em)** : 13 rangs (2→A) × 4 couleurs. **15 cartes sont tirées au hasard par partie** et distribuées en **deal miroir** : main_joueur == main_IA (la même sélection de 15 cartes pour les deux joueurs) ; les **37 cartes restantes ne sont pas utilisées** (jetées).
- Chaque joueur possède **3 lignes de 5 cartes**. Le score d'un joueur = somme des scores de ses 3 lignes (barème ci-dessous).
- Le match dure le temps choisi (10 s, 20 s, 30 s, 60 s ou 90 s). À l'expiration, les scores finaux (bonus GO inclus) sont affichés et le vainqueur annoncé (ou égalité).
- **Mécanique de swap** : pendant la partie, l'humain peut échanger **deux cartes de son propre plateau** (drag & drop d'une carte sur une autre case de son plateau).
  - Échange vers sa propre case → refus `self` (rien ne se passe).
  - Dépôt hors du plateau (ou dépôt invalide / `undefined`) → refus `out` / `invalid` (« annulé »).
  - Dépôt sur le plateau de l'IA → refus (plateau en lecture seule).
  - Partie non lancée ou terminée → refus (`not_running` / `over`).
  - Sinon : les deux cellules sont échangées, le compteur de swaps humains est incrémenté, le plateau est re-rendu.
- **IA** : joue seule, à un intervalle dépendant de la difficulté (voir §3). L'IA ne peut pas être modifiée par l'humain. Elle **ne fait jamais de GO**.
- **GO (v2.1)** : pendant les **5 dernières secondes**, le bouton **GO** est actif. Chaque clic donne **+1 point par seconde restante** ; le 2e clic dans la même seconde est **idempotent** (pas de double bonus). Bonus **plafonné à 16 points** (cap d'anti-abus recalibré sur le bench 900 parties — voir § v2.1.0). L'IA ne fait jamais de GO ; le bonus est ajouté au score final et affiché dans l'écran final.

### Barème (verbatim poker-rush)

| Main | Code | Points |
|---|---|---|
| Quinte flush | `quinte_flush` | 500 |
| Quatre du même | `quatre` | 300 |
| Full | `full` | 150 |
| Couleur | `couleur` | 100 |
| Quinte | `quinte` | 75 |
| Brelan | `brelan` | 40 |
| Double paire | `double_paire` | 25 |
| Paire | `paire` | 10 |
| Carte haute | `carte_haute` | 2 |

**Règle d'as** : l'as est haute, et basse uniquement dans le wheel — **A-2-3-4-5 est une quinte** (5 haute, wheel standard THe) ; **10-J-Q-K-A est une quinte** (broadway) ; **K-A-2-3-4 n'est pas une quinte** (unique enroulement exclu).

## 2. Interface

- Sélecteurs : difficulté (`facile` / `normal` / `difficile`), temps de manche (10/20/30/60/90 s), bouton **Jouer**, bouton **GO** (actif pendant les 5 dernières secondes).
- Chrono affiché en temps réel (rouge ≤ 5 s), scores des deux joueurs en direct, message d'état.
- À la fin : écran final avec les 3 lignes décomposées par joueur, les sous-totaux, le total et l'annonce du vainqueur.

## 3. Architecture (split v2.1 : shell `index.html` + `css/` + `js/`)

Shell HTML + 4 feuilles CSS + 6 modules JS, sans dépendance, sans serveur — ouvrir `index.html` dans un navigateur suffit.

1. **`js/deck.js`** (pur) — barème verbatim poker-rush (`RANKS`, `RANK_LABEL`, `SUIT_LABEL`, `SUIT_NAME`, `HAND_SCORES`, `HAND_LABEL`, `isValidCard`, `evaluate5`, `isFull`, `rowScore`, `boardScore`, `boardBreakdown`) + config (`DIFFICULTIES`, `TIME_OPTIONS`, `AI_INTERVAL`, `PAIRS`) + PRNG seedés (mulberry32, xoshiro128**).
2. **`js/game.js`** (pur, sans DOM) — s'attache à `globalThis.G` :
   - **Logique Poker Chrono** : `createGame`, `start`, `tick`, `humanSwap`, `aiStep`, `humanRandomSwap`, `simulateGame`, `cardText` + mécanique **GO** (activation 5 s, +1 pt/s restante, 2e clic idempotent, `GO_BONUS_CAP = 16`).
   - **Déterminisme** : générateur pseudo-aléatoire seedé — `createGame({ seed })` re-joue exactement la même partie (utilisé par les tests).
   - **Simulation headless** : `simulateGame({ difficulty, time, seed })` déroule la partie tick par tick (100 ms) avec un humain aléatoire — aucun DOM requis, utilisable dans Node.
3. **`js/i18n.js`** (pur, s'attache à `globalThis.G.I18N`) — 5 dictionnaires de 60 clés (EN défaut, FR, ES, IT, DE) : `G.I18N.t(clé, ...vars)`, `G.I18N.handName(étiquette)` (étiquettes canoniques `deck.js` → noms de mains localisés), `G.I18N.apply()` (title, meta, éléments `data-i18n`), persistance `localStorage` (`poker-chrono-lang`), `<html lang>` dynamique.
4. **`js/ui.js`** (avec DOM) — rendu des plateaux, drag & drop natif (`dragstart`/`dragover`/`drop`/`dragend` + `DataTransfer`), chrono, écran final (score final avec bonus GO), bouton GO, toggles.
5. **`js/audio.js`** (WebAudio) — musique de fond + 9 SFX, toggles/volumes persistés ; 1er clic sur un toggle = **armement** du son (fix réactivité v2.1).
6. **`js/fx.js`** (canvas 2D) — particules poolées, lueurs, secousse d'écran.

### Niveaux d'IA

| Difficulté | Intervalle | Algorithme |
|---|---|---|
| `facile` | 1 s | Glouton 1-coup **bruité** : 25 % de swap aléatoire, sinon tirage parmi les 3 meilleurs deltas du delta immédiat. |
| `normal` | 1 s | Glouton 1-coup **exact** (argmax du delta immédiat, sans bruit). |
| `difficile` | 0,5 s | Recherche **beam 3 coups** : beam 10 sur le premier coup, beam 12 sur le second, évaluation exacte du 3e coup (deterministe, beam 12 bornant le coût). |

> Les deux IA ne font que des swaps qui n'abaissent jamais leur score attendu (sinon coup neutre : swap à delta 0 ou pas de swap).

## 4. Comment tester

Tout se lance depuis le dossier du projet (Node ≥ 22, pour le WebSocket global du test CDP).

```bash
# PORTE 1 — régression barème + vérification verbatim contre poker-rush
node test/g1-scores.js

# PORTE 3 — mécanique de swap (valide / self / out / invalid / undefined / états de partie)
node test/g3-swap.js

# PORTE 2 + 4 — 900 parties headless (300/difficulté, seeds 1000..1299, 20 s)
#            + gradient IA strict (score moyen et taux de victoire facile < normal < difficile)
node test/g2g4-headless.js        # ~2 min

# PORTE 5 — smoke test UI : vrai drag & drop DOM sur Chrome headless (CDP)
node test/g5-run.mjs              # ~2 min (démarrage Chrome + 3 parties + cas de refus)
```

Résultats détaillés : voir **`COMPT-RENDU.md`**.

## 5. Bugs corrigés pendant le développement

1. **Barème non verbatim** : la première écriture du POC divergeait de `poker-rush` (sauts de ligne CRLF/LF et libellés d'erreurs français différents). Corrigé par un script Node qui extrait les blocs exacts de `poker-rush/index.html` (lignes du barème : constantes, `isValidCard`, `evaluate5`, `isFull`, `rowScore`, `boardScore`, `boardBreakdown`) et les insère dans `poker-chrono/index.html` ; le doublon `DIFFICULTIES` a été supprimé. Vérifié : les 6 constantes et les 5 fonctions sont **byte-identiques** entre les deux fichiers (PORTE 1).
2. **Extracteur de constantes (test/lib.mjs)** : l'offset du préfixe `const NAME = ` était faussé de 2 caractères (`+7` au lieu de `+9`) → les extractions renvoyaient `null` silencieusement. Corrigé ; l'extracteur gère aussi les littéraux `[...]`.
3. **`errs`/`errors` (test/g2g4-headless.js)** : la chaîne de résumé référençait une variable inexistante (`errs`) → `ReferenceError`. Corrigé en `errors`.
4. **`eval3ply` trop lent** : la recherche 3-coups de l'IA difficile évaluait les 105 paires de swaps à chaque nœud du beam (≈ 150 ms/coup → ~30 min pour 900 parties). Corrigé en bornant le second beam à **12 candidats triés par delta** (≈ 40 ms/coup ; 900 parties en ~110 s) sans changer le comportement dominant (les 10 meilleurs coups du 1er coup restent tous explorés).
5. **IA « normal » piégée par un optimum local** : la version 2-coups (`d1 + d2`) maximisait « la marge d'amélioration restante » plutôt que le score — score moyen (178,8) **inférieur** à l'IA `facile` bruitée (287,4), violation du gradient. Remplacée par un **glouton 1-coup exact** : gradient strict restauré (254,93 < 311,47 < 371,87 sur 900 parties).
6. **Course au démarrage CDP (test/cdp.mjs)** : `fetch('/json')` juste après le `200` de `/json/version` pouvait renvoyer une liste vide → `SyntaxError: Unexpected end of JSON input`. Corrigé : retry/backoff (40 × 300 ms) sur une liste non vide avant l'ouverture du WebSocket.

## 6. Choix et limites

- **Déterminisme** : RNG seedé + boucle de tick synchrone → les parties headless sont reproductibles à l'identique (mêmes seeds, mêmes résultats).
- **Portage barème** : la réutilisation est verbatim (constantes + fonctions d'évaluation), **pas** du moteur de jeu de poker-rush (qui est un autre mode de jeu).
- **Limite POC** : un seul joueur humain local (multi-joueurs réseau hors périmètre) ; le drag & drop est testé via événements DOM synthétiques (CDP), pas via des gestes pointeur physiques.

---

# v2 — Couche « dopamine » (2026-10-17)

`index.html` est passé à **v2** : même moteur verbatim (aucune ligne de `game-logic` modifiée), couche 100 % additive — canvas 2D plein écran + Web Audio API + polices embarquées. **115 695 octets, LF pur, single-file jouable hors-ligne `file://`, zéro dépendance externe** (aucun `http(s)`, `<script src>`, `<link href>`, média).

## Nouveautés v2

- **Polices** `@font-face` base64 woff2 embarquées : VT323 (corps, subset ASCII + Latin-1) et PressStart2P (titres, subset A-Z/0-9/ponctuation). 100 % hors-ligne.
- **Couleurs** : toggle 2 couleurs (rouge/noir) ↔ 4 couleurs (pique noir, cœur rouge, carreau vert, trèfle bleu), choix persisté en `localStorage`. Rendu uniquement — paquet et barème inchangés.
- **Nom de main en direct** : chaque ligne affiche son nom de main (évaluateur verbatim), mis à jour au deal et à chaque swap.
- **Audio** : musique de fond + 9 SFX (deal, swap, tic-tac, sirène finale, victoire/défaite/égalité), 100 % Web Audio (aucun fichier). Toggles ON/OFF séparés musique/SFX + sliders de volume indépendants, persistés. Démarrage au premier geste. Aucune erreur console, testable headless.
- **Effets** : particules 2D poolées (compositing additif) au deal et aux swaps, lueur sur les lignes qui se renforcent, secousse d'écran au final, chrono pulsé. Cible 60 fps.
- **Seed** : aléatoire par partie réelle (non dérivable du code, non exposé à l'UI) ; l'override `createGame({seed})` est conservé pour les portes. Mulberry32, tirage visible/anticipable et IA déterministe conservés.

## Tests v2 — 10 portes

```bash
# Depuis poker-chrono/ (Node ≥ 22 ; Chrome headless pour les portes 4-7, 9, 10)
node test/g1-scores.js                          # P1 barème verbatim        → 30 OK, 0 FAIL
node test/g3-swap.js                            # P2 swap                  → 20 OK, 0 FAIL
node test/g2g4-headless.js                      # P3 900 parties + gradient → 0 erreur, gradient strict
node test/run-headless.mjs g4-colors.mjs 9351   # P4 toggle couleur DOM + LS → 18 OK, 0 FAIL
node test/run-headless.mjs g5-rownames.mjs 9352 # P5 noms de mains          → 4 OK, 0 FAIL
node test/run-headless.mjs g6-audio.mjs 9353    # P6 audio headless         → 13 OK, 0 FAIL
node test/run-headless.mjs g7-fx.mjs 9354       # P7 FX + 60 fps            → 8 OK, 0 FAIL
node test/g8-scan.mjs                           # P8 zéro dépendance        → 14 OK, 0 FAIL
node test/run-headless.mjs g9-boards.mjs 9355   # P9 2 parties ≠ plateaux   → 7 OK, 0 FAIL
node test/run-headless.mjs g5-run.mjs 9356      # P10 drag & drop smoke     → 20 OK, 0 FAIL
```

`run-headless.mjs` démarre Chrome headless lui-même (CDP), exécute le test, nettoie. Les 5 scripts v1 (`g1-scores`, `g3-swap`, `g2g4-headless`, `g5-run`, `g5-ui`) sont **inchangés** et passent tels quels. Logs : `test/results/porte-1.log` … `porte-10.log`. Détails, commandes exactes et tentatives (échecs inclus) : `COMPT-RENDU.md` § v2.

## v2.0.0 — corrections de l'audit L34K + 14 portes

Corrections (sans toucher au barème verbatim/évaluateur, sans masquer les cartes IA) :

- **Seed des parties réelles** : 128 bits CSPRNG (`crypto.getRandomValues`) + PRNG xoshiro128** — non recouvrable par brute-force 2^32 depuis le deck visible. L'override `createGame({seed})` 32 bits (mulberry32) est **inchangé** pour les portes ; `G.lastSeed` retiré de l'API publique.
- **État de partie** : dans la closure de l'UI ; `G` public = fonctions pures + contrôles, snapshots `G.UI.*` lecture seule ; `G.tick` refuse `dt < 0` et les valeurs non-finies.
- **best-score** : lecture validée (`Number.isFinite && >= 0`, sinon 0) — un score réel redevient un record.
- **Rendu** : zéro `innerHTML` (100 % `createElement`/`textContent`).
- **Version** : `2.0.0`.

Nouvelles portes 11–14 :

```bash
node test/run-headless.mjs g11-noscore.mjs 9358  # API publique : fabrication de score impossible, tick gardé → 8 OK
node test/run-headless.mjs g12-seed.mjs 9359     # entropie seed réel (128 bits) + déterminisme override → 7 OK
node test/run-headless.mjs g13-best.mjs 9360     # best-score 'abc'/'-5' → 0, records possibles → 7 OK
node test/g14-innertest.mjs                      # scan statique : zéro innerHTML/dépendance, LF → 4 OK
node test/run-headless.mjs poc-repro.mjs 9361    # rejoue les 5 PoC L34K : tous non reproductibles
```

**14/14 portes vertes** (logs `test/results/porte-1.log` … `porte-14.log` + `poc-repro.log`), single-file **119 687 o** (< 200 Ko), LF, zéro dépendance externe. Détails, commandes exactes et toutes les tentatives (échecs inclus) : `COMPT-RENDU.md` § v2.0.0.

---

## v2.1.0 — deck 52 cartes, deal miroir, GO recalibré (2026-10-19)

- **Deck 52 cartes (Texas Hold'em)** : 13 rangs (2→A) × 4 couleurs ; **15 tirées au hasard par partie** (même mécanisme CSPRNG seedé, reproductible par seed), **deal miroir** (`main_joueur == main_IA`, même sélection de 15), **37 cartes non utilisées** (jetées). Vérifié : 52 cartes uniques, 15 tirées sans duplication, miroir, reproductibilité par seed (PORTE 1 / 3 + `max-board.mjs`).
- **Option 90 s** ajoutée à `TIME_OPTIONS` (10/20/30/60/90 s).
- **GO (nouveau)** : 1 point par seconde restante, activation 5 s, 2e clic idempotent, l'IA ne fait **jamais** de GO. **Cap d'anti-abus recalibré sur le bench 900 parties** : min=6, P1=52 → `min+85 = 91 > P1−30 = 22` → **cap = floor(P1 − min − 30) = 16** (`GO_BONUS_CAP = 16` dans `js/game.js`). Le bonus GO est ajouté au score final et **affiché dans l'écran final** (barème des mains inchangé).
- **Max théorique d'un plateau (52 cartes)** : re-déduit = **1500** (quinte flush As haute = 500, puis meilleures mains restantes sur les 15 cartes miroir) — `test/max-board.mjs` (analyse + simulation) ; aucune constante 1500/1501 n'existait dans le code v2.0.0 (valeur dérivée).
- **PORTE 2/4 (bench 900) corrigée** : l'IA difficile oscillait sur un cycle de 2 plies (swap A→B→A) et restait bloquée à 45 points sur la partie k=173. Causes : delta non borné à 0 dans l'évaluation 3-coups + re-évaluation de la paire en cours. Fix : `max(0, d)` + exclusion des exclusions croisées dans `eval3ply` → score 45→127 sur k=173, gradient strict restauré.
- **W3C** : `id="fx"` retiré du `<script>` (doublon avec le `<canvas id="fx">`) ; `#final-title` non vide (titre de repli) ; **fix réactivité** : le 1er clic sur chaque toggle audio **arme** le son (force ON + AudioContext créé/repris dans le même tick), clics suivants = basculement normal (`js/audio.js` — drapeau `armed` par canal).
- **Architecture** : split commité en phase 1 (shell `index.html` 2 755 o + `css/` × 4 + `js/` × 5 ; zéro changement comportemental, 14/14 portes vertes avant/après). **Version `2.1.0`** pinnée dans `js/game.js` et dans **toutes les portes** (12 pins mis à jour, g12/poc-repro l'étaient déjà).
- **Hors périmètre** : P2/multijoueur.

### Tests v2.1.0

```bash
node test/g1-scores.js                          # P1 barème 52 cartes (13 rangs, miroir) → 41 OK, 0 FAIL
node test/g3-swap.js                            # P2 swap                                → 24 OK, 0 FAIL
node test/g2g4-headless.js                      # P3 bench 900 + gradient IA           → 6 OK, 0 FAIL (exit 0)
node test/max-board.mjs                         # max théorique plateau 52 cartes      → 7 OK, max=1500
node test/go-logic.mjs                          # GO logique : cap 16, 5 s, idempotent, IA jamais GO → 18 OK
node test/run-headless.mjs go-ui.mjs 9349       # GO UI : activation 5 s, bonus affiché → exit 0
node test/run-headless.mjs go-ui-85.mjs 9350    # GO à t=85 s sur 90 s (toujours actif) → exit 0
node test/w3c.mjs                               # W3C statique (ids, #final-title)      → 2 OK
node test/run-headless.mjs reactivity.mjs 9348  # réactivité : 1 clic = 1 état + ctx running → 10 OK
# portes 4-14 v2.0.0 inchangées en critères : g4-colors, g5-rownames, g5-ui, g6-audio, g7-fx,
# g8-scan, g9-boards, g11-noscore, g12-seed, g13-best, g14-innertest, poc-repro → toutes vertes
```

Stats bench 900 (humains) : **min=6, P1=52, médiane=22, max=215** ; gradient IA strict 136.09 < 167.89 < 209.57 et 94.7 % < 99.3 % < 99.7 % (900 parties en ~112 s, 0 erreur JS). Log : `test/results/bench-900-final.log`. Détails, statistiques et toutes les tentatives (échecs inclus) : `COMPT-RENDU.md` § v2.1.0.

## v2.1.1 — GO sur le plateau, 30 s par défaut, i18n 5 langues (2026-10-19)

- **Bouton GO déplacé sur le plateau du joueur** : de `<header>` (`.controls`, à côté de **Jouer**) vers `<section class="board" id="board-human">`, à droite de la ligne de score (`.total` / `#score-human`) — on voit quel bouton lancer la manche. `id`, bindings, état `disabled` et invariants (cap bonus 16, fenêtre 5 s, idempotent, l'IA ne fait jamais GO) inchangés — déplacement UI pur (re-runs `go-logic` + `go-ui` + `go-ui-85`, toutes vertes).
- **Défaut 30 s** (avant 20 s) : `index.html` (`<option value="30" selected>`, options 10/20/30/60/90 conservées), fallback `js/game.js`, init `js/ui.js`. Protocole bench 900 **inchangé** : `time: 20` explicite dans `test/g2g4-headless.js` → hash déterministe inchangé, `test/g2g4-result.txt` byte-identique.
- **i18n 5 langues** — **EN (défaut), FR, ES, IT, DE** : menu de langue dans le header, drapeaux + noms (`<select id="lang">`, 🇬🇧 🇫🇷 🇪🇸 🇮🇹 🇩🇪), persistance `localStorage` (`poker-chrono-lang`), `<html lang>` dynamique. Nouveau module `js/i18n.js` (IIFE, zéro DOM, **60 clés/langue**) : `G.I18N.t(clé, ...vars)`, `G.I18N.handName(étiquette)`, `G.I18N.apply()`. Traduites : toutes les chaînes user-facing (~45 : statuts, messages GO/swap, titres de fin, lignes de décomposition, 9 mains du barème, difficultés, Jouer, GO !, Total, pts, best score…) + labels de rangs de cartes par langue (FR V/D/R ; EN/ES/IT/DE J/Q/K ; A = as pour toutes).
- **Nouvelle porte P15** (`test/g15-i18n.mjs`, headless CDP, port 9359) : 5 dictionnaires complets (0 clé vide), 0 chaîne FR hors dictionnaires sur la page EN, EN par défaut, `<html lang>` dynamique, persistance localStorage → **20 OK, 0 FAIL**.
- **Version `2.1.1`** dans `js/game.js` et toutes les portes (12 pins mis à jour, `g8-scan` compte 5→6 modules, `g15-i18n` créée).
- **Manifeste** `sha256-final-v21.txt` régénéré : **48 entrées** (46 + `js/i18n.js` + `test/g15-i18n.mjs`).
- **Hors périmètre** : P2 multijoueur (réservé v2.2 — PeerJS).

### Tests v2.1.1 (22 contrôles : 21 portes existantes + P15 nouvelle, toutes vertes avant et après)

```bash
node test/g1-scores.js                        # P1 barème 52 cartes            → 41 OK
node test/g3-swap.js                          # P2 swap                        → 24 OK
node test/g2g4-headless.js                    # P3 bench 900 + gradient        → 6 OK (exit 0)
node test/max-board.mjs                       # Max plateau théorique          → 7 OK
node test/go-logic.mjs                        # Logique GO                     → 18 OK
node test/w3c.mjs                             # W3C statique                   → 2 OK
node test/g8-scan.mjs                         # P8 zéro dépendance (6 modules) → 24 OK
node test/g14-innertest.mjs                   # P14 scan rendu dynamique       → OK
node test/run-headless.mjs g4-colors.mjs 9344   # P4 couleurs                   → 18 OK
node test/run-headless.mjs g5-rownames.mjs 9351 # P5 noms de mains (i18n)      → 4 OK
node test/g5-run.mjs                           # P10 drag & drop (g5-ui)        → 20 OK
node test/run-headless.mjs g6-audio.mjs 9348   # P6 audio                       → 15 OK
node test/run-headless.mjs g7-fx.mjs 9345      # P7 FX                          → 8 OK
node test/run-headless.mjs g9-boards.mjs 9347  # P9 plateaux (60 seeds)         → 60 OK
node test/run-headless.mjs g11-noscore.mjs 9353 # P11 API publique             → 11 OK
node test/run-headless.mjs g12-seed.mjs 9355   # P12 seeds                      → 10 OK
node test/run-headless.mjs g13-best.mjs 9352   # P13 best score                 → 6 OK
node test/run-headless.mjs g15-i18n.mjs 9359   # P15 i18n (nouvelle)            → 20 OK
node test/run-headless.mjs go-ui.mjs 9346      # UI GO (bouton sur le plateau)  → 11 OK
node test/run-headless.mjs go-ui-85.mjs 9350   # GO à t = 85 s                  → 6 OK
node test/run-headless.mjs reactivity.mjs 9343 # Réactivité                     → 10 OK
node test/run-headless.mjs poc-repro.mjs 9357  # PoC L34K (5 vecteurs)          → Non reproductible
```

Stats bench 900 inchangées (déterministe, `time: 20` explicite) : **min=6, P1=52, médiane=22, max=215** ; gradient IA strict 136.09 < 167.89 < 209.57 ; `test/g2g4-result.txt` byte-identique avant/après (hash de sortie inchangé). Détails, statistiques et toutes les tentatives (échecs inclus) : `COMPT-RENDU.md` § v2.1.1.
