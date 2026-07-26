// Prepend a "getting started" basics area (num 0) to lib/content.ts (idempotent).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cp = path.join(ROOT, 'lib', 'content.ts');
const src = fs.readFileSync(cp, 'utf8');
const m = src.match(/export const AREAS: Area\[\] = (\[[\s\S]*?\]);\s*\nexport const areaByNum/);
if (!m) { console.error('cannot extract AREAS'); process.exit(1); }
const AREAS = JSON.parse(m[1]);

const BASICS = {
  num: 0, mascot: '🖥️',
  title: 'พื้นฐานคอมพิวเตอร์',
  sub: 'รู้จักเครื่อง ใช้เมาส์ และแป้นพิมพ์ ก่อนเริ่มบทอื่น',
  chapters: [
    { code: 'b1', ai: false, icon: '🖥️', th: 'รู้จักคอมพิวเตอร์', desc: 'ส่วนต่าง ๆ ของเครื่อง', slides: [
      { type: 'explain', tag: 'พื้นฐาน · ส่วนต่าง ๆ', icon: '🖥️', title: 'คอมพิวเตอร์มีหลายส่วน', body: 'คอมพิวเตอร์มีจอภาพ เมาส์ แป้นพิมพ์ และตัวเครื่อง 🖥️', say: 'คอมพิวเตอร์มีหลายส่วน คอมพิวเตอร์มีจอภาพ เมาส์ แป้นพิมพ์ และตัวเครื่อง' },
      { type: 'explain', tag: 'พื้นฐาน · จอภาพ', icon: '🖥️', title: 'จอภาพไว้ดูภาพ', body: 'จอภาพคือหน้าจอที่เรามองเห็นภาพและตัวหนังสือ', say: 'จอภาพไว้ดูภาพ จอภาพคือหน้าจอที่เรามองเห็นภาพและตัวหนังสือ' },
      { type: 'quiz', icon: '👀', q: 'ส่วนไหนที่เราใช้มองเห็นภาพ?', opts: [
        { icon: '🖥️', label: 'จอภาพ', correct: true, fb: 'ถูกต้อง! จอภาพไว้มองเห็นภาพ' },
        { icon: '🖱️', label: 'เมาส์', correct: false, fb: 'เมาส์ไว้ชี้และคลิกนะ' },
        { icon: '⌨️', label: 'แป้นพิมพ์', correct: false, fb: 'แป้นพิมพ์ไว้พิมพ์ตัวอักษร' } ] },
      { type: 'explain', tag: 'พื้นฐาน · เมาส์และแป้นพิมพ์', icon: '🖱️', title: 'เมาส์และแป้นพิมพ์', body: 'เมาส์ไว้ชี้และคลิก 🖱️ แป้นพิมพ์ไว้พิมพ์ตัวอักษร ⌨️', say: 'เมาส์และแป้นพิมพ์ เมาส์ไว้ชี้และคลิก แป้นพิมพ์ไว้พิมพ์ตัวอักษร' },
      { type: 'quiz', icon: '⌨️', q: 'อยากพิมพ์ตัวอักษร ใช้อะไร?', opts: [
        { icon: '⌨️', label: 'แป้นพิมพ์', correct: true, fb: 'เยี่ยม! แป้นพิมพ์ไว้พิมพ์ตัวอักษร' },
        { icon: '🖥️', label: 'จอภาพ', correct: false, fb: 'จอภาพไว้ดูภาพนะ' },
        { icon: '🔊', label: 'ลำโพง', correct: false, fb: 'ลำโพงไว้ฟังเสียง' } ] } ] },
    { code: 'b2', ai: false, icon: '🖱️', th: 'การใช้เมาส์', desc: 'ชี้ คลิก ดับเบิลคลิก และลาก', slides: [
      { type: 'explain', tag: 'พื้นฐาน · เมาส์', icon: '🖱️', title: 'เมาส์ไว้ชี้และเลือก', body: 'เลื่อนเมาส์ ลูกศรบนจอก็ขยับตาม 🖱️', say: 'เมาส์ไว้ชี้และเลือก เลื่อนเมาส์ ลูกศรบนจอก็ขยับตาม' },
      { type: 'explain', tag: 'พื้นฐาน · คลิกซ้าย', icon: '👆', title: 'คลิกซ้ายเพื่อเลือก', body: 'กดปุ่มซ้ายของเมาส์หนึ่งครั้ง เพื่อเลือกสิ่งของ', say: 'คลิกซ้ายเพื่อเลือก กดปุ่มซ้ายของเมาส์หนึ่งครั้ง เพื่อเลือกสิ่งของ' },
      { type: 'quiz', icon: '🖱️', q: 'อยากเลือกไอคอน ทำอย่างไร?', opts: [
        { icon: '👆', label: 'คลิกปุ่มซ้ายหนึ่งครั้ง', correct: true, fb: 'ถูกต้อง! คลิกซ้ายเพื่อเลือก' },
        { icon: '✊', label: 'ทุบเมาส์แรง ๆ', correct: false, fb: 'อย่าทุบนะ แค่คลิกเบา ๆ ก็พอ' } ] },
      { type: 'explain', tag: 'พื้นฐาน · ดับเบิลคลิกและลาก', icon: '⚡', title: 'ดับเบิลคลิกและลาก', body: 'ดับเบิลคลิกคือกดซ้ายเร็ว ๆ สองที เพื่อเปิด ⚡ ลากคือกดค้างแล้วเลื่อน ✊', say: 'ดับเบิลคลิกและลาก ดับเบิลคลิกคือกดซ้ายเร็ว ๆ สองที เพื่อเปิด ลากคือกดค้างแล้วเลื่อน' },
      { type: 'quiz', icon: '⚡', q: 'ดับเบิลคลิกคืออะไร?', opts: [
        { icon: '⚡', label: 'กดปุ่มซ้ายเร็ว ๆ สองที', correct: true, fb: 'เยี่ยม! ดับเบิลคลิกเปิดของได้' },
        { icon: '👉', label: 'กดปุ่มขวาหนึ่งที', correct: false, fb: 'อันนั้นคือคลิกขวานะ' },
        { icon: '😴', label: 'ไม่ต้องกดเลย', correct: false, fb: 'ต้องกดซ้ายสองทีเร็ว ๆ นะ' } ] } ] },
    { code: 'b3', ai: false, icon: '⌨️', th: 'การใช้แป้นพิมพ์', desc: 'พิมพ์ตัวอักษรและปุ่มสำคัญ', slides: [
      { type: 'explain', tag: 'พื้นฐาน · แป้นพิมพ์', icon: '⌨️', title: 'แป้นพิมพ์ไว้พิมพ์ตัวอักษร', body: 'กดปุ่มตัวอักษร ตัวหนังสือก็ขึ้นบนจอ ⌨️', say: 'แป้นพิมพ์ไว้พิมพ์ตัวอักษร กดปุ่มตัวอักษร ตัวหนังสือก็ขึ้นบนจอ' },
      { type: 'explain', tag: 'พื้นฐาน · ปุ่มสำคัญ', icon: '🔠', title: 'ปุ่มเว้นวรรคและปุ่มลบ', body: 'ปุ่มเว้นวรรคเว้นช่องว่างระหว่างคำ ปุ่มลบไว้ลบตัวที่พิมพ์ผิด', say: 'ปุ่มเว้นวรรคและปุ่มลบ ปุ่มเว้นวรรคเว้นช่องว่างระหว่างคำ ปุ่มลบไว้ลบตัวที่พิมพ์ผิด' },
      { type: 'quiz', icon: '🔙', q: 'พิมพ์ผิด อยากลบตัวอักษร ใช้ปุ่มไหน?', opts: [
        { icon: '🔙', label: 'ปุ่มลบ', correct: true, fb: 'ถูกต้อง! ปุ่มลบ ลบตัวที่พิมพ์ผิดได้' },
        { icon: '⬜', label: 'ปุ่มเว้นวรรค', correct: false, fb: 'อันนั้นไว้เว้นช่องว่างนะ' } ] },
      { type: 'explain', tag: 'พื้นฐาน · ปุ่มเอ็นเทอร์', icon: '↩️', title: 'ปุ่มเอ็นเทอร์', body: 'ปุ่มเอ็นเทอร์ไว้ขึ้นบรรทัดใหม่ หรือยืนยัน ↩️', say: 'ปุ่มเอ็นเทอร์ ปุ่มเอ็นเทอร์ไว้ขึ้นบรรทัดใหม่ หรือยืนยัน' },
      { type: 'quiz', icon: '⬜', q: 'อยากเว้นช่องว่างระหว่างคำ ใช้ปุ่มไหน?', opts: [
        { icon: '⬜', label: 'ปุ่มเว้นวรรค', correct: true, fb: 'เยี่ยม! ปุ่มเว้นวรรคเว้นช่องว่างได้' },
        { icon: '🔙', label: 'ปุ่มลบ', correct: false, fb: 'อันนั้นไว้ลบตัวอักษรนะ' } ] } ] },
  ],
};

if (AREAS.some((a) => a.num === 0)) { console.log('basics already present — nothing to do'); process.exit(0); }
AREAS.unshift(BASICS);

const header = `// AUTO-GENERATED / hand-expanded — DigComp 3.0 lesson content (source of truth). Area 0 = getting-started basics.
export type Opt = { icon: string; label: string; correct: boolean; fb: string };
export type Slide = { type: 'explain' | 'quiz'; tag?: string; icon?: string; title?: string; body?: string; html?: string; say?: string; q?: string; opts?: Opt[] };
export type Chapter = { code: string; ai: boolean; icon: string; th: string; desc: string; slides: Slide[] };
export type Area = { num: number; mascot: string; title: string; sub: string; chapters: Chapter[] };
export const AREAS: Area[] = ${JSON.stringify(AREAS, null, 2)};
export const DIGCOMP_AREAS = AREAS.filter(a => a.num >= 1);
export const areaByNum = (n: number) => AREAS.find(a => a.num === n);
`;
fs.writeFileSync(cp, header);
console.log('prepended basics. areas:', AREAS.map((a) => `${a.num}:${a.chapters.length}ch`).join(' '));
