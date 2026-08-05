// Record the Thai speech clips for the REACT side of the app — the competition quiz
// options, the typing phrases, the click-race targets, and the boss fight's
// "leave the test?" dialog.
//
// Same reason as scripts/gen-audio.mjs: most machines have no Thai voice installed, so
// the browser's speech engine reads Thai in an English accent. A recorded clip is the
// only way those speakers actually work. The games embed their clips inline; here the
// clips are ordinary files under public/audio/ with a manifest, because the React app
// is not one giant self-contained HTML file and can just fetch what it needs.
//
//   node scripts/gen-audio-app.mjs --dry     # list what would be recorded
//   node scripts/gen-audio-app.mjs           # record the missing ones
//
// Idempotent: an MP3 that already exists is never re-fetched.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';

// A proper JS/TS string-literal matcher. The naive character-class version truncated any
// literal containing the OTHER kind of quote — e.g. 'มีอีเมลจาก "ธนาคาร" บอกว่า…' — so 21
// of the quiz questions were never recorded and their speakers stayed broken.
const LITERALS = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\$]|\\.)*)`/g;
function literalStrings(code) {
  const out = [];
  for (const m of code.matchAll(LITERALS)) {
    const raw = m[1] ?? m[2] ?? m[3];
    if (raw && /[฀-๿]/.test(raw)) out.push(raw.replace(/\\'/g, "'").replace(/\\"/g, '"'));
  }
  return out;
}

const OUT = path.join('public', 'audio');
const MANIFEST = path.join(OUT, 'manifest.json');
const EDGE_PROGRESS = path.join(OUT, '.edge-tts-progress.json');
const SOURCES = ['components/GameOverlay.tsx', 'app/audio-check/page.tsx'];
const COMPETE_CONTENT = 'lib/compete-content.ts';
const MAX_LEN = 160;
const REFRESH = process.argv.includes('--refresh');

// Must match cleanText() in lib/speak.ts.
function cleanKey(s) {
  if (!s) return '';
  s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}‍⃣™ℹ↔-↪]/gu, '');
  s = s.replace(/[“”‘’`]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}
const id = (t) => crypto.createHash('md5').update(cleanKey(t), 'utf8').digest('hex').slice(0, 12);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function synth(text) {
  const voice = /[฀-๿]/.test(text) ? 'th-TH-PremwadeeNeural' : 'en-US-JennyNeural';
  const output = path.join(OUT, `${id(text)}.mp3`);
  for (let i = 1; i <= 4; i++) {
    try {
      await new Promise((resolve, reject) => {
        const child = spawn('python', ['-m', 'edge_tts', '--voice', voice, '--text', text, '--write-media', output], { stdio: 'pipe' });
        let error = '';
        child.stderr.on('data', (chunk) => { error += chunk; });
        child.on('error', reject);
        child.on('close', (code) => code === 0 ? resolve() : reject(new Error(error || `edge-tts exited ${code}`)));
      });
      const buf = fs.readFileSync(output);
      if (buf.length < 500) throw new Error('too small');
      return buf;
    } catch (e) {
      if (i === 4) throw e;
      await sleep(600 * i);
    }
  }
}

// Every Thai string literal in the sources — the quiz questions, their four options and
// explanations, the typing phrases, the click-target labels, the dialog copy.
const strings = new Set();
for (const src of SOURCES) {
  const code = fs.readFileSync(src, 'utf8');
  for (const t of literalStrings(code)) {
    const c = cleanKey(t);
    if (c && c.length <= MAX_LEN) strings.add(c);
  }
  // English typing-bank entries are also used by <Speaker>, but have no Thai
  // characters and would otherwise be missed by the Thai literal scan above.
  for (const m of code.matchAll(/text:\s*'((?:[^'\\]|\\.)*)'/g)) {
    const c = cleanKey(m[1].replace(/\\'/g, "'"));
    if (c && c.length <= MAX_LEN) strings.add(c);
  }
}

// These are the only dynamic competition values currently passed to <Speaker>:
// typing targets, scam prompts/explanations, and the three scam classifications.
const competitionCode = fs.readFileSync(COMPETE_CONTENT, 'utf8');
for (const sectionStart of ['export const TYPING_BANK', 'export const SCAM_QUIZ_BANK']) {
  const start = competitionCode.indexOf(sectionStart);
  const end = competitionCode.indexOf('\n];', start);
  const section = competitionCode.slice(start, end + 3);
  for (const t of literalStrings(section)) {
    const c = cleanKey(t);
    if (c && c.length <= MAX_LEN) strings.add(c);
  }
  for (const m of section.matchAll(/text:\s*'((?:[^'\\]|\\.)*)'/g)) {
    const c = cleanKey(m[1].replace(/\\'/g, "'"));
    if (c && c.length <= MAX_LEN) strings.add(c);
  }
}
for (const label of ['ปลอดภัย', 'หลอกลวง', 'อันตราย']) strings.add(label);

fs.mkdirSync(OUT, { recursive: true });
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
const edgeProgress = fs.existsSync(EDGE_PROGRESS) ? JSON.parse(fs.readFileSync(EDGE_PROGRESS, 'utf8')) : {};
const dry = process.argv.includes('--dry');

const todo = [...strings].filter((t) => REFRESH ? !edgeProgress[t] : !manifest[t] || !fs.existsSync(path.join(OUT, id(t) + '.mp3')));
console.log(`${strings.size} speakable strings · ${todo.length} to record`);
if (dry) { todo.forEach((t) => console.log('  ✗ ' + t)); process.exit(0); }

let added = 0, bytes = 0;
const failed = [];
for (const text of todo) {
  try {
    const buf = await synth(text);
    fs.writeFileSync(path.join(OUT, id(text) + '.mp3'), buf);
    manifest[text] = `/audio/${id(text)}.mp3`;
    edgeProgress[text] = true;
    fs.writeFileSync(EDGE_PROGRESS, JSON.stringify(edgeProgress), 'utf8');
    added++; bytes += buf.length;
    if (added % 25 === 0) console.log(`   …${added}/${todo.length}`);
    await sleep(120);
  } catch (e) {
    failed.push(`${text}  (${e.message})`);
  }
}

// Keep every string the app can say in the manifest, even ones recorded on an earlier run.
for (const t of strings) if (!manifest[t] && fs.existsSync(path.join(OUT, id(t) + '.mp3'))) manifest[t] = `/audio/${id(t)}.mp3`;
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0), 'utf8');

console.log(`✔ recorded ${added} clips (+${(bytes / 1048576).toFixed(2)} MB) · manifest has ${Object.keys(manifest).length} entries`);
failed.forEach((f) => console.log('   ✗ FAILED: ' + f));
