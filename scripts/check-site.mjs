// One-command health check: node scripts/check-site.mjs  (npm run check)
// - every lesson file listed in lib/content.ts exists
// - every lesson has teacher-guide notes
// - lesson audio and app audio are fully recorded (0 missing)
// - TypeScript compiles
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

let failed = 0;
const fail = (m) => { failed++; console.log('  ✗ ' + m); };
const ok = (m) => console.log('  ✓ ' + m);

const content = readFileSync('lib/content.ts', 'utf8');
const files = [...content.matchAll(/file: '([^']+)'/g)].map((m) => m[1]);
const codes = [...content.matchAll(/code: '([^']+)'/g)].map((m) => m[1]);

console.log('Lessons');
const missingFiles = files.filter((f) => !existsSync('public' + f));
missingFiles.length ? missingFiles.forEach((f) => fail('missing file ' + f)) : ok(files.length + ' lesson files exist');

const guide = readFileSync('lib/teacher-guide.ts', 'utf8');
const noNotes = codes.filter((c) => !guide.includes(`'${c}'`));
noNotes.length ? noNotes.forEach((c) => fail('no teacher-guide notes for ' + c)) : ok('teacher guide covers every lesson');

function run(label, cmd, args, test) {
  console.log(label);
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' });
  const out = (r.stdout || '') + (r.stderr || '');
  const bad = test(out, r.status);
  bad ? fail(bad) : ok('ok');
  if (bad) console.log(out.split('\n').slice(-12).join('\n'));
}

run('Lesson audio', 'node', ['scripts/gen-audio.mjs', '--dry'], (out) => {
  const missing = [...out.matchAll(/(\d+) missing/g)].reduce((n, m) => n + Number(m[1]), 0);
  return missing ? missing + ' lesson string(s) have no recording' : '';
});
run('App audio', 'node', ['scripts/gen-audio-app.mjs', '--dry'], (out) => {
  const m = out.match(/(\d+) to record/);
  return m && Number(m[1]) ? m[1] + ' app string(s) have no recording' : '';
});
run('TypeScript', 'npx', ['tsc', '--noEmit'], (out, code) => (code ? 'tsc reported errors' : ''));

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
