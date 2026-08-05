// Same job as gen-audio.mjs (fill gaps in each game's dlfAudioData clip map) but
// synthesised with Microsoft Edge's neural TTS (via the `edge-tts` Python package)
// instead of the Google Translate endpoint -- much higher quality Thai voice.
//
// Requires `edge-tts` importable by the `python` on PATH:
//   pip install edge-tts
//
// USAGE
//   node scripts/gen-audio-edge.mjs --dry            # report what is missing, synth nothing
//   node scripts/gen-audio-edge.mjs                   # fill the gaps in every game
//   node scripts/gen-audio-edge.mjs ai0 ai3            # ...only files whose name includes these
//   node scripts/gen-audio-edge.mjs --extra strings.json   # also synth an extra string list
//                                                            (JSON array), keyed the same way,
//                                                            merged into every game's map that
//                                                            already has that key missing.
//
// Idempotent and cached: a clip already embedded is never re-synthesised, and every
// synthesised MP3 is cached on disk under node_modules/.cache/cs-tts-edge, so a re-run
// (or a run of the plain gen-audio.mjs afterwards) costs nothing extra.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import os from 'os';

// A proper JS string-literal matcher -- mirrors gen-audio.mjs exactly.
const LITERALS = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\$]|\\.)*)`/g;
function literalStrings(code) {
  const out = [];
  for (const m of code.matchAll(LITERALS)) {
    const raw = m[1] ?? m[2] ?? m[3];
    if (raw && /[฀-๿]/.test(raw)) out.push(raw.replace(/\\'/g, "'").replace(/\\"/g, '"'));
  }
  return out;
}

const GAMES = 'public/games';
const CACHE = path.join('node_modules', '.cache', 'cs-tts-edge');
const MAX_LEN = 220;          // must match the games' readable() length cutoff, not the old 160
const VOICE = 'th-TH-PremwadeeNeural';
const PYTHON = 'python';

// Must mirror dlfCleanKey() in the games exactly, or the keys will not line up.
function cleanKey(s) {
  if (!s) return '';
  s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}‍⃣™ℹ↔-↪]/gu, '');
  s = s.replace(/\u{1F50A}/gu, '');
  s = s.replace(/["'`]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}
const clipId = (t) => crypto.createHash('md5').update(cleanKey(t), 'utf8').digest('hex').slice(0, 12);

// Plain visible text inside tags the runtime decorator reads out loud (p, li, h1-h5,
// blockquote, figcaption, dd, dt, div, span) that ISN'T a quoted JS literal -- e.g. a
// disclaimer <p> written straight into the markup. Only handles the simple, common case:
// a tag with no nested element tags inside it (matches what dlfHasOwnText/readable() do
// for a leaf node). Nested/dynamic markup still needs the literal-string or data-say path.
function plainTagText(html) {
  const out = [];
  const bodyOnly = html.replace(/<script[\s\S]*?<\/script>/g, ' ');
  for (const m of bodyOnly.matchAll(/<(p|li|h[1-5]|blockquote|figcaption|dd|dt|div|span)\b[^>]*>([^<]*)<\/\1>/g)) {
    const txt = m[2].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').trim();
    if (txt) out.push(txt);
  }
  return out;
}

function speakableStrings(html) {
  const out = new Set();
  const add = (raw) => {
    const c = cleanKey(raw);
    if (c && c.length <= MAX_LEN && /[฀-๿]/.test(c)) out.add(c);
  };
  const code = html.replace(/<script id="dlfAudioData"[\s\S]*?<\/script>/, '');
  for (const t of literalStrings(code)) add(t);
  for (const t of plainTagText(html)) add(t);
  for (const m of html.matchAll(/data-say="([^"]*)"/g)) {
    const v = m[1];
    if (v.includes('${') || v.includes("'+")) continue;
    add(v.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  }
  return [...out];
}

async function synth(text) {
  const id = clipId(text);
  const cached = path.join(CACHE, id + '.mp3');
  if (fs.existsSync(cached)) return fs.readFileSync(cached);

  fs.mkdirSync(CACHE, { recursive: true });
  const tmp = path.join(os.tmpdir(), 'edge-tts-' + id + '-' + process.pid + '.mp3');
  const r = spawnSync(PYTHON, ['-m', 'edge_tts', '-t', text, '-v', VOICE, '--write-media', tmp], { encoding: 'utf8' });
  if (r.status !== 0 || !fs.existsSync(tmp)) {
    throw new Error('edge-tts failed: ' + (r.stderr || r.error || 'unknown error').toString().slice(0, 200));
  }
  const buf = fs.readFileSync(tmp);
  fs.unlinkSync(tmp);
  if (buf.length < 300) throw new Error('suspiciously small (' + buf.length + 'B)');
  fs.writeFileSync(cached, buf);
  return buf;
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const extraIdx = args.indexOf('--extra');
const extraFile = extraIdx >= 0 ? args[extraIdx + 1] : null;
const only = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--extra');
const extraList = extraFile ? JSON.parse(fs.readFileSync(extraFile, 'utf8')) : [];

const files = fs.readdirSync(GAMES)
  .filter((f) => f.endsWith('.html'))
  .filter((f) => !only.length || only.some((o) => f.includes(o)))
  .map((f) => path.join(GAMES, f));

let grandTotal = 0, grandBytes = 0;

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/(<script id="dlfAudioData" type="application\/json">)([\s\S]*?)(<\/script>)/);
  if (!m) { console.log('!! no audio map in ' + path.basename(file)); continue; }

  const audio = JSON.parse(m[2]);
  const candidates = new Set([...speakableStrings(html), ...extraList]);
  const missing = [...candidates].filter((t) => {
    const c = cleanKey(t);
    return c && !(clipId(c) in audio) && !(c in audio);
  });

  const before = Object.keys(audio).length;
  console.log(`\n${path.basename(file)} — ${before} clips embedded, ${missing.length} missing`);
  if (dry) { missing.forEach((t) => console.log('   ✗ ' + t)); continue; }
  if (!missing.length) continue;

  let added = 0, bytes = 0, failed = [];
  for (const text of missing) {
    try {
      const buf = await synth(text);
      audio[clipId(text)] = 'data:audio/mp3;base64,' + buf.toString('base64');
      added++; bytes += buf.length;
      if (added % 20 === 0) process.stdout.write(`   …${added}/${missing.length}\n`);
    } catch (e) {
      failed.push(text + '  (' + e.message + ')');
    }
  }

  fs.writeFileSync(file, html.slice(0, m.index) + m[1] + JSON.stringify(audio) + m[3] + html.slice(m.index + m[0].length), 'utf8');
  grandTotal += added; grandBytes += bytes;
  console.log(`   ✔ added ${added} clips (+${(bytes / 1048576).toFixed(2)} MB) — now ${Object.keys(audio).length} total`);
  failed.forEach((f) => console.log('   ✗ FAILED: ' + f));
}

if (!dry) console.log(`\nDone: ${grandTotal} new clips, +${(grandBytes / 1048576).toFixed(1)} MB total.`);
