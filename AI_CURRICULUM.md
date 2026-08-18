# หลักสูตร AI · AI Literacy Curriculum
### (Experience AI Edition — adapted for Thai youth learners)

Structured on **Experience AI** (Raspberry Pi Foundation × Google DeepMind — [experience-ai.org](https://experience-ai.org)), the closest structural match to this course: designed for **11–14 year olds** as a comprehensive introductory AI course, already localized in 19+ languages across 38 countries, with **offline-friendly activity variants** (built for their Kenya deployment) that fit this project's no-internet-assumption deployment. Their lesson structure is lifted here and the interactive parts are re-implemented natively as self-contained HTML games on the existing engine (`public/games/_lib/dlf-ai-engine.js`, `dlf` read-aloud).

**Secondary reference:** MIT **Day of AI** ([dayofai.org](https://dayofai.org)) — its chatbots/bias/productive-use unit for ages 12+ overlaps directly with the chatbot lessons and follows the same UNESCO framework.

**Framework mapping target:** the **UNESCO AI Competency Framework for Students** (2024) — the same move as the digital-literacy course's DigComp mapping, so both courses have parallel, citable competency backbones. UNESCO's four competency aspects:

| Aspect | คำอธิบาย |
|---|---|
| **A. Human-centred mindset** | มนุษย์เป็นผู้ตัดสินใจ AI เป็นเครื่องมือ — agency, ไม่พึ่งพาเกินไป |
| **B. Ethics of AI** | ความยุติธรรม อคติ ความเป็นส่วนตัว ความรับผิดชอบ |
| **C. AI techniques & applications** | AI/ML ทำงานอย่างไร ใช้เครื่องมือ AI เป็น |
| **D. AI system design** | ออกแบบ/ประเมินระบบ AI ครบวงจร (ระดับเริ่มต้น: กำหนดปัญหา ข้อมูล ทดสอบ) |

A full citation list for every external fact/framework used while writing lesson content and designing hands-on exercises lives in [`public/games/SOURCES.md`](public/games/SOURCES.md).

---

## โครงหลักสูตร · 5 modules, 12 lessons

The course is grouped into **5 modules** (`lib/content.ts`, area 6, `AREAS[6].modules`). Opening a module in the app shows its lesson list; opening a lesson runs the **5-part lesson format** below. Every lesson file lives at `public/games/ai<N>-<name>.html`.

### The 5-part lesson format (every lesson, no exceptions)

A persistent process strip at the top of each lesson shows 4 always-visible chips — the 5th part ("immediate feedback") happens live inside hands-on rather than as its own screen, so it shares a chip with hands-on:

1. **Hook** — one line + one big visual icon framing a real, relatable situation (never a multi-paragraph intro).
2. **Concept** — 1–2 slide cards max, at least one with a small looping CSS/SVG animation illustrating the idea (token-by-token reveal, confidence meter, biased-data bar chart, etc.).
3. **Hands-on core (+ immediate feedback)** — the actual skill practice, 8–15 minutes of content. Every lesson pairs a multiple-choice/recognition phase with at least one other interaction type (drag-and-drop, tap-to-match, tap-to-order, typed free response, or a multi-stage builder) — never plain MC alone. Feedback (correct/wrong + why) appears inline after every action, not deferred.
4. **Reflection** — one open-ended prompt + textarea, no wrong answers, connecting the lesson to the learner's own future AI use.
5. **Stars/completion** — `window.dlfStars` (1–3, from mistake count), read by the app's `GameOverlay` component.

### Module 1 · 🤖 รากฐาน AI (Foundations)

| Lesson | ไฟล์ | สอนอะไร | งานฝึกลงมือทำ (hands-on tasks) |
|---|---|---|---|
| AI คืออะไร และทำงานอย่างไร | `ai0-ai-foundations.html` | Token-by-token prediction; hallucination = confident ≠ correct | Drag-and-drop true/false sort (13 statements) → tap-to-pair term-matching (6 AI vocab terms ↔ definitions) |
| ครูฝึก AI | `ai6-model-trainer.html` | Label → train → test loop; garbage-in/garbage-out; fairness | Drag-and-drop image labeling + test → tap-to-flag bad data + retrain + test → 3 MC "why did it fail" scenarios + retrain → MC "which dataset is fairest" |
| นักสืบอคติ AI | `ai7-bias-detective.html` | Unbalanced training data → biased predictions | 4 full cases (fruit-sorter, face-recognition gate, voice assistant, photo "well-lit face" filter), each: observe → inspect data table → MC "why" → fix (MC or click-repeat data-balancing widget) → animated retrain → fairness comparison |

### Module 2 · 🤝 ทำงานร่วมกับ AI (Working with AI)

| Lesson | ไฟล์ | สอนอะไร | งานฝึกลงมือทำ |
|---|---|---|---|
| นักสำรวจหน้าจอ AI | `ai1-ui-inspector.html` | Chat-UI anatomy; what "token" means | Coach-guided real interactions on a mock chat UI (send/stop/copy/switch-model/history/clear) → tap-to-order token exercise → 6-question MC quiz on UI elements |
| ช่างซ่อมคำสั่ง AI | `ai2-prompt-fixer.html` | Role + task + format = a good instruction | 5-round MC "spot the better prompt" warm-up → 6 rounds retyping a vague prompt into a good one, live-validated against role/task/format |
| นักตรวจสอบคำตอบ AI (Discernment) | `ai10-discernment.html` | Verifying AI claims before trusting them | 16 scenarios: tap the suspicious phrase in the AI's answer → classify (trust/check-first/wrong) via drag-to-sort → free-text round writing your own fake AI claim |
| นักใช้ AI อย่างมีความรับผิดชอบ (Diligence) | `ai11-diligence.html` | When AI use is fine / needs disclosure / not allowed | 16 scenarios, drag-to-sort into 3 zones → 3 typed-disclosure exercises ("ฉันใช้ AI ช่วย...") |

### Module 3 · 💎 ออกแบบพฤติกรรม AI (Shaping AI behavior)

| Lesson | ไฟล์ | สอนอะไร | งานฝึกลงมือทำ |
|---|---|---|---|
| สถาปนิกติวเตอร์ AI ของฉัน | `ai4-gem-architect.html` | Persona + rule design (forbid + instead) | 5-round MC warm-up (recognize good rules) → chat-style rule builder → 5 simulated-student test rounds with pass/fail |
| นักทดลองแซนด์บ็อกซ์ AI | `ai5-sandbox-master.html` | Creativity/role settings change AI output | Free-exploration chat sandbox (creativity slider, 6 roles, 6 prompt cards) → 5-question MC checkpoint predicting output style |

### Module 4 · 🌏 AI ในชีวิตจริง (Real-world application)

| Lesson | ไฟล์ | สอนอะไร | งานฝึกลงมือทำ |
|---|---|---|---|
| เรียนรู้เรื่องใหม่กับ AI | `ai3-learn-with-ai.html` | Using AI chat to learn a subject | Pick 4 of 6 topics; each = live chat interaction + questions mixing MC, fill-in-blank, drag-to-match, and step-ordering |
| AI รอบตัวเรา | `ai8-ai-in-the-world.html` | Where AI hides in daily apps; safe vs risky use | 5-round MC (AI vs non-AI) → 8-pair tap-to-match (system ↔ likely training data) → 10-scenario drag-to-sort (ปลอดภัย/ต้องระวัง) |

### Module 5 · 🏆 ภารกิจสุดท้าย (Synthesis)

| Lesson | ไฟล์ | สอนอะไร | งานฝึกลงมือทำ |
|---|---|---|---|
| ภารกิจนักออกแบบ AI | `ai9-ai-quest.html` | Design an AI system end-to-end | 7-stage capstone builder: goal (MC) → dataset choice → train/retest animation → generalization-testing (MC) → bias check (MC) → transparency (multiselect) → responsible-use launch |

**Arc logic (why this order):**
1. **Module 1 — แนวคิด:** AI คืออะไร → เรียนจากข้อมูลอย่างไร (เด็กเป็น "ครู" ฝึกโมเดลเอง) → ข้อมูลเอียงทำให้ AI ลำเอียง
2. **Module 2 — ทักษะทำงานร่วมกับ AI:** จอแชทจริง, prompting, ตรวจสอบก่อนเชื่อ, ใช้อย่างรับผิดชอบ
3. **Module 3 — ออกแบบพฤติกรรม:** ตั้งกฎให้ AI ผู้ช่วยของตัวเอง, ทดลองพารามิเตอร์
4. **Module 4 — โลกจริง:** ใช้ AI ช่วยเรียน, AI ซ่อนอยู่ที่ไหนบ้าง, ประโยชน์/ความเสี่ยง
5. **Module 5 — สังเคราะห์:** ออกแบบระบบ AI เองครบทุกขั้น (ปัญหา → ข้อมูล → ฝึก → ทดสอบ/ตรวจอคติ → โปร่งใส → ใช้อย่างรับผิดชอบ)

---

## การนำไปใช้ · Deployment notes

- **Offline-first:** ทุกบทเรียนเป็นไฟล์ HTML เดี่ยว ไม่เรียก API ภายนอก (แชท AI ในเกมเป็นการจำลองแบบกำหนดผลลัพธ์ไว้)
- **เสียงอ่าน:** ทุกข้อความผ่าน `dlf.speak` — MP3 ที่อัดไว้ล่วงหน้า (Edge TTS), ครบทั้ง 12 บทเรียน 0 missing ณ ตอนนี้ — รัน `node scripts/gen-audio.mjs <filename-stem>` หลังแก้ข้อความใดๆ เพื่อเติมคลิปใหม่
- **การให้ดาว/XP:** เกมตั้ง `window.dlfStars`, หน้า `/ai` บันทึกผ่าน `saveProgress` ใน `lib/progress.ts`
- **โมดูล/บทเรียน UI:** `app/ai/page.tsx` แสดงการ์ดโมดูล 5 ใบ → คลิกแล้วดูรายการบทเรียนในโมดูลนั้น → คลิกบทเรียนเปิดผ่าน `GameOverlay` เหมือนเกมอื่นในแพลตฟอร์ม, สถานะโมดูลที่เปิดอยู่เก็บใน URL query (`?m=<key>`) เพื่อให้ปุ่ม back ของเบราว์เซอร์ใช้งานได้

## ที่มาและเวอร์ชันก่อนหน้า · Provenance

- เวอร์ชันแรกของเอกสารนี้ (ดู git history) ร่างโครง 15 หน่วยจาก **AI Class ASEAN** (ASEAN Foundation × Google.org) — ไม่ได้สร้างจริง ถูกแทนที่ด้วยโครง Experience AI เพราะตรงกับกลุ่มอายุ รูปแบบบทเรียน และบริบท offline มากกว่า
- โครงสร้าง 10 โมดูลเดิม (เรียงตาม Experience AI lesson arc โดยตรง) ถูกจัดกลุ่มใหม่เป็น 5 โมดูล + เพิ่ม 2 บทเรียนใหม่ (Discernment, Diligence) เข้า Module 2 — ดูรายละเอียดที่มาของเนื้อหาแต่ละบทเรียนที่ `public/games/SOURCES.md`

## งานถัดไป · Next steps (not yet built)

- [ ] เพิ่มคำถาม AI ลงบอสไฟท์สุดท้าย (`final-bossfight.html`) ให้ครอบคลุมโมดูลใหม่ หรือแยก AI bossfight + ใบประกาศ AI Literacy ต่างหาก
- [ ] แปลบทเรียนเป็นอังกฤษคู่ขนาน (โครง Experience AI มี localization playbook อ้างอิงได้)
- [ ] ตาราง mapping ละเอียดราย competency ของ UNESCO framework (ระดับ Understand/Apply/Create) สำหรับเอกสารขอทุน/โรงเรียน
