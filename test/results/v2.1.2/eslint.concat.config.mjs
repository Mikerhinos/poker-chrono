// Config flat ESLint — PORTE 23 (ESLint), Poker-Chrono v2.1.2.
// Lint de l'application comme le navigateur la voit : les 6 scripts js/*.js
// (scripts classiques, scope global partagé) concaténés dans l'ordre de chargement
// de index.html (deck → game → i18n → audio → fx → ui) dans all.js.
// Ajustements documentés :
//  - global `G` : propriété globalThis créée volontairement par l'app (game.js / fx.js).
//  - no-unused-vars caughtErrors:"none" : les catch silencieux avec repli
//    (lsGet/lsSet, armement audio) sont un motif délibéré du code.
import js from './node_modules/@eslint/js/src/index.js';

export default [
  {
    files: ['all.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'script',
      globals: {
        window: 'readonly', document: 'readonly', navigator: 'readonly',
        localStorage: 'readonly', location: 'readonly', history: 'readonly',
        AudioContext: 'readonly', webkitAudioContext: 'readonly',
        performance: 'readonly', requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly', setTimeout: 'readonly',
        clearTimeout: 'readonly', setInterval: 'readonly',
        clearInterval: 'readonly', console: 'readonly',
        atob: 'readonly', btoa: 'readonly', screen: 'readonly',
        devicePixelRatio: 'readonly', crypto: 'readonly',
        // globalThis.G : scope global partagé de l'application
        G: 'writable',
      },
    },
    plugins: { js },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { vars: 'all', args: 'after-used', caughtErrors: 'none' }],
    },
  },
];
