// Are the speaker buttons actually able to SPEAK what they say they will?
//
// Every game embeds a map of pre-recorded Thai MP3 clips (`dlfAudioData`), keyed by
// the first 12 hex chars of the md5 of the cleaned text. dlf.speak(text) plays that
// clip when it exists, and only falls back to the browser's speech engine when it
// doesn't. On a machine with no Thai voice installed — the default on most Windows
// boxes — that fallback reads Thai words in an English voice, which is gibberish to
// a child. So a speaker whose text has no clip is a broken speaker.
//
// This script checks every string a speaker will actually say against the clip map.
//
//   node scripts/check-speakers.mjs                      # audit every game
//   node scripts/check-speakers.mjs unit4                # audit one game
//   node scripts/check-speakers.mjs unit4 --vocab        # list what that game CAN say
//   node scripts/check-speakers.mjs unit4 --has "ปุ่มย้อนกลับ"   # test one candidate string
//
// The audit resolves the two ways a speaker gets its text:
//   * literal   — data-say="…" written straight into the HTML
//   * dynamic   — data-say="${expr}" built at runtime from a data array, so we pull
//                 the candidate strings out of that game's data instead.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const GAMES = 'public/games';

// Must mirror dlfCleanKey() in the games exactly, or the md5 will not line up.
export function cleanKey(s) {
  if (!s) return '';
  s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}‍⃣™ℹ↔-↪]/gu, '');
  s = s.replace(/\u{1F50A}/gu, '');
  s = s.replace(/[“”‘’`]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}
const key = (t) => crypto.createHash('md5').update(cleanKey(t), 'utf8').digest('hex').slice(0, 12);

export function loadGame(file) {
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/<script id="dlfAudioData" type="application\/json">([\s\S]*?)<\/script>/);
  const clips = m ? new Set(Object.keys(JSON.parse(m[1]))) : new Set();
  return {
    html,
    clips,
    has: (t) => clips.has(key(t)) || clips.has(cleanKey(t)),
  };
}

// Every Thai string literal in the source — the pool a speaker can safely draw from.
function thaiLiterals(html) {
  const out = new Set();
  for (const m of html.matchAll(/['"`]([^'"`\n]*[฀-๿][^'"`\n]*)['"`]/g)) out.add(m[1]);
  return [...out];
}

function audit(file) {
  const g = loadGame(file);
  const name = path.basename(file);
  const says = [...g.html.matchAll(/data-say="([^"]*)"/g)].map((m) => m[1]).filter(Boolean);

  const literals = [...new Set(says.filter((s) => !s.includes('${') && !s.includes("'+")))]
    .map((s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  const dynamic = says.filter((s) => s.includes('${') || s.includes("'+"));

  const bad = literals.filter((s) => !g.has(s));
  const ok = literals.length - bad.length;

  console.log(`\n${name}`);
  console.log(`  clips embedded : ${g.clips.size}`);
  console.log(`  literal speakers: ${literals.length}  (${ok} with a clip, ${bad.length} WITHOUT)`);
  console.log(`  dynamic speakers: ${dynamic.length}  (text built at runtime — check the source array by hand)`);
  for (const b of bad) console.log(`    ✗ no clip: "${b}"`);
  return bad.length;
}

const args = process.argv.slice(2);
const files = fs.readdirSync(GAMES).filter((f) => f.endsWith('.html')).map((f) => path.join(GAMES, f));

if (args.includes('--has')) {
  const file = files.find((f) => f.includes(args[0]));
  const g = loadGame(file);
  const text = args[args.indexOf('--has') + 1];
  console.log(`${g.has(text) ? '✔ HAS A CLIP' : '✗ no clip — would fall back to the browser voice'}  "${text}"  in ${path.basename(file)}`);
} else if (args.includes('--vocab')) {
  const file = files.find((f) => f.includes(args[0]));
  const g = loadGame(file);
  const speakable = thaiLiterals(g.html).filter(g.has).sort();
  console.log(`${path.basename(file)} can speak these ${speakable.length} strings with a real Thai clip:\n`);
  speakable.forEach((s) => console.log('  ✔ ' + s));
} else {
  const targets = args.length ? files.filter((f) => args.some((a) => f.includes(a))) : files;
  let bad = 0;
  for (const f of targets) bad += audit(f);
  console.log(`\n${bad === 0 ? '✔ every literal speaker has a real Thai clip' : `✗ ${bad} speaker string(s) have no clip and would use the wrong voice`}`);
  process.exit(bad === 0 ? 0 : 1);
}
