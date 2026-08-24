# Sources — AI course content

This file lists the external, verifiable sources consulted while writing the "concept" teaching
content and designing the hands-on exercises for the AI literacy modules (`ai01`–`ai13`). No text
was copied verbatim from any source — all lesson copy is original, written in Thai, for a
different (younger, game-based) audience. Sources were used only to ground facts and to take
structural/pedagogical inspiration for hands-on exercise design, per the credit noted next to
each entry.

## Curriculum frameworks (used to check topic coverage and sequencing)

- **AI4K12 Initiative — "Five Big Ideas in AI"** (Perception, Representation & Reasoning,
  Learning, Natural Interaction, Societal Impact). https://ai4k12.org/artificial-intelligence-thinking-in-k-12/
  — Used to confirm `ai01` (foundations), `ai02` (learning from data), `ai12` (societal impact)
  cover the right big-idea categories for a K-12 audience.

- **UNESCO — "AI competency framework for students"** (2024). Four dimensions: human-centered
  mindset, ethics of AI, AI techniques & applications, AI system design; three progression
  levels (Understand / Apply / Create). https://www.unesco.org/en/articles/ai-competency-framework-students
  — Used to ground the "Discernment" (`ai06`) and "Diligence" (`ai07`) lessons' ethics/agency
  framing, and to check the overall course progresses Understand → Apply → Create across its
  4 modules.

- **Raspberry Pi Foundation × Google DeepMind — "Experience AI"** curriculum (ages 11–14).
  https://www.raspberrypi.org/blog/a-teachers-guide-to-teaching-experience-ai-lessons/ and
  https://experience-ai.org/en/units/foundations-of-ai/lessons/3
  — This course's original module sequence (AI foundations → train a model → bias in data →
  applications → design challenge) is the direct structural ancestor of this platform's `ai01`
  through `ai13` sequence (documented in the AI Literacy Curriculum Google Doc — see
  `AI_CURRICULUM.md` for the link). Re-confirmed this session as still the right shape. Its
  train-your-own-classifier bias lesson (apples/tomatoes, a face-recognition demo trained mostly
  on blonde hair) inspired the "flawed dataset → biased predictions" hands-on beat in
  `ai02-model-trainer.html` and `ai03-bias-detective.html`.

- **Elements of AI** (University of Helsinki / MinnaLearn), free public course.
  https://www.elementsofai.com/ — Used as a second reference point for what a plain-language,
  no-code introduction to ML concepts (training data, classifiers, naïve Bayes-style
  probability reasoning) looks like when aimed at total beginners; informed the plain-Thai
  phrasing used in `ai01`'s and `ai02`'s concept slides.

## Specific facts used in "concept" teaching content

- **Why language models hallucinate** — OpenAI research: "Why language models hallucinate"
  (2025), https://openai.com/index/why-language-models-hallucinate/ and the accompanying paper
  https://arxiv.org/pdf/2509.04664 — key facts used in `ai01-foundations.html` and
  `ai06-discernment.html`'s concept steps: (1) models generate text token-by-token as a
  probabilistic guess, not a factual lookup; (2) training only ever shows examples of fluent
  language, never explicit "this claim is false" labels, so the model has no direct signal to
  learn "I don't know"; (3) benchmarks that score only correctness (not confidence) reward
  confident guessing over admitting uncertainty — this is why a wrong AI answer can still sound
  completely sure of itself. Used to write the "AI มั่นใจได้ ทั้งที่ผิด" concept card in `ai06`.

- **Google Teachable Machine** — how browser-based model training actually works (collect
  labeled examples → train → test on new input). https://teachablemachine.withgoogle.com/ and
  overview at https://www.geeksforgeeks.org/machine-learning/machine-learning-model-with-teachable-machine/
  — Used as the real-world reference for the "label data → train → test on something new"
  three-step structure used in `ai02-model-trainer.html`'s hands-on core (this is the same loop
  Teachable Machine walks a learner through, just re-implemented as a click-based mini-game
  instead of live webcam capture, since this platform targets younger kids without camera
  permission flows).

- **Prompt engineering — role / task / format structure** — Anthropic's own published guidance,
  https://claude.com/blog/best-practices-for-prompt-engineering, and OpenAI's prompt-engineering
  best practices, https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-the-openai-api
  — Used to ground `ai05-prompt-fixer.html`'s "a good instruction needs a role, a task, and a
  format" concept card, and `ai09-gem-architect.html`'s "persona + rule" framing (role/persona
  prompting anchors a model's behavior — the same idea reframed as "designing your AI tutor's
  personality and rules").

- **Academic integrity & AI-use disclosure norms** — Carnegie Mellon University Eberly Center's
  example academic-integrity-and-generative-AI policies,
  https://www.cmu.edu/teaching/technology/aitools/academicintegrity/index.html, and Vanderbilt
  University's generative-AI academic integrity guidance,
  https://www.vanderbilt.edu/generative-ai/academic-integrity/ — both converge on: (1) disclose
  when and how an AI tool was used, (2) the student remains responsible for verifying AI output
  before submitting it, (3) submitting AI-generated work as entirely one's own, when the
  assignment required independent work, is treated as an integrity violation. Used directly to
  write `ai07-diligence.html`'s three concept points and its `ROUNDS` scenario judgments
  (ok / must-disclose / not-allowed).

- **Usain Bolt's 100m world record** — 9.58 seconds (Berlin, 2009), World Athletics official
  record. https://worldathletics.org/news/news/bolt-again-958-world-record-in-berlin-updat —
  used as the real value behind a "wrong" round added to `ai06-discernment.html`'s hands-on
  core, where the AI answer states a fabricated faster time (8.72s) that no human has ever run.

## Note on scope

This list covers the sources actually consulted this session while upgrading the AI course's
"concept" step content and citing factual claims. It does not re-list the earlier Experience AI
/ UNESCO mapping work already documented in the AI Literacy Curriculum Google Doc (linked from
`AI_CURRICULUM.md`) — see that document for the full curriculum design rationale.

## Note on file naming

Lesson files were renamed from creation order (`ai0`, `ai1`, `ai2`, ... in the order they were
built) to learning order (`ai01`–`ai13`, matching the module/lesson sequence a learner actually
progresses through) — see the AI Literacy Curriculum Google Doc's module tables for the current
mapping of lesson name → file → module.
