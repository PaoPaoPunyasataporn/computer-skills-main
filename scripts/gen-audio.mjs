// Record the missing Thai speech clips for the games.
//
// WHY THIS EXISTS
// Each game embeds a map of pre-recorded Thai MP3s (`dlfAudioData`), keyed by the
// first 12 hex chars of md5(cleaned text). dlf.speak(text) plays the clip when one
// exists and otherwise falls back to the browser's speech engine. On a machine with
// no Thai voice installed — the default on most Windows boxes — that fallback reads
// Thai words in an English voice, which is gibberish to a child.
//
// The clip map was generated before a lot of content was written (the boss fight's
// extra challenges, the newer units), so hundreds of strings had no clip and every
// speaker button on them was effectively broken. This script fills those gaps: it
// finds every Thai string a game can speak, synthesises the ones that have no clip,
// and embeds them in the same map, in the same format, under the same key scheme.
//
// USAGE
//   node scripts/gen-audio.mjs --dry            # report what is missing, fetch nothing
//   node scripts/gen-audio.mjs                  # fill the gaps in every game
//   node scripts/gen-audio.mjs unit4 unit9      # ...only these games
//
// It is idempotent and cached: a clip already embedded is never re-fetched, and every
// synthesised MP3 is cached on disk, so a re-run costs nothing. Safe to stop and
// restart — each game file is rewritten only once, after all of its clips are in hand.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// A proper JS string-literal matcher. The naive character-class version truncated any
// literal containing the OTHER kind of quote — e.g. 'เว็บที่บอกว่า "กินน้ำแข็งแล้วเก่ง"' —
// so those strings were never recorded and their speakers stayed broken.
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
const CACHE = path.join('node_modules', '.cache', 'cs-tts');   // MP3s, keyed by clip id
const MAX_LEN = 160;          // the TTS endpoint truncates long strings; ours are labels
const DELAY_MS = 120;         // be a polite client

// Must mirror dlfCleanKey() in the games exactly, or the keys will not line up.
function cleanKey(s) {
  if (!s) return '';
  s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}‍⃣™ℹ↔-↪]/gu, '');
  s = s.replace(/\u{1F50A}/gu, '');
  s = s.replace(/[“”‘’`]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}
const clipId = (t) => crypto.createHash('md5').update(cleanKey(t), 'utf8').digest('hex').slice(0, 12);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function synth(text) {
  const id = clipId(text);
  const cached = path.join(CACHE, id + '.mp3');
  if (fs.existsSync(cached)) return fs.readFileSync(cached);

  const url = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=th&q=' + encodeURIComponent(text);
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 500) throw new Error('suspiciously small (' + buf.length + 'B)');
      fs.mkdirSync(CACHE, { recursive: true });
      fs.writeFileSync(cached, buf);
      return buf;
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(600 * attempt);   // backoff; the endpoint throttles bursts
    }
  }
}

// Everything a speaker can say:
//   * every Thai string literal in the source (choice text, labels, explanations), and
//   * every literal data-say="…" — including ones with no Thai in them at all, like the
//     wifi SSID "CoffeeShop_Free". A child still needs to hear those read out.
function speakableStrings(html) {
  const out = new Set();
  const add = (raw) => {
    const c = cleanKey(raw);
    if (c && c.length <= MAX_LEN) out.add(c);
  };
  // Scan the code only. The audio map is one multi-megabyte base64 line and running a
  // string-literal regex across it overflows the regex engine's stack.
  const code = html.replace(/<script id="dlfAudioData"[\s\S]*?<\/script>/, '');
  for (const t of literalStrings(code)) add(t);
  for (const m of html.matchAll(/data-say="([^"]*)"/g)) {
    const v = m[1];
    if (v.includes('${') || v.includes("'+")) continue;   // built at runtime, not a literal
    add(v.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  }
  return [...out];
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const only = args.filter((a) => !a.startsWith('--'));

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
  const missing = speakableStrings(html).filter((t) => !(clipId(t) in audio) && !(t in audio));

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
      if (added % 25 === 0) process.stdout.write(`   …${added}/${missing.length}\n`);
      await sleep(DELAY_MS);
    } catch (e) {
      failed.push(text + '  (' + e.message + ')');
    }
  }

  // Rewrite the map in place. Everything else in the file is untouched.
  fs.writeFileSync(file, html.slice(0, m.index) + m[1] + JSON.stringify(audio) + m[3] + html.slice(m.index + m[0].length), 'utf8');
  grandTotal += added; grandBytes += bytes;
  console.log(`   ✔ added ${added} clips (+${(bytes / 1048576).toFixed(2)} MB) — now ${Object.keys(audio).length} total`);
  failed.forEach((f) => console.log('   ✗ FAILED: ' + f));
}

if (!dry) console.log(`\nDone: ${grandTotal} new clips, +${(grandBytes / 1048576).toFixed(1)} MB total.`);
