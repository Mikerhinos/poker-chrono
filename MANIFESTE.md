# MANIFESTE — Poker Chrono v2.1.2 (état final, 2026-10-20)

**État** : HEAD `98aa7f3` (commit B — re-execution intégrale 22 portes + w3c + ESLint #23), tree clean. Stack de 6 commits v2.1.2 sur la base `1c65214` (v2.1.1 phase D) : `7059b88` (pulse-glow) → `3595642` (Finish!) → `1514dcb` (Pointer Events) → `455a4e6` (musique OFF) → `351c159` (fix `bd1`) → `98aa7f3` (preuves).

**Périmètre** : les **48 entrées** ci-dessous = périmètre du manifeste v2.1 (`sha256-final-v21.txt`), inchangé : livrables site (12), tests CDP/logiques (24 scripts), preuves de runs (8), docs et squelettes (4). Hashs **recalculés par re-lecture** de chaque fichier à l'état final — aucun hash repris d'un artefact antérieur.

**Hors périmètre (auto-référence impossible)** : `sha256-final-v212.txt` (fichier machine de ce manifeste), `MANIFESTE.md` (ce document), `.git`.

## Résultats ancrés à l'état final

| Invariant | Valeur |
|---|---|
| Taille totale HTML+CSS+JS | **144 348 octets** (100–200 Ko, porte 8) |
| Bench 900 (sortie normalisée) | `312841cd81911460d998d4b4d6a026cfab11b4c7efca4559a8443bc828bc357a` (identique v2.1.1) |
| Portes | **22/22 vertes** + w3c 3/3 (voir COMPT-RENDU v2.1.2) |
| ESLint porte 23 | exit 0, 0 erreur (concaténation `all.js`, config `test/results/v2.1.2/eslint.concat.config.mjs`) |
| g1-adhoc (substitut porte g1 officielle) | 41 OK / 0 FAIL |
| Deck verbatim | `js/deck.js` ↔ `baseline-v2.0.0/index.html` byte-identiques |

## Table des 48 sha256 (format `<n>|<sha256> *<path>`)

| n | chemin | sha256 |
|---|---|---|
| 1 | `./ANCRE-PARTS.md` | `ba9e1555316b0e88b97df62c844ecb35d3aa6ee7fc9a3ce666fffe097eb21a2c` |
| 2 | `./COMPT-RENDU.md` | `fb3efb6d82dbfc2a5f4ad2819dc438a49de5d8624b34033327c7746fe5fb6e5d` |
| 3 | `./css/anim.css` | `f8beff71bf0e2936f2f87f34444ee481b9d4f0f19a79bfe576f157e2f50d569a` |
| 4 | `./css/base.css` | `a8bab1e7bafc84d76ff8cd3548d17795305ca0d21d476990ce0ae94e0204d9b3` |
| 5 | `./css/fonts.css` | `0f697d3146f6c7e4a818ea7f25458ab62a60713543049b3c6aa754659709f68a` |
| 6 | `./css/theme.css` | `bda14af5e8afe1efb09fab88490bea039e281b235654469c099856fa37d2da89` |
| 7 | `./index.html` | `b86304fc8a125b4cfdb88f752f2159e157a96358e7c467bd5f34c259f88ab399` |
| 8 | `./js/audio.js` | `f72fba8752200a8bdf5604bbb1627422fbc5c319f5024559d7e8c2f5af3d1061` |
| 9 | `./js/deck.js` | `12d306b5015e76bb88cd8f6006448e7090c63c463e6f0268a64291d875f0a66e` |
| 10 | `./js/fx.js` | `5e6179b28e6c3dbf3b482438e3e6bede5287dcf49d15902cb7242264c7cc1d75` |
| 11 | `./js/i18n.js` | `aaf094d7d5bce100199e23fc38fa3f89debb85e0073cc41fefac15efdf0637ea` |
| 12 | `./js/game.js` | `621aac59dddcc9d6987804adf0f4a49b48c522b6c705805959e0c2f9ce81c7de` |
| 13 | `./js/ui.js` | `6df9c9f3b966a1445fb47d3663b1e8b8c4637e1f3dd67bf8f7b4dd8164a1982e` |
| 14 | `./README.md` | `bec68f65b72959c1958d0243c1cbf652118e6fc4debde26be56c743732b96476` |
| 15 | `./test/cdp.mjs` | `986dea6adb306bb3b2b63d87059f3df6c5148630a02502af743e2f1453c5b554` |
| 16 | `./test/diag-p4.mjs` | `be4efbe80888e11f1544486ce1515877cd05e2fac723135c3e6cd6c650080485` |
| 17 | `./test/g11-noscore.mjs` | `7567d5f02711f3bfba71610e22fbefcc47f7dfe5ed9c3c9fae6600bbb105944a` |
| 18 | `./test/g12-seed.mjs` | `7ffa802aff67dcb3b8514ca86c68dafec98b113fd18ce3d953376323de4089cd` |
| 19 | `./test/g13-best.mjs` | `4f52b1613d7c517a5970e618ab31ccf59d37b78dd5cf1729d18867b03d318b4a` |
| 20 | `./test/g14-innertest.mjs` | `f55502999a269c77fcea99b5b9e41efe03ef9ab930b51fd86953db95b39df5ac` |
| 21 | `./test/g15-i18n.mjs` | `d65200d718d8a8ea9683dc78328413e800669f53415e8fd9cc777b92817c26ec` |
| 22 | `./test/g1-result.txt` | `b48db4e2b37ee9ea23654684ea5d51689ef2a5569c6f45eba5042b29f428c323` |
| 23 | `./test/g1-scores.js` | `d1c06237b5c6e08b1de7b3c59725add5888a90ca374137d670e01610c28c39ac` |
| 24 | `./test/g2g4-headless.js` | `1f63e9041a75fcda647823fa9628fddfdcb73b06149b111d2652640df8aeab08` |
| 25 | `./test/g2g4-result.txt` | `33e6d93ffaa05b6f225b5c20a2cfd2578bb522486177e086b4809a63ffa87f81` |
| 26 | `./test/g3-result.txt` | `fab9d59b09f102685a38ad452a6f65d48fe08c5079f9fc0303a2644d6c83d60d` |
| 27 | `./test/g3-swap.js` | `28f8eabdff190ae2a4ca455d1ad1336ff93d15930cbc943fdbf47043923cd90e` |
| 28 | `./test/g4-colors.mjs` | `acf3e2a1c6511fd2eb07264543110d9ba69ad9bf8de6fc3b346bec5aeedb45e8` |
| 29 | `./test/g5-result.txt` | `729413a0b3884e03f504765d104bed654d855d7116ce78fb657579830aa4fab8` |
| 30 | `./test/g5-rownames.mjs` | `e2b6c1eae5c90742eea36bee81ef3f1531e60a679606e54e1f4491f72c9b5114` |
| 31 | `./test/g5-run.mjs` | `4e8626b9f6f754406018fa088c8f62d55e28299c260bcdc6281adb8f82760e50` |
| 32 | `./test/g5-ui.mjs` | `c588bcb614fa3627f7595868c389017c1dc0999c87e0029a23d6ba9ee4202bdd` |
| 33 | `./test/g6-audio.mjs` | `3aec414c17e9ce5c628005ebe45419eae6e5c3eb47c15099d205deebc869c960` |
| 34 | `./test/g7-fx.mjs` | `0da1e832651f76b1be3fcf3aa3ee5235f1b9f13f2e3d5d7f7c4d502d35bfbee8` |
| 35 | `./test/g8-scan.mjs` | `7f97aa4fcb41d93033e29bfa64ae909b79eab149839441e804c698bb93b3a23a` |
| 36 | `./test/g9-boards.mjs` | `72a621e41fa97605cd5d50177b3a70b35a40b85028e73afe7dc5c6a7d2e07535` |
| 37 | `./test/go-logic.mjs` | `349b3d1018d0e31402cd23e2ef561d778ad55acce79573ed4732e27bced65b54` |
| 38 | `./test/go-ui.mjs` | `d964383c651dfe90177b5d341b5a0aae507b671cfb71f78943fd0399a30fdc9f` |
| 39 | `./test/go-ui-85.mjs` | `723e87294e516f4d8738fbefe37015f57b2648e38fb5570392f97099bae9adfe` |
| 40 | `./test/lib.mjs` | `b0d8d59c552fcce2ce381a71ff8c3dbe48a07628a6abf6bb20d38fa9d6b01954` |
| 41 | `./test/max-board.mjs` | `a76d3d61efb02f989568aef63435e76c6c02ebf0687c816ad4fcb2d6a4e36f02` |
| 42 | `./test/poc-repro.mjs` | `0fad5b9f631a42897ab63474b46ba18100c15cfa0ece9428fa89d6cb6770b5f6` |
| 43 | `./test/reactivity.mjs` | `026f5f3d8534be9d3df2617098b86e5f3f2b0eb7326559aaea47d9f4ae64a61a` |
| 44 | `./test/run-headless.mjs` | `e5c0f71c2ef1f866f8bd1b984acb4afd00c9f500be8aa6b98605a62830c86670` |
| 45 | `./test/scaffold-v21/g12-seed.mjs` | `758876fcfd037093a46d6c384bdc6043515a53759befa5a8425170f2c4a4f53b` |
| 46 | `./test/scaffold-v21/g3-swap.js` | `e19040f74e0cdb1d41614247d3abfc230ef0f0d79aafc3f95e686b72fbea62d3` |
| 47 | `./test/scaffold-v21/poc-repro.mjs` | `f7660f0d29738255d58fe787265451453ce406f5eaf6d28c710a96f364a20e96` |
| 48 | `./test/w3c.mjs` | `a1a4c755e8db9115789925539b8a3a8473f734ee1c81fb9f83c5c0f784773679` |

## Diff vs manifeste v2.1 (`sha256-final-v21.txt`)

**12 hashs changés** sur 48 (périmètre identique) :

| # | chemin | cause |
|---|---|---|
| 2 | `./COMPT-RENDU.md` | section v2.1.2 ajoutée |
| 3 | `./css/anim.css` | item 1 — keyframe `start-pulse-glow` |
| 4 | `./css/base.css` | item 3 — `touch-action:none`, `.card.dragging` |
| 7 | `./index.html` | items 1, 2, 6 (pulse-glow, Finish!, `aria-pressed="false"`) |
| 8 | `./js/audio.js` | item 6 — musique OFF par défaut |
| 11 | `./js/i18n.js` | item 2 — `go_btn` Finish! dans les 5 langues |
| 12 | `./js/game.js` | fix — suppression code mort `bd1` (2 lignes) |
| 13 | `./js/ui.js` | item 3 — Pointer Events |
| 30 | `./test/g5-rownames.mjs` | item 3 — PointerEvents + `scrollIntoView()` |
| 32 | `./test/g5-ui.mjs` | item 3 — PointerEvents + `scrollIntoView()` |
| 33 | `./test/g6-audio.mjs` | item 6 — 16 checks |
| 38 | `./test/go-ui.mjs` | item 2 — commentaire de tête |

Les 36 autres entrées sont inchangées, dont `./test/g2g4-result.txt` (`33e6d93f…`, ancre bench 900) et `./js/deck.js` (verbatim baseline v2.0.0).

## Procédure

1. `git status --porcelain` → tree clean à `98aa7f3`.
2. Re-lecture binaire de chacun des 48 chemins du périmètre, SHA-256 UTF-8.
3. Format machine `sha256-final-v212.txt` (une ligne par entrée : `<n>|<sha256> *<path>`).
4. Diff vs `sha256-final-v21.txt` : 12 changés / 36 inchangés (table ci-dessus).
