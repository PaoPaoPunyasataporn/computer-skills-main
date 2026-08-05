// Short celebratory sound effects (as opposed to lib/speak.ts, which is spoken
// Thai). Currently just the applause clip played on: clearing the final boss
// fight, and finishing any game/module (every completed game currently awards
// a flat 3 stars — see saveProgress() call sites).

const CLIP = '/audio/applause.wav';
const PLAY_MS = 3000;
const FADE_MS = 600;   // fades out over the last 600ms of the 3s window

export function playApplause() {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio(CLIP);
    audio.volume = 1;
    audio.play().catch(() => { /* autoplay blocked or file missing — ignore */ });

    const fadeStart = PLAY_MS - FADE_MS;
    const fadeTimer = setTimeout(() => {
      const step = 30;
      const steps = FADE_MS / step;
      let i = 0;
      const iv = setInterval(() => {
        i++;
        audio.volume = Math.max(0, 1 - i / steps);
        if (i >= steps) clearInterval(iv);
      }, step);
    }, fadeStart);

    const stopTimer = setTimeout(() => {
      try { audio.pause(); } catch { /* ignore */ }
    }, PLAY_MS);

    audio.addEventListener('ended', () => { clearTimeout(fadeTimer); clearTimeout(stopTimer); }, { once: true });
  } catch { /* ignore */ }
}
