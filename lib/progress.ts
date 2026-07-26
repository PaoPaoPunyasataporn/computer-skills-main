// Progress lives entirely in localStorage. There are no accounts: every child
// plays anonymously and their stars are kept on the device they play on. The
// only thing that ever leaves the browser is a name, once, when they clear the
// final boss fight (see /api/certify).

export type ProgressEntry = { stars: number; correct: number; total: number };

const PROGRESS_KEY = 'cs_progress';

export function getProgressMap(): Record<string, ProgressEntry> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
}

export function saveProgress(_areaNum: number, code: string, stars: number, correct: number, total: number) {
  if (typeof window === 'undefined') return;
  try {
    const map = getProgressMap();
    const prev = map[code]?.stars || 0;
    map[code] = { stars: Math.max(prev, stars), correct, total };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch {}
}

// Stars earned across a set of games (sum), for showing progress on the menu.
export function areaStars(codes: string[]): number {
  const map = getProgressMap();
  return codes.reduce((s, c) => s + (map[c]?.stars || 0), 0);
}
