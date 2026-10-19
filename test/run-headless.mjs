// Lanceur générique Chrome headless (CDP) pour les portes DOM v2.
// Usage : node test/run-headless.mjs <test-file.mjs> [port]
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TEST_FILE = process.argv[2];
if (!TEST_FILE) {
  console.error('usage : node test/run-headless.mjs <test-file.mjs> [port]');
  process.exit(2);
}
const PORT = process.env.PORT ? Number(process.env.PORT) : Number(process.argv[3] || 9347);
const userDataDir = mkdtempSync(join(tmpdir(), 'poker-chrono-chrome-'));

const chrome = spawn(CHROME, [
  '--headless',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--disable-background-networking',
  `--user-data-dir=${userDataDir}`,
  `--remote-debugging-port=${PORT}`,
  '--remote-allow-origins=*',
  '--allow-file-access-from-files',
  // Environnement headless sans geste utilisateur réel : autorise le
  // démarrage des AudioContext (sinon state restant « suspended »).
  '--autoplay-policy=no-user-gesture-required',
  'about:blank'
], { stdio: 'ignore' });

const watchdog = setTimeout(() => {
  console.error('watchdog : timeout global (' + TEST_FILE + ')');
  try { chrome.kill('SIGKILL'); } catch {}
  process.exit(124);
}, 240000);

let ready = false;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    if (r.ok) { ready = true; break; }
  } catch {}
  await new Promise((r) => setTimeout(r, 300));
}
if (!ready) {
  console.error('Chrome CDP n’a jamais répondu');
  try { chrome.kill('SIGKILL'); } catch {}
  process.exit(1);
}
console.log(`Chrome CDP prêt sur 127.0.0.1:${PORT} pour ${TEST_FILE}`);

const test = spawn(process.execPath, [join(HERE, TEST_FILE), `127.0.0.1:${PORT}`], { stdio: 'inherit' });
test.on('error', (e) => { console.error('erreur spawn test :', e.message); try { chrome.kill('SIGKILL'); } catch {} process.exit(1); });
test.on('close', (code) => {
  clearTimeout(watchdog);
  try { chrome.kill('SIGKILL'); } catch {}
  process.exit(code ?? 1);
});
