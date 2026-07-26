// Merge expanded area chapters (scratchpad/areaN.raw, authored by subagents) into lib/content.ts.
// Keeps area 1 as-is; replaces chapters for areas 2-5 from the .raw files. Validates strictly.
// Usage: node scripts/assemble-content.mjs <rawDir>
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RAW_DIR = process.argv[2];
if (!RAW_DIR) { console.error('pass rawDir'); process.exit(1); }

const contentPath = path.join(ROOT, 'lib', 'content.ts');
const src = fs.readFileSync(contentPath, 'utf8');
const m = src.match(/export const AREAS: Area\[\] = (\[[\s\S]*?\]);\s*\nexport const areaByNum/);
if (!m) { console.error('cannot extract AREAS'); process.exit(1); }
const AREAS = JSON.parse(m[1]);

function extractJson(raw) {
  // strip code fences / prose; take from first [ to last ]
  const a = raw.indexOf('[');
  const b = raw.lastIndexOf(']');
  if (a < 0 || b < 0) throw new Error('no JSON array found');
  return JSON.parse(raw.slice(a, b + 1));
}

const errors = [];
function validateChapters(areaNum, chapters, expectCodes) {
  if (!Array.isArray(chapters)) { errors.push(`area${areaNum}: not an array`); return false; }
  const codes = chapters.map((c) => c.code);
  if (JSON.stringify(codes) !== JSON.stringify(expectCodes))
    errors.push(`area${areaNum}: codes ${codes.join(',')} != expected ${expectCodes.join(',')}`);
  for (const c of chapters) {
    if (!c.code || !c.icon || !c.th || !c.desc || !Array.isArray(c.slides)) { errors.push(`area${areaNum} ${c.code}: missing keys`); continue; }
    if (c.slides.length < 4) errors.push(`area${areaNum} ${c.code}: only ${c.slides.length} slides`);
    let quiz = 0;
    for (const s of c.slides) {
      if (s.type === 'explain') {
        if (!s.title || !s.body || !s.say) errors.push(`area${areaNum} ${c.code}: explain missing title/body/say`);
        if (/[A-Za-z]{3,}/.test(s.say) && /AI/.test(s.say)) errors.push(`area${areaNum} ${c.code}: say contains raw "AI" (use เอไอ)`);
      } else if (s.type === 'quiz') {
        quiz++;
        if (!s.q || !Array.isArray(s.opts) || s.opts.length < 2) { errors.push(`area${areaNum} ${c.code}: bad quiz`); continue; }
        const corr = s.opts.filter((o) => o.correct === true).length;
        if (corr !== 1) errors.push(`area${areaNum} ${c.code}: quiz has ${corr} correct (need 1)`);
        for (const o of s.opts) if (o.icon === undefined || o.label === undefined || o.correct === undefined || o.fb === undefined) errors.push(`area${areaNum} ${c.code}: opt missing field`);
      } else errors.push(`area${areaNum} ${c.code}: unknown slide type ${s.type}`);
    }
    if (quiz < 1) errors.push(`area${areaNum} ${c.code}: no quiz`);
    if (!/[฀-๿]/.test(JSON.stringify(c.slides))) errors.push(`area${areaNum} ${c.code}: no Thai text`);
  }
  return true;
}

const EXPECT = {
  2: ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6'],
  3: ['3.1', '3.2', '3.3', '3.4'],
  4: ['4.1', '4.2', '4.3', '4.4'],
  5: ['5.1', '5.2', '5.3', '5.4'],
};

for (const num of [2, 3, 4, 5]) {
  const f = path.join(RAW_DIR, `area${num}.raw`);
  if (!fs.existsSync(f)) { errors.push(`area${num}: ${f} missing`); continue; }
  let chapters;
  try { chapters = extractJson(fs.readFileSync(f, 'utf8')); }
  catch (e) { errors.push(`area${num}: parse failed — ${e.message}`); continue; }
  validateChapters(num, chapters, EXPECT[num]);
  // keep existing area meta (num/mascot/title/sub), swap chapters
  const area = AREAS.find((a) => a.num === num);
  area.chapters = chapters;
}

if (errors.length) {
  console.log('VALIDATION ERRORS:');
  errors.forEach((e) => console.log('  ✗', e));
  console.log('\nNOT writing content.ts. Fix the flagged area(s).');
  process.exit(2);
}

const header = `// AUTO-GENERATED / hand-expanded — DigComp 3.0 lesson content (source of truth).
export type Opt = { icon: string; label: string; correct: boolean; fb: string };
export type Slide = { type: 'explain' | 'quiz'; tag?: string; icon?: string; title?: string; body?: string; html?: string; say?: string; q?: string; opts?: Opt[] };
export type Chapter = { code: string; ai: boolean; icon: string; th: string; desc: string; slides: Slide[] };
export type Area = { num: number; mascot: string; title: string; sub: string; chapters: Chapter[] };
export const AREAS: Area[] = ${JSON.stringify(AREAS, null, 2)};
export const areaByNum = (n: number) => AREAS.find(a => a.num === n);
`;
fs.writeFileSync(contentPath, header);
const stats = AREAS.map((a) => `area${a.num}:${a.chapters.length}ch/${a.chapters.reduce((s, c) => s + c.slides.length, 0)}sl`).join('  ');
console.log('✓ content.ts written.', stats);
console.log('total competences:', AREAS.reduce((s, a) => s + a.chapters.length, 0), '· total slides:', AREAS.reduce((s, a) => s + a.chapters.reduce((n, c) => n + c.slides.length, 0), 0));
