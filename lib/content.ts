// DigComp 3.0 areas — game-only. Each category contains its playable mini-games
// (self-contained HTML served from /public/games). Progress is tracked per game
// code (up to 3 stars each), the same way across the whole app.
export type Game = { code: string; icon: string; th: string; desc: string; file: string };
// A Module groups several lessons (still `Game`s under the hood — same file format,
// same progress/stars tracking) under one skill area. Opening a module shows its
// lesson list; opening a lesson runs it through the 5-step flow and ends in stars.
// Only the AI course (area 6) uses this; every other area keeps the flat `games` list.
export type Module = { key: string; icon: string; title: string; sub: string; games: Game[] };
export type Area = { num: number; mascot: string; title: string; sub: string; games?: Game[]; modules?: Module[] };

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
      { code: 'g-citizen', icon: '💬', th: 'พลเมืองดิจิทัล', desc: 'มารยาทออนไลน์ ขออนุญาตก่อนโพสต์ ดูแลตัวตนดิจิทัล และทำงานกลุ่มออนไลน์ให้ราบรื่น', file: '/games/unit6-digital-citizen.html' },
    ],
  },
  {
    num: 3, mascot: '🔐', title: 'การสร้างเนื้อหาและดูแลบัญชีดิจิทัล', sub: 'สมัครบัญชีของตัวเอง สร้างผลงานของตัวเอง และใช้ผลงานคนอื่นอย่างถูกต้อง',
    games: [
      { code: 'g-google-account', icon: '🔐', th: 'สร้างบัญชี Google', desc: 'สมัครบัญชี Google ทีละขั้นตอน ตั้งรหัสผ่านที่ปลอดภัย', file: '/games/unit3-google-account.html' },
      { code: 'g-creator', icon: '🖼️', th: 'ลิขสิทธิ์และผลงานของฉัน', desc: 'รู้ว่าภาพ เพลง และข้อความอะไรใช้ได้ ให้เครดิตอย่างไร เขียนด้วยคำของตัวเอง และสร้างผลงานใหม่', file: '/games/unit8-creator-rights.html' },
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
  {
    // Not a DigComp area -- the full AI literacy course, Module 0-9.
    // Structured on the Experience AI foundation arc (Raspberry Pi Foundation
    // × Google DeepMind): what AI is → how ML learns from data → bias in data
    // → generative AI tools & prompting → applying AI → applied challenge.
    // Each lesson has the child DO something (order, match, assemble, spot the problem)
    // rather than only pick from a multiple-choice list.
    num: 6, mascot: '🤖', title: 'ทักษะ AI เพื่ออนาคต', sub: 'จาก AI คืออะไร ไปจนถึงใช้งาน AI อย่างมีวิจารณญาณและรับผิดชอบ — 3 โมดูล 9 บทเรียน',
    modules: [
      {
        key: 'm1-foundations', icon: '🤖', title: 'รากฐาน AI', sub: 'AI คืออะไร เรียนรู้จากข้อมูลยังไง ทำไมบางทีถึงลำเอียง และ AI ซ่อนอยู่ที่ไหนในชีวิตจริง',
        games: [
          { code: 'g-ai-foundations', icon: '🤖', th: 'AI คืออะไร และทำงานอย่างไร', desc: 'พื้นฐาน AI คืออะไร เรียนรู้ยังไง และทำไมบางทีถึงตอบผิด', file: '/games/ai01-foundations.html' },
          { code: 'g-modeltrainer', icon: '🧑‍🏫', th: 'ครูฝึก AI', desc: 'เป็นครูสอน AI เอง ติดป้ายข้อมูล ฝึกโมเดล และดูว่าข้อมูลดีทำให้ AI เก่งยังไง', file: '/games/ai02-model-trainer.html' },
          { code: 'g-biasdetective', icon: '🕵️', th: 'นักสืบอคติ AI', desc: 'สืบหาสาเหตุที่ AI ลำเอียง แล้วแก้ข้อมูลให้ยุติธรรมกับทุกคน', file: '/games/ai03-bias-detective.html' },
          { code: 'g-aiworld', icon: '🌏', th: 'AI รอบตัวเรา', desc: 'AI ซ่อนอยู่ที่ไหนบ้างในชีวิตจริง ช่วยอะไรได้ และต้องระวังอะไร รวม 30 ข้อ มีทั้งจับคู่ ตัดสินสถานการณ์ และเปรียบเทียบของจริงกับ AI (คลิป/ภาพ/บทความ)', file: '/games/ai12-ai-in-the-world.html' },
        ],
      },
      {
        key: 'm2-collab', icon: '🤝', title: 'ทำงานร่วมกับ AI', sub: 'สั่งงาน AI ให้ชัดเจน ตรวจสอบก่อนเชื่อ และรู้ว่างานไหนควรใช้ AI',
        games: [
          { code: 'g-ui-inspector', icon: '🖥️', th: 'แชต AI: รู้จักปุ่ม และเขียนคำสั่งให้ชัด', desc: 'รู้จักปุ่มต่าง ๆ บนแชต AI เขียนคำสั่งให้ครบ 3 ส่วน (ใคร/ทำอะไร/ตอบแบบไหน) และบอกฉากกับแสงเมื่อสั่งสร้างภาพ', file: '/games/ai04-ui-inspector.html' },
          { code: 'g-discernment', icon: '🔍', th: 'นักตรวจสอบคำตอบ AI', desc: 'อ่านคำตอบของ AI อย่างเท่าทัน จับจุดที่ผิด มั่นใจเกินจริง หรือลำเอียง ก่อนเชื่อ', file: '/games/ai06-discernment.html' },
          { code: 'g-diligence', icon: '🧾', th: 'ใช้ AI อย่างรับผิดชอบ', desc: 'รู้ว่างานไหนควรให้ AI ช่วย ต้องบอกใครว่าใช้ AI และเช็กก่อนพิมพ์ว่าข้อมูลไหนปลอดภัย ควรถามผู้ใหญ่ หรือไม่ควรพิมพ์', file: '/games/ai07-diligence.html' },
        ],
      },
      {
        key: 'm3-shaping', icon: '💎', title: 'ออกแบบพฤติกรรม AI แล้วใช้เรียนรู้', sub: 'ตั้งกฎให้ AI ผู้ช่วยของตัวเอง ปรับโทนให้เหมาะกับงาน แล้วใช้ AI ติวเตอร์ที่ออกแบบเองช่วยเรียนรู้เรื่องใหม่จริง ๆ',
        games: [
          { code: 'g-gemarchitect', icon: '💎', th: 'ออกแบบผู้ช่วย AI ของฉัน', desc: 'เรียนรู้การตั้งชื่อ บทบาท และกฎให้ผู้ช่วย AI และการแนบเอกสารให้ตอบจากเอกสาร แล้วลองสร้างผู้ช่วยตัวจริงในเครื่องมือ', file: '/games/ai09-gem-architect.html' },
          { code: 'g-learnwithai', icon: '🎓', th: 'ใช้ AI เป็นเครื่องมือเรียน', desc: 'ใช้ AI ช่วยเตรียมสอบ 4 แบบ: สรุป ทำการ์ดคำศัพท์ ออกโจทย์ฝึก และให้สอนแนวคิด พร้อมรู้ว่าต้องตรวจอะไรก่อนเชื่อ', file: '/games/ai11-learn-with-ai.html' },
        ],
      },
    ],
  },
];

// Capstone challenge shown on the home page — tests skills from every area.
export const FINAL_BOSS: Game = { code: 'g-boss', icon: '🏆', th: 'บอสไฟท์สุดท้าย', desc: 'ทดสอบทักษะคอมพิวเตอร์ทุกด้านในด่านเดียว', file: '/games/final-bossfight.html' };

// Every game code (area games + final boss) — for totals/progress math.
// Areas may hold a flat `games` list or `modules` (each holding its own `games` list).
export const ALL_GAME_CODES: string[] = [
  ...AREAS.flatMap((a) => (a.games ?? a.modules?.flatMap((m) => m.games) ?? []).map((g) => g.code)),
  FINAL_BOSS.code,
];

export const DIGCOMP_AREAS = AREAS.filter((a) => a.num >= 1);
export const areaByNum = (n: number) => AREAS.find((a) => a.num === n);
