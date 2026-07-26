import { getProgressMap } from './progress';
import { AREAS } from './content';

// There was a second currency here — 💎 gems, minted at 5 per star and shown in the
// top bar. It was derived from exactly the same stars as the XP meter, so it measured
// nothing new and gave a child two numbers to track instead of one. Gone.
export type Stats = { stars: number; completed: number; xp: number; totalCompetences: number };

export function computeStats(): Stats {
  const map = getProgressMap();
  let stars = 0, completed = 0;
  for (const code of Object.keys(map)) {
    const e = map[code];
    stars += e.stars || 0;
    if ((e.stars || 0) > 0) completed++;
  }
  const totalCompetences = AREAS.reduce((s, a) => s + a.games.length, 0);
  return { stars, completed, xp: stars * 20, totalCompetences };
}

export function areaStarsFor(codes: string[]): number {
  const map = getProgressMap();
  return codes.reduce((s, c) => s + (map[c]?.stars || 0), 0);
}

// Records daily activity into `cs_daily`. Nothing reads it back right now — the daily-goal
// bar was dropped when the homepage banner changed — but it keeps accruing so the feature
// can be restored without losing history.
export function recordDaily(): void {
  if (typeof window === 'undefined') return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem('cs_daily');
    const d = raw ? JSON.parse(raw) : { day: '', done: 0 };
    if (d.day !== today) { d.day = today; d.done = 0; }
    d.done = (d.done || 0) + 1;
    localStorage.setItem('cs_daily', JSON.stringify(d));
  } catch {}
}
