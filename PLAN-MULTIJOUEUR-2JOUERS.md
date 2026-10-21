# Mode 2 joueurs — plan d'action (poker-chrono, v2.2)

**Statut : plan uniquement — aucun code écrit.**
Préparé par NI4NI le 2026-10-18, synthèse de la consultation stratégie 8R41N (2026-10-17/18, quotas vérifiés sur les pages providers) + vérifications indépendantes NI4NI (anti-abus du bonus, doc officielle PeerJS). Rapport source 8R41N : `C:\Users\Mikerhinos\.openmausbot\task-workspaces\20932a5a-084e-4779-82de-1c09b625b47a\c770bdc9-5315-4e96-9320-24f25d1f3a47\rapport_poker-chrono-v2-1_strategie_8R41N.md`

## 1. Contraintes de départ

- Zéro budget serveur (pas de compte payant, pas d'infra à maintenir).
- Hébergement de base : **GitHub Pages** (statique, gratuit).
- 2 joueurs, **en direct** (temps réel).

## 2. Solution retenue : WebRTC P2P via le cloud public PeerJS

- Connexion **directe navigateur ↔ navigateur** : latence ~20–80 ms.
- **Zéro backend, zéro compte, zéro coût, zéro keepalive** — c'est la seule option 100 % compatible avec « GitHub Pages en base, statique uniquement ».
- Le broker public PeerJS (`0.peerjs.com:443`) sert **uniquement à établir la connexion** (signalisation) ; ensuite les données circulent directement entre les deux navigateurs (canal WebRTC). Gratuit, sans compte — vérifié dans la doc officielle PeerJS.
- Hébergement : la partie solo + l'écran de connexion 2 joueurs vivent sur le même site statique GitHub Pages.

### Alternatives écartées (comparatif 8R41N)

| Option | Pourquoi écartée |
|---|---|
| Supabase Realtime | Gratuit (2 M msgs/mois, 200 connex.) mais **projet mis en pause après 1 semaine d'inactivité** → keepalive requis + compte |
| Ably / PubNub free | Compte obligatoire, plafonds (MAU / messages) |
| Polling D1 / Supabase | Latence effective 1–2,5 s, plafonds durs — « en direct » dégradé |
| Serveur WebSocket maison | Viole la contrainte zéro serveur |
| mDNS (réseau local) | Fonctionne seulement sur le même Wi-Fi |
| Asynchrone « Pop Tac » (défi par lien, 24 h) | Pas « en direct » — candidat v2.2+ |

## 3. Comment on « détecte » l'autre joueur en attente

Pas de salle mondiale / matchmaking global : ça nécessiterait un serveur. Le mécanisme standard sans serveur :

1. Le joueur A clique **« Partie 2 joueurs »** → il reçoit un **code court (4–6 caractères)** (= son identifiant de pair) + un écran d'attente qui affiche ce code.
2. Joueur A transmet le code (ou un lien contenant le code) au joueur B par n'importe quel canal (SMS, WhatsApp, e-mail…).
3. Le joueur B **saisit le code** → la connexion s'établit directement entre les deux navigateurs (secouage WebRTC via le broker PeerJS).
4. Si pas de connexion après ~30 s : **erreur explicite** (« ce type de connexion est bloqué par votre réseau ») + **repli solo en un clic**.

**Limite connue** : une petite partie des paires avec NAT symétrique ne pourra pas se connecter (pas de TURN gratuit avec SLA). Traitée par l'erreur explicite + repli solo. Le pourcentage exact de paires concernées est inconnu (estimation) — ce sera mesuré au test réel sur 2 appareils.

## 4. Ce qui se passe une fois le joueur trouvé

- L'hôte génère un **seed 128 bits** et l'envoie à l'adversaire.
- Les deux calculate **les mêmes 15 cartes** depuis le seed (deal miroir de la v2.1 → zéro asymétrie de main).
- Chaque coup (swap/dépôt) est **validé localement puis synchronisé** via le canal de données.
- **Anti-triche intégré : chaque joueur recalcule son plateau localement depuis le seed + les coups validés — le score déclaré par l'adversaire n'est jamais cru.** Ça ferme le vecteur « score faux » en P2P (même problème que l'audit v2.0, même famille de fix).
- Fin de partie : chacun calcule son score final localement, les deux écrans s'affichent.

## 5. Ce qu'il faudra construire (phase v2.2)

- PeerJS **inlinée (~100 Ko)** pour préserver le single-file et le `file://`.
- Écran de création de partie (code) + saisie du code + écran d'attente + erreur NAT + repli solo.
- Gates dédiées : connexion, synchronisation des coups, recalcul local anti-triche, repli solo.
- **Audit sécurité du delta P2P par L34K** : signalisation en clair via broker public, validation des messages entrants.
- **Test réel sur 2 appareils** (PC + téléphone) — le test headless seul ne suffit pas pour le WebRTC.
- Déploiement GitHub Pages (déjà prévu pour le jeu).

## 6. Risques et mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| NAT symétrique (petit % des paires) | Ces paires ne peuvent pas jouer ensemble | Erreur explicite + repli solo |
| Cloud PeerJS sans SLA | Broker indisponible ponctuellement | Multijoueur désactivé, solo intact (dégénérescence gracieuse) |
| Signalisation en clair via broker public | Métadonnées visibles par le broker | Audit L34K + validation stricte des messages (le contenu sensible = le seed, pas le score) |

## 7. Décision & ordre des étapes

- **Go/no-go : GO** sous tes contraintes — c'est la seule option 100 % compatible, et le repli solo reste intact dans tous les cas d'échec.
- Ordre recommandé : **v2.1 solo** (deal miroir + bouton GO + réglages + fixes W3C) livrée d'abord → puis **v2.2 multijoueur** en phase dédiée avec son audit.
- Repli si tu assouplis « statique uniquement » : Supabase Realtime (gratuit) + keepalive par GitHub Actions — plus fiable côté disponibilité, mais un compte et une tâche récurrente.
- **Hypothèse posée à ta place** : pas de menu « 2 joueurs » factice dans la v2.1 (tu as dit « on va peut-être rester 100 % IA pour l'instant »). Si tu veux quand même le bouton dans le menu v2.1 affichant « multijoueur — v2.2 », c'est une ligne de code au build suivant, dis-le.
