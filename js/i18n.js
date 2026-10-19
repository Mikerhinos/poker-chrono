/* ============================================================
 * i18n — v2.1.1 : 5 langues (EN défaut, FR, ES, IT, DE).
 * Toutes les chaînes user-facing passent par G.I18N.t().
 * Les libellés canoniques du barème (FR, js/deck.js) sont
 * mappés sur des clés de dictionnaire (HAND_KEYS).
 * Persistance : localStorage 'poker-chrono-lang'.
 * Aucun effet sur la logique de jeu (barème, IA, deck, seed).
 * ============================================================ */
(() => {
  'use strict';
  const G = globalThis.G;
  const LANGS = ['en', 'fr', 'es', 'it', 'de'];

  const DICTS = {
    en: {
      title: 'Poker Chrono — v2 dopamine',
      meta_desc: 'Poker Chrono — 2-player speed poker: drag & drop, GO bonus, 5 languages.',
      idle: 'Ready — choose difficulty and time.',
      running: 'Here we go: {time} s, AI {diff}.',
      ended: 'Done — {h} human swap(s), {a} AI swap(s).',
      win: '🏆 You win!',
      lose: '💻 The AI wins.',
      draw: '🤝 Draw!',
      final_game: 'Game over',
      fs_human: 'Your board: {n} pts',
      fs_go: ' + GO bonus: {b} pts = {t} pts',
      fs_ai: ' — AI board: {n} pts',
      best: 'Best score: {n} pts',
      new_best: 'New best score: {n} pts',
      row_line: 'Row {n} — {label} ({score} pts)',
      reason_self: 'Dropped on its own cell: nothing.',
      reason_out: 'Dropped off the board: cancelled.',
      reason_invalid: 'Invalid drop: refused.',
      reason_over: 'Game over: no more swaps.',
      reason_not_running: 'Game not started: start the game first.',
      ai_readonly: 'Refused: the AI board is read-only.',
      start_first: 'Start the game before moving cards.',
      go_no_state: 'Game not started.',
      go_over: 'Game over.',
      go_not_running: 'Start the game first.',
      go_too_early: 'Too early: GO unlocks in the last 5 s.',
      hand_quinte_flush: 'Straight flush',
      hand_quatre: 'Four of a kind',
      hand_full: 'Full house',
      hand_couleur: 'Flush',
      hand_quinte: 'Straight',
      hand_brelan: 'Three of a kind',
      hand_double_paire: 'Two pair',
      hand_paire: 'Pair',
      hand_carte_haute: 'High card',
      hand_incomplete: 'Incomplete',
      diff_facile: 'Easy',
      diff_normal: 'Normal',
      diff_difficile: 'Hard',
      diff_label: 'AI difficulty',
      time_label: 'Round time (seconds)',
      colors_label: 'Color rendering mode',
      lang_label: 'Language',
      colors_2: '2 colors',
      colors_4: '4 colors',
      music_btn: '♪ Music',
      sfx_btn: 'SFX',
      vol_music: 'Music vol.',
      vol_sfx: 'SFX vol.',
      play: 'Play',
      go_btn: 'GO !',
      replay: 'Play again',
      total_label: 'Total: ',
      pts: 'pts',
      human_board: 'Your board',
      ai_board: 'AI board',
      rank_11: 'J', rank_12: 'Q', rank_13: 'K', rank_14: 'A'
    },
    fr: {
      title: 'Poker Chrono — v2 dopamine',
      meta_desc: 'Poker Chrono — poker rapide à 2 : glisser-déposer, bonus GO, 5 langues.',
      idle: 'Prêt — choisissez la difficulté et le temps.',
      running: "C'est parti : {time} s, IA {diff}.",
      ended: 'Terminé — {h} swap(s) humain(s), {a} swap(s) IA.',
      win: '🏆 Vous gagnez !',
      lose: "💻 L'IA gagne.",
      draw: '🤝 Égalité !',
      final_game: 'Fin de partie',
      fs_human: 'Votre plateau : {n} pts',
      fs_go: ' + bonus GO : {b} pts = {t} pts',
      fs_ai: " — Plateau de l'IA : {n} pts",
      best: 'Meilleur score : {n} pts',
      new_best: 'Nouveau meilleur score : {n} pts',
      row_line: 'Ligne {n} — {label} ({score} pts)',
      reason_self: 'Déposé sur sa propre case : rien.',
      reason_out: 'Dépôt hors du plateau : annulé.',
      reason_invalid: 'Dépôt invalide : refusé.',
      reason_over: 'Partie terminée : plus de swap possible.',
      reason_not_running: "Partie non lancée : lancez la partie d'abord.",
      ai_readonly: "Refusé : le plateau de l'IA est en lecture seule.",
      start_first: "Lancez la partie avant de déplacer des cartes.",
      go_no_state: 'Partie non lancée.',
      go_over: 'Partie terminée.',
      go_not_running: "Lancez la partie d'abord.",
      go_too_early: 'Trop tôt : le GO se débloque après 5 s.',
      hand_quinte_flush: 'Quinte flush',
      hand_quatre: 'Quatre',
      hand_full: 'Full',
      hand_couleur: 'Couleur',
      hand_quinte: 'Quinte',
      hand_brelan: 'Brelan',
      hand_double_paire: 'Double paire',
      hand_paire: 'Paire',
      hand_carte_haute: 'Carte haute',
      hand_incomplete: 'Incomplet',
      diff_facile: 'Facile',
      diff_normal: 'Normal',
      diff_difficile: 'Difficile',
      diff_label: "Difficulté de l'IA",
      time_label: 'Temps de la manche (secondes)',
      colors_label: 'Mode de rendu des couleurs',
      lang_label: 'Langue',
      colors_2: '2 couleurs',
      colors_4: '4 couleurs',
      music_btn: '♪ Musique',
      sfx_btn: 'SFX',
      vol_music: 'Vol. musique',
      vol_sfx: 'Vol. SFX',
      play: 'Jouer',
      go_btn: 'GO !',
      replay: 'Rejouer',
      total_label: 'Total : ',
      pts: 'pts',
      human_board: 'Votre plateau',
      ai_board: "Plateau de l'IA",
      rank_11: 'V', rank_12: 'D', rank_13: 'R', rank_14: 'A'
    },
    es: {
      title: 'Poker Chrono — v2 dopamine',
      meta_desc: 'Poker Chrono — poker rápido a 2: arrastrar y soltar, bonus GO, 5 idiomas.',
      idle: 'Listo: elige dificultad y tiempo.',
      running: '¡A jugar! {time} s, IA {diff}.',
      ended: 'Terminado — {h} swap(s) humano(s), {a} swap(s) IA.',
      win: '🏆 ¡Ganas!',
      lose: '💻 Gana la IA.',
      draw: '🤝 ¡Empate!',
      final_game: 'Fin de partida',
      fs_human: 'Tu tablero: {n} pts',
      fs_go: ' + bonus GO: {b} pts = {t} pts',
      fs_ai: ' — Tablero de la IA: {n} pts',
      best: 'Mejor puntuación: {n} pts',
      new_best: '¡Nuevo récord! {n} pts',
      row_line: 'Línea {n} — {label} ({score} pts)',
      reason_self: 'Soltada en su propia casilla: nada.',
      reason_out: 'Suelta fuera del tablero: cancelado.',
      reason_invalid: 'Colocación inválida: rechazada.',
      reason_over: 'Partida terminada: ya no hay swaps.',
      reason_not_running: 'Partida no iniciada: empieza primero.',
      ai_readonly: 'Rechazado: el tablero de la IA es solo lectura.',
      start_first: 'Empieza la partida antes de mover cartas.',
      go_no_state: 'Partida no iniciada.',
      go_over: 'Partida terminada.',
      go_not_running: 'Empieza la partida primero.',
      go_too_early: 'Demasiado pronto: el GO se desbloquea en los últimos 5 s.',
      hand_quinte_flush: 'Escalera de color',
      hand_quatre: 'Póker',
      hand_full: 'Full',
      hand_couleur: 'Color',
      hand_quinte: 'Escalera',
      hand_brelan: 'Trío',
      hand_double_paire: 'Doble pareja',
      hand_paire: 'Pareja',
      hand_carte_haute: 'Carta alta',
      hand_incomplete: 'Incompleta',
      diff_facile: 'Fácil',
      diff_normal: 'Normal',
      diff_difficile: 'Difícil',
      diff_label: 'Dificultad de la IA',
      time_label: 'Tiempo de la mano (segundos)',
      colors_label: 'Modo de color',
      lang_label: 'Idioma',
      colors_2: '2 colores',
      colors_4: '4 colores',
      music_btn: '♪ Música',
      sfx_btn: 'SFX',
      vol_music: 'Vol. música',
      vol_sfx: 'Vol. SFX',
      play: 'Jugar',
      go_btn: 'GO !',
      replay: 'Jugar de nuevo',
      total_label: 'Total: ',
      pts: 'pts',
      human_board: 'Tu tablero',
      ai_board: 'Tablero de la IA',
      rank_11: 'J', rank_12: 'Q', rank_13: 'K', rank_14: 'A'
    },
    it: {
      title: 'Poker Chrono — v2 dopamine',
      meta_desc: 'Poker Chrono — poker veloce a 2: drag & drop, bonus GO, 5 lingue.',
      idle: 'Pronto: scegli difficoltà e tempo.',
      running: 'Si parte: {time} s, IA {diff}.',
      ended: 'Finita — {h} swap umano/umani, {a} swap IA.',
      win: '🏆 Hai vinto!',
      lose: "💻 Vince l'IA.",
      draw: '🤝 Pareggio!',
      final_game: 'Fine della partita',
      fs_human: 'Il tuo tabellone: {n} pts',
      fs_go: ' + bonus GO: {b} pts = {t} pts',
      fs_ai: " — Tabellone dell'IA: {n} pts",
      best: 'Punteggio migliore: {n} pts',
      new_best: 'Nuovo record: {n} pts',
      row_line: 'Riga {n} — {label} ({score} pts)',
      reason_self: 'Posizionata sulla propria cella: niente.',
      reason_out: 'Presa fuori dal tabellone: annullato.',
      reason_invalid: 'Posizionamento non valido: rifiutato.',
      reason_over: 'Partita terminata: più swap possibili.',
      reason_not_running: 'Partita non iniziata: prima avvia la partita.',
      ai_readonly: "Rifiutato: il tabellone dell'IA è in sola lettura.",
      start_first: 'Avvia la partita prima di muovere le carte.',
      go_no_state: 'Partita non iniziata.',
      go_over: 'Partita terminata.',
      go_not_running: 'Avvia prima la partita.',
      go_too_early: 'Troppo presto: il GO si sblocca negli ultimi 5 s.',
      hand_quinte_flush: 'Scala colore',
      hand_quatre: 'Quattro',
      hand_full: 'Full',
      hand_couleur: 'Colore',
      hand_quinte: 'Scala',
      hand_brelan: 'Brelan',
      hand_double_paire: 'Doppia coppia',
      hand_paire: 'Coppia',
      hand_carte_haute: 'Carta alta',
      hand_incomplete: 'Incompleta',
      diff_facile: 'Facile',
      diff_normal: 'Normale',
      diff_difficile: 'Difficile',
      diff_label: "Difficoltà dell'IA",
      time_label: 'Tempo della mano (secondi)',
      colors_label: 'Modalità colore',
      lang_label: 'Lingua',
      colors_2: '2 colori',
      colors_4: '4 colori',
      music_btn: '♪ Musica',
      sfx_btn: 'SFX',
      vol_music: 'Vol. musica',
      vol_sfx: 'Vol. SFX',
      play: 'Gioca',
      go_btn: 'GO !',
      replay: 'Rigioca',
      total_label: 'Totale: ',
      pts: 'pts',
      human_board: 'Il tuo tabellone',
      ai_board: "Tabellone dell'IA",
      rank_11: 'J', rank_12: 'Q', rank_13: 'K', rank_14: 'A'
    },
    de: {
      title: 'Poker Chrono — v2 dopamine',
      meta_desc: 'Poker Chrono — schneller Poker zu zweit: Drag & Drop, GO-Bonus, 5 Sprachen.',
      idle: 'Bereit — Schwierigkeitsgrad und Zeit wählen.',
      running: "Los geht's: {time} s, KI {diff}.",
      ended: 'Fertig — {h} menschliche(r) Swap, {a} KI-Swap.',
      win: '🏆 Du gewinnst!',
      lose: '💻 Die KI gewinnt.',
      draw: '🤝 Unentschieden!',
      final_game: 'Spielende',
      fs_human: 'Dein Brett: {n} Pkt',
      fs_go: ' + GO-Bonus: {b} Pkt = {t} Pkt',
      fs_ai: ' — KI-Brett: {n} Pkt',
      best: 'Bestwert: {n} Pkt',
      new_best: 'Neuer Rekord: {n} Pkt',
      row_line: 'Zeile {n} — {label} ({score} Pkt)',
      reason_self: 'Auf die eigene Zelle abgelegt: nichts.',
      reason_out: 'Außerhalb des Bretts abgelegt: abgebrochen.',
      reason_invalid: 'Ungültige Ablage: abgelehnt.',
      reason_over: 'Spiel beendet: kein Swap mehr möglich.',
      reason_not_running: 'Spiel nicht gestartet: zuerst starten.',
      ai_readonly: 'Abgelehnt: das KI-Brett ist schreibgeschützt.',
      start_first: 'Starte das Spiel, bevor du Karten bewegst.',
      go_no_state: 'Spiel nicht gestartet.',
      go_over: 'Spiel beendet.',
      go_not_running: 'Zuerst das Spiel starten.',
      go_too_early: 'Zu früh: GO wird in den letzten 5 s freigeschaltet.',
      hand_quinte_flush: 'Straight Flush',
      hand_quatre: 'Vierling',
      hand_full: 'Full House',
      hand_couleur: 'Flush',
      hand_quinte: 'Straight',
      hand_brelan: 'Drilling',
      hand_double_paire: 'Zwei Paare',
      hand_paire: 'Paar',
      hand_carte_haute: 'Hohes Blatt',
      hand_incomplete: 'Unvollständig',
      diff_facile: 'Leicht',
      diff_normal: 'Normal',
      diff_difficile: 'Schwer',
      diff_label: 'KI-Schwierigkeit',
      time_label: 'Rundenzeit (Sekunden)',
      colors_label: 'Farbmodus',
      lang_label: 'Sprache',
      colors_2: '2 Farben',
      colors_4: '4 Farben',
      music_btn: '♪ Musik',
      sfx_btn: 'SFX',
      vol_music: 'Musik-Lautst.',
      vol_sfx: 'SFX-Lautst.',
      play: 'Spielen',
      go_btn: 'GO !',
      replay: 'Nochmal spielen',
      total_label: 'Summe: ',
      pts: 'Pkt',
      human_board: 'Dein Brett',
      ai_board: 'KI-Brett',
      rank_11: 'J', rank_12: 'Q', rank_13: 'K', rank_14: 'A'
    }
  };

  /* Libellés canoniques du barème (FR, js/deck.js) → clés de dictionnaire. */
  const HAND_KEYS = {
    'Quinte flush': 'hand_quinte_flush',
    'Quatre': 'hand_quatre',
    'Full': 'hand_full',
    'Couleur': 'hand_couleur',
    'Quinte': 'hand_quinte',
    'Brelan': 'hand_brelan',
    'Double paire': 'hand_double_paire',
    'Paire': 'hand_paire',
    'Carte haute': 'hand_carte_haute',
    'Incomplet': 'hand_incomplete'
  };

  let lang = 'en';

  function dict() { return DICTS[lang] || DICTS.en; }

  function t(key, vars) {
    let s = Object.prototype.hasOwnProperty.call(dict(), key)
      ? dict()[key]
      : (Object.prototype.hasOwnProperty.call(DICTS.en, key) ? DICTS.en[key] : key);
    if (vars) {
      for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
    }
    return s;
  }

  function handName(canonical) {
    const k = HAND_KEYS[canonical];
    return k ? t(k) : canonical;
  }

  function rankLabel(r) {
    const k = 'rank_' + r;
    const d = dict();
    if (Object.prototype.hasOwnProperty.call(d, k)) return d[k];
    return (G && G.RANK_LABEL && G.RANK_LABEL[r] !== undefined) ? G.RANK_LABEL[r] : String(r);
  }

  function diffLabel(v) { return t('diff_' + v); }

  function apply() {
    const d = dict();
    document.documentElement.setAttribute('lang', lang);
    document.title = d.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', d.meta_desc);
    for (const el of document.querySelectorAll('[data-i18n]')) {
      el.textContent = t(el.getAttribute('data-i18n'));
    }
    for (const el of document.querySelectorAll('[data-i18n-title]')) {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    }
  }

  function setLang(l) {
    if (!LANGS.includes(l)) return false;
    lang = l;
    try { localStorage.setItem('poker-chrono-lang', l); } catch (err) { /* stockage indisponible */ }
    apply();
    return true;
  }

  function init() {
    let saved = null;
    try { saved = localStorage.getItem('poker-chrono-lang'); } catch (err) { /* stockage indisponible */ }
    if (saved && DICTS[saved]) lang = saved;
    apply();
  }

  G.I18N = {
    t, handName, rankLabel, diffLabel, apply, setLang,
    getLang: () => lang,
    dicts: () => DICTS,
    LANGS,
    init
  };
  init();
})();
