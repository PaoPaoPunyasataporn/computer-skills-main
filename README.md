# ทักษะคอมพิวเตอร์ · Computer Skills (DigComp 3.0)

บทเรียนคอมพิวเตอร์เชิงโต้ตอบภาษาไทย มีเสียงอ่านทุกข้อความ ทำงานบนเว็บเบราว์เซอร์ทุกอุปกรณ์ ไม่ต้องดาวน์โหลด

Interactive Thai computer-literacy lessons with read-aloud on every line. Runs in any browser — no download. Mapped to the EU **DigComp 3.0** framework (JRC, 2025): all **5 areas · 21 competences**, at the **Basic** proficiency level.

**🔗 เริ่มเรียนที่นี่ / Start here:** https://paopaopunyasataporn.github.io/computer-skills/

---

## โครงสร้าง · Structure

**เริ่มต้น: พื้นฐานการใช้เครื่อง / Getting started (prerequisites)**

| บทเรียน | Unit | ไฟล์ |
|---|---|---|
| สำรวจคอมพิวเตอร์ | Computer Explorer | `unit1-computer-explorer.html` |
| ฝึกคลิกเมาส์ | Click Trainer | `unit2-click-accuracy-trainer.html` |
| ฝึกพิมพ์แป้นพิมพ์ | Keyboard Master | `unit3-keyboard-master.html` |

**5 ด้าน DigComp 3.0 / The five DigComp 3.0 areas**

| ด้าน | ชื่อ | สมรรถนะ | ไฟล์ |
|---|---|---|---|
| 1 | การค้นหา ประเมิน และจัดการข้อมูล | 1.1–1.3 | `area1-information.html` |
| 2 | การสื่อสารและการทำงานร่วมกัน | 2.1–2.6 | `area2-communication.html` |
| 3 | การสร้างเนื้อหาดิจิทัล | 3.1–3.4 | `area3-content.html` |
| 4 | ความปลอดภัย ความเป็นอยู่ที่ดี และการใช้อย่างรับผิดชอบ | 4.1–4.4 | `area4-safety.html` |
| 5 | การระบุปัญหาและการแก้ปัญหา | 5.1–5.4 | `area5-problem.html` |

AI literacy is threaded through the competences (badged **AI** on 1.2, 2.1, 3.1, 4.2, 5.2, 5.3), per DigComp 3.0's transversal AI integration — not a separate unit.

---

## ไฟล์ร่วม · Shared assets

Each area app is data-only; the engine lives in `assets/`:

- `assets/styles.css` — theme + shared UI (the `dlf` accessibility layer).
- `assets/dlf.js` — read-aloud engine. Speaks Thai via the browser voice, and plays pre-generated MP3s when present.
- `assets/engine.js` — lesson engine (renders chapters/slides/quizzes from each page's `window.CHAPTERS`).

To add or edit a lesson, edit only the inline `window.CHAPTERS` array in an `areaN-*.html` file.

## เสียง · Audio (TTS)

Every spoken line calls `dlf.speak(text)`. If a matching MP3 exists in the page's `<script id="dlfAudioData">` map (keyed by `md5(text)[:12]`), it plays; otherwise the browser's Thai voice reads it. To add premium audio later, run the audio build over the Thai strings and fill each page's `dlfAudioData` map — no code changes needed.

---

พัฒนาโดย / Developed by **PaoPao Punyasataporn** · อ้างอิง DigComp 3.0 (European Commission, JRC, 2025)

© 2026 PaoPao Punyasataporn. All rights reserved.
