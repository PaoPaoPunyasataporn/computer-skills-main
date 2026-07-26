// DigComp 3.0 areas — game-only. Each category contains its playable mini-games
// (self-contained HTML served from /public/games). Progress is tracked per game
// code (up to 3 stars each), the same way across the whole app.
export type Game = { code: string; icon: string; th: string; desc: string; file: string };
export type Area = { num: number; mascot: string; title: string; sub: string; games: Game[] };

export const AREAS: Area[] = [
  {
    num: 0, mascot: '🖥️', title: 'พื้นฐานคอมพิวเตอร์', sub: 'รู้จักเครื่อง ใช้เมาส์ และแป้นพิมพ์',
    games: [
      { code: 'g-explorer', icon: '🖥️', th: 'สำรวจคอมพิวเตอร์', desc: 'รู้จักส่วนต่าง ๆ ของเครื่อง', file: '/games/unit1-computer-explorer.html' },
      { code: 'g-click', icon: '🖱️', th: 'ฝึกคลิกเมาส์', desc: 'ฝึกชี้และคลิกให้แม่นยำ', file: '/games/unit2-click-accuracy-trainer.html' },
      { code: 'g-keyboard', icon: '⌨️', th: 'ฝึกใช้แป้นพิมพ์', desc: 'พิมพ์ตัวอักษรและปุ่มสำคัญ', file: '/games/unit3-keyboard-master.html' },
    ],
  },
  {
    num: 1, mascot: '🔎', title: 'การค้นหา ประเมิน และจัดการข้อมูล', sub: 'ค้นหาสิ่งที่อยากรู้ และดูว่าอะไรจริงอะไรหลอก',
    games: [
      { code: 'g-browser', icon: '🌐', th: 'ผจญภัยในเบราว์เซอร์', desc: 'ค้นหาและท่องเว็บอย่างเก่ง', file: '/games/unit4-browser-quest.html' },
    ],
  },
  {
    num: 2, mascot: '💬', title: 'การสื่อสารและการทำงานร่วมกัน', sub: 'คุย แบ่งปัน และทำงานร่วมกับคนอื่นอย่างสุภาพและปลอดภัย',
    games: [
      { code: 'g-message', icon: '📧', th: 'ฝึกใช้อีเมล', desc: 'สร้างบัญชี เข้าสู่ระบบ อ่าน ตอบกลับ ส่งอีเมล และระวังฟิชชิง', file: '/games/unit7-message-master.html' },
    ],
  },
  {
    num: 3, mascot: '🎨', title: 'การสร้างเนื้อหาดิจิทัล', sub: 'สร้างงานบนคอมพิวเตอร์ และใช้ของผู้อื่นอย่างถูกต้อง',
    games: [
      { code: 'g-creator', icon: '🎨', th: 'สตูดิโอสร้างสรรค์', desc: 'สร้างผลงานทีละขั้น ใช้ AI และอ้างอิงอย่างถูกต้อง', file: '/games/unit8-creator-studio.html' },
    ],
  },
  {
    num: 4, mascot: '🛡️', title: 'ความปลอดภัย ความเป็นอยู่ที่ดี และการใช้อย่างรับผิดชอบ', sub: 'ดูแลเครื่อง ข้อมูลส่วนตัว สุขภาพ และสิ่งแวดล้อม',
    games: [
      { code: 'g-safety', icon: '🛡️', th: 'โล่ป้องกันภัยไซเบอร์', desc: 'ระวังภัยและใช้เน็ตอย่างปลอดภัย', file: '/games/unit5-safety-shield.html' },
    ],
  },
  {
    num: 5, mascot: '🧩', title: 'การระบุปัญหาและการแก้ปัญหา', sub: 'แก้ปัญหาเครื่อง เลือกเครื่องมือ และคิดสิ่งใหม่ ๆ',
    games: [
      { code: 'g-itdoctor', icon: '🔧', th: 'หมอไอที', desc: 'แก้ปัญหาเครื่องและเลือกเครื่องมือให้ถูก', file: '/games/unit9-it-doctor.html' },
    ],
  },
];

// Capstone challenge shown on the home page — tests skills from every area.
export const FINAL_BOSS: Game = { code: 'g-boss', icon: '🏆', th: 'บอสไฟท์สุดท้าย', desc: 'ทดสอบทักษะคอมพิวเตอร์ทุกด้านในด่านเดียว', file: '/games/final-bossfight.html' };

// Every game code (area games + final boss) — for totals/progress math.
export const ALL_GAME_CODES: string[] = [...AREAS.flatMap((a) => a.games.map((g) => g.code)), FINAL_BOSS.code];

export const DIGCOMP_AREAS = AREAS.filter((a) => a.num >= 1);
export const areaByNum = (n: number) => AREAS.find((a) => a.num === n);
