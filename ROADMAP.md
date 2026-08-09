# Project Roadmap — ทักษะคอมพิวเตอร์ (Computer Skills / DigComp 3.0)

Plain-text, editable roadmap. Edit this file directly — check items off, move dates, add rows. No special format required, just markdown checkboxes and tables.

Last updated: 2026-08-09

---

## Status key

- ✅ Done
- 🚧 In progress
- 🔴 Known bug / broken
- ⬜ Not started

---

## 1. Now (this week)

The immediate punch-list — small, high-value, already scoped.

| Status | Task | Notes |
|---|---|---|
| ✅ | Certificate name/date alignment fixed | Pixel-measured against the real template |
| ✅ | Applause SFX on 3-star finish + boss-fight clear | Fires at the exact "⭐⭐⭐" moment, not on exit |
| ✅ | Confetti/cheer crash fixed (9 games) | Missing `cols` array threw on every 2-3 star finish |
| ✅ | Boss-fight audio migrated to Edge TTS | 270/270 clips confirmed |
| 🔴 | **Migrate remaining 14 games to Edge TTS** | Audit found ~1,774 clips across `unit1–9` and `ai0–5` still on the old Google TTS voice. Boss fight was the only one actually fixed. (The new `ai6–9` modules were recorded on Edge TTS from the start and are not affected.) |
| 🔴 | **Competition mode: race doesn't end when someone wins** | `lib/compete-store.ts` requires *all* players to finish before the room closes and shows the podium. Needs to end (and show podium) as soon as *one* player finishes. Diagnosed, not yet fixed. |

---

## 2. Next (this month)

Things worth doing once the punch-list above is clear.

| Status | Task | Notes |
|---|---|---|
| ⬜ | Re-audit all games post Edge-TTS migration | Confirm every clip in the cache, not just "0 missing" |
| ⬜ | Sweep other games for the same copy-paste bug class as `cols` | The engine is duplicated per-file; one bad copy-paste can be in others too |
| ⬜ | Decide star-scoring policy | Every game currently awards a flat 3 stars on any finish (even quitting early) — is that intentional long-term, or should stars reflect actual performance everywhere (some games already compute real stars internally)? |
| ⬜ | Update README | Currently references an old `area1–5.html` structure; actual games are `unit1–9` / `ai0–5` / `final-bossfight` |

---

## 3. Later (backlog, no fixed date)

Bigger or lower-urgency items — pull into "Next" when ready.

| Status | Task | Notes |
|---|---|---|
| ⬜ | Broader device/browser testing pass | Especially audio autoplay behavior on iOS Safari |
| ⬜ | Persist competition results server-side beyond room lifetime | Currently in-memory + Neon dual backend, no long-term history |
| ✅ | Expand AI literacy modules | Expanded 6 → 10 modules (2026-08-09) on the Experience AI six-lesson arc: new `ai6` train-a-model, `ai7` bias-in-data, `ai8` real-world AI, `ai9` design-an-AI capstone; course reordered concepts → tools → applied. See `AI_CURRICULUM.md` (now mapped to the UNESCO AI Competency Framework) |
| ⬜ | Extend `final-bossfight` to cover the new AI modules | Boss currently draws nothing from `ai6–9` (data/training, bias, real-world, design pipeline) — either add questions or build a separate AI bossfight + AI Literacy certificate |
| ⬜ | Accessibility pass on the boss fight's desktop-simulation screens | Confirm contrast/readability holds on all sub-screens, not just the ones already checked |

---

## How to use this file

- Flip `⬜` → `🚧` → `✅` as you go, or just delete rows once done.
- Add new rows anywhere; the three sections are priority buckets, not hard deadlines — move rows between them freely.
- Ask me to "update the roadmap" any time and I'll fold in whatever's changed since.
