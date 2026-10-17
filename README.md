# Poker Chrono — POC

Jeu de cartes **humain vs IA** en une page HTML (interface française), 3 plateaux de 5 cartes (3×5),
joué en temps limité (chrono) avec une mécanique de **swap** de cartes par drag & drop.

Le barème d'évaluation et la règle « **pas de quinte enroulée** » sont réutilisés **verbatim**
(à l'octet près) depuis le projet `poker-rush` (voir `poker-rush/index.html`, bloc `<script id="game-logic">`).

---

## 1. Règles du jeu

- Un jeu de 52 cartes ; **32 cartes sont distribuées** : 15 pour l'humain, 15 pour l'IA, **2 cartes de réserve** (le reste du talon est consommé).
- Chaque joueur possède **3 lignes de 5 cartes**. Le score d'un joueur = somme des scores de ses 3 lignes (barème ci-dessous).
- Le match dure le temps choisi (10 s, 20 s, 30 s ou 60 s). À l'expiration, les scores finaux sont affichés et le vainqueur annoncé (ou égalité).
- **Mécanique de swap** : pendant la partie, l'humain peut échanger **deux cartes de son propre plateau** (drag & drop d'une carte sur une autre case de son plateau).
  - Échange vers sa propre case → refus `self` (rien ne se passe).
  - Dépôt hors du plateau (ou dépôt invalide / `undefined`) → refus `out` / `invalid` (« annulé »).
  - Dépôt sur le plateau de l'IA → refus (plateau en lecture seule).
  - Partie non lancée ou terminée → refus (`not_running` / `over`).
  - Sinon : les deux cellules sont échangées, le compteur de swaps humains est incrémenté, le plateau est re-rendu.
- **IA** : joue seule, à un intervalle dépendant de la difficulté (voir §3). L'IA ne peut pas être modifiée par l'humain.

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

**Règle d'as** : l'as est **uniquement haute** — **pas de quinte enroulée** (`A-2-3-4-5` et `A-7-8-9-10` ne sont pas des quintes).

## 2. Interface

- Sélecteurs : difficulté (`facile` / `normal` / `difficile`), temps de manche (10/20/30/60 s), bouton **Jouer**.
- Chrono affiché en temps réel (rouge ≤ 5 s), scores des deux joueurs en direct, message d'état.
- À la fin : écran final avec les 3 lignes décomposées par joueur, les sous-totaux, le total et l'annonce du vainqueur.

## 3. Architecture (fichier unique `index.html`)

Un seul fichier, sans dépendance, sans serveur — ouvrir dans un navigateur suffit.

1. **`<script id="game-logic">`** (pur, sans DOM) — s'attache à `globalThis.G` :
   - **Barème verbatim poker-rush** : `RANKS`, `RANK_LABEL`, `SUIT_LABEL`, `SUIT_NAME`, `HAND_SCORES`, `HAND_LABEL`, `isValidCard`, `evaluate5`, `isFull`, `rowScore`, `boardScore`, `boardBreakdown`.
   - **Logique Poker Chrono** : `DIFFICULTIES`, `TIME_OPTIONS`, `AI_INTERVAL`, `PAIRS`, `createGame`, `start`, `tick`, `humanSwap`, `aiStep`, `humanRandomSwap`, `simulateGame`, `cardText`.
   - **Déterminisme** : générateur pseudo-aléatoire seedé (mulberry32) — `createGame({ seed })` re-joue exactement la même partie (utilisé par les tests).
   - **Simulation headless** : `simulateGame({ difficulty, time, seed })` déroule la partie tick par tick (100 ms) avec un humain aléatoire — aucun DOM requis, utilisable dans Node.
2. **Script UI** (avec DOM) : rendu des plateaux, drag & drop natif (`dragstart`/`dragover`/`drop`/`dragend` + `DataTransfer`), chrono, écran final.

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
