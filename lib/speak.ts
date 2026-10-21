// Thai speech for the React side of the app (competition quiz options, the boss
// fight's "leave the test?" dialog).
//
// Most machines in a Thai classroom have NO Thai voice installed — Windows ships with
// English voices only unless someone adds the Thai language pack. Ask the browser to
// speak Thai on such a machine and it either stays silent or reads the words in an
// English accent, which is gibberish to a child. So the browser's speech engine cannot
// be the primary path.
//
// Instead we play pre-recorded Thai clips, exactly like the mini-games do:
//   scripts/gen-audio-app.mjs records every string this app can say into public/audio/
//   and writes a manifest mapping the text to its MP3.
//
// There is deliberately no browser-voice fallback: a string with no clip stays silent
// (with a console warning) until scripts/gen-audio-app.mjs is re-run.

// Must match cleanKey() in scripts/gen-audio-app.mjs, or the lookup will miss.
function cleanText(s: string): string {
  return s
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}‍⃣™ℹ↔-↪]/gu, '')
    .replace(/[“”‘’`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let manifest: Record<string, string> | null = null;
let loading: Promise<void> | null = null;
let current: HTMLAudioElement | null = null;

function loadManifest(): Promise<void> {
  if (manifest || typeof window === 'undefined') return Promise.resolve();
  loading ??= fetch('/audio/manifest.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((m) => { manifest = m; })
    .catch(() => { manifest = {}; });   // no manifest: clips are simply unavailable
  return loading;
}

// Warm the cache on first import so the first press doesn't wait on a fetch.
if (typeof window !== 'undefined') void loadManifest();

function stop() {
  if (current) { try { current.pause(); } catch { /* ignore */ } current = null; }
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
}

// No recording for this string: stay silent and say so in the console, rather than
// reading Thai in a wrong-accent English voice. Re-run scripts/gen-audio-app.mjs.
function missingClip(text: string) {
  console.warn('[speak] no recording for:', text);
}

export function speak(text: string) {
  if (typeof window === 'undefined' || !text) return;
  const key = cleanText(text);
  if (!key) return;

  stop();
  void loadManifest().then(() => {
    const src = manifest?.[key];
    if (src) {
      try {
        const a = new Audio(src);
        current = a;
        a.play().catch(() => missingClip(key));   // e.g. the file 404s
        return;
      } catch { /* fall through */ }
    }
    missingClip(key);
  });
}

// What can this browser actually do? Used by the /audio-check diagnostics page.
export function voiceReport(): { total: number; thai: string | null; names: string[]; clips: number } {
  const clips = manifest ? Object.keys(manifest).length : 0;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return { total: 0, thai: null, names: [], clips };
  const vs = window.speechSynthesis.getVoices();
  const th = vs.find((v) => v.lang?.toLowerCase().startsWith('th')) ?? vs.find((v) => /thai/i.test(v.name));
  return {
    total: vs.length,
    thai: th ? `${th.name} (${th.lang})` : null,
    names: vs.map((v) => `${v.name} — ${v.lang}`),
    clips,
  };
}
