# หลักสูตร AI · AI Literacy Curriculum
### (Experience AI Edition — adapted for Thai youth learners)

Structured on **Experience AI** (Raspberry Pi Foundation × Google DeepMind — [experience-ai.org](https://experience-ai.org)), the closest structural match to this course: designed for **11–14 year olds** as a comprehensive introductory AI course, already localized in 19+ languages across 38 countries, with **offline-friendly activity variants** (built for their Kenya deployment) that fit this project's no-internet-assumption deployment. Their lesson structure is lifted here and the interactive parts are re-implemented natively as self-contained HTML games on the existing engine (`public/games/_lib/dlf-ai-engine.js`, `dlf` read-aloud, teach-slides → game → stars unit structure) — no cloud tools required.

**Secondary reference:** MIT **Day of AI** ([dayofai.org](https://dayofai.org)) — its chatbots/bias/productive-use unit for ages 12+ overlaps directly with the chatbot modules (3–7) and follows the same UNESCO framework.

**Framework mapping target:** the **UNESCO AI Competency Framework for Students** (2024) — the same move as the digital-literacy course's DigComp mapping, so both courses have parallel, citable competency backbones. UNESCO's four competency aspects:

| Aspect | คำอธิบาย |
|---|---|
| **A. Human-centred mindset** | มนุษย์เป็นผู้ตัดสินใจ AI เป็นเครื่องมือ — agency, ไม่พึ่งพาเกินไป |
| **B. Ethics of AI** | ความยุติธรรม อคติ ความเป็นส่วนตัว ความรับผิดชอบ |
| **C. AI techniques & applications** | AI/ML ทำงานอย่างไร ใช้เครื่องมือ AI เป็น |
| **D. AI system design** | ออกแบบ/ประเมินระบบ AI ครบวงจร (ระดับเริ่มต้น: กำหนดปัญหา ข้อมูล ทดสอบ) |

---

## โครงหลักสูตร · The six-lesson arc → 10 modules

Experience AI's foundation arc: **What is AI → How machine learning works (data + models) → Bias in data → How AI creates (generative) → Real-world applications → Applied challenge.** The earlier version of this course covered only the generative-tools slice (lessons 4–5); modules 1, 2, 8, 9 add the conceptual layers underneath, so learners understand *why* the chatbot behaves the way it does, not just how to prompt it.

| # | โมดูล | ไฟล์ | Experience AI lesson | UNESCO aspect |
|---|---|---|---|---|
| 0 | 🤖 AI คืออะไร และทำงานอย่างไร | `ai0-ai-foundations.html` | **L1** What is AI | C (understand), A |
| 1 | 🧑‍🏫 ครูฝึก AI — ติดป้ายข้อมูล ฝึกโมเดล ทดสอบ | `ai6-model-trainer.html` | **L2** How ML works (data + models) | C (understand) |
| 2 | 🕵️ นักสืบอคติ AI — หาและแก้อคติในข้อมูลฝึก | `ai7-bias-detective.html` | **L3** Bias in data | B, C |
| 3 | 🖥️ นักสำรวจหน้าจอ AI — UI และ token | `ai1-ui-inspector.html` | **L4** How AI creates (generative) | C (apply) |
| 4 | 🧩 ช่างซ่อมคำสั่ง AI — prompting | `ai2-prompt-fixer.html` | **L4** How AI creates | C (apply) |
| 5 | 🎓 เรียนรู้เรื่องใหม่กับ AI — ใช้แชทช่วยเรียน | `ai3-learn-with-ai.html` | **L5** Applications | A, C (apply) |
| 6 | 💎 สถาปนิกติวเตอร์ AI — ออกแบบกฎ system prompt | `ai4-gem-architect.html` | **L5→L6** bridge | A, D |
| 7 | 🧪 นักทดลองแซนด์บ็อกซ์ AI — ปรับพารามิเตอร์/บทบาท | `ai5-sandbox-master.html` | **L5** Applications | C (apply) |
| 8 | 🌏 AI รอบตัวเรา — แอปจริง ข้อมูลฝึกจริง ประโยชน์และความเสี่ยง | `ai8-ai-in-the-world.html` | **L5** Real-world applications | A, B |
| 9 | 🏆 ภารกิจนักออกแบบ AI — ออกแบบ AI แยกขยะโรงเรียนครบวงจร | `ai9-ai-quest.html` | **L6** Applied challenge (AI Quests format) | D, A, B |

**Format per module:** intro → teach slides (4–5) → interactive game ที่บังคับใช้ทักษะจริง (ติดป้ายข้อมูลจริง แก้ชุดข้อมูลจริง เขียน prompt เอง) → ดาว 1–3 ดวงตามจำนวนครั้งที่ผิด ~10–20 นาทีต่อโมดูล รวม ~2.5–3.5 ชั่วโมง

**Arc logic (why this order):**
1. **แนวคิด (0–2):** AI คืออะไร → เรียนจากข้อมูลอย่างไร (เด็กเป็น "ครู" ฝึกโมเดลเอง) → ข้อมูลเอียงทำให้ AI ลำเอียง
2. **เครื่องมือ (3–7):** จอแชทจริง token prompting การใช้ช่วยเรียน การออกแบบกฎ การทดลองพารามิเตอร์
3. **โลกจริงและสังเคราะห์ (8–9):** AI ในชีวิตจริง ประโยชน์/ความเสี่ยง → ภารกิจออกแบบระบบ AI เองครบทุกขั้น (ปัญหา → ข้อมูล → ฝึก → ทดสอบ/ตรวจอคติ → ใช้อย่างรับผิดชอบ)

---

## การนำไปใช้ · Deployment notes

- **Offline-first:** ทุกโมดูลเป็นไฟล์ HTML เดี่ยว ไม่เรียก API ภายนอก (แชท AI ในเกมเป็นการจำลองแบบกำหนดผลลัพธ์ไว้) — ตรงกับแนวทาง offline-friendly ของ Experience AI ฉบับ localization
- **เสียงอ่าน:** ทุกข้อความผ่าน `dlf.speak` — MP3 ที่อัดไว้เล่นก่อน ถ้าไม่มีใช้เสียง Thai TTS ของเบราว์เซอร์ โมดูลใหม่ (1, 2, 8, 9) ยังไม่มีคลิปเสียง: รัน `node scripts/gen-audio-edge.mjs` (คุณภาพสูง ต้องมี `edge-tts`) หรือ `node scripts/gen-audio.mjs` เพื่อเติม `dlfAudioData` map ของแต่ละไฟล์
- **การให้ดาว/XP:** เหมือนทุกเกมในคอร์ส — เกมตั้ง `window.dlfStars`, หน้า `/ai` บันทึกผ่าน `saveProgress` ใน `lib/progress.ts`

## ที่มาและเวอร์ชันก่อนหน้า · Provenance

- เวอร์ชันแรกของเอกสารนี้ (ดู git history) ร่างโครง 15 หน่วยจาก **AI Class ASEAN** (ASEAN Foundation × Google.org) — ไม่ได้สร้างจริง ถูกแทนที่ด้วยโครง Experience AI เพราะตรงกับกลุ่มอายุ รูปแบบบทเรียน และบริบท offline มากกว่า เนื้อหาจริยธรรม/ความเป็นส่วนตัวจากร่างนั้นถูกหลอมรวมในโมดูล 2, 8, 9 แล้ว
- Experience AI lesson arc: What is AI → How ML works → Bias → How AI creates → Applications → Applied challenge (their Lesson 6 "AI Quests" gamified-challenge format คือแม่แบบของโมดูล 9)

## งานถัดไป · Next steps (not yet built)

- [ ] สร้างคลิปเสียงไทยสำหรับโมดูล 1, 2, 8, 9 (`gen-audio-edge.mjs`)
- [ ] เพิ่มคำถาม AI ลงบอสไฟท์สุดท้าย (`final-bossfight.html`) ให้ครอบคลุมโมดูลใหม่ หรือแยก AI bossfight + ใบประกาศ AI Literacy ต่างหาก
- [ ] แปลบทเรียนเป็นอังกฤษคู่ขนาน (โครง Experience AI มี localization playbook อ้างอิงได้)
- [ ] ตาราง mapping ละเอียดราย competency ของ UNESCO framework (ระดับ Understand/Apply/Create) สำหรับเอกสารขอทุน/โรงเรียน
