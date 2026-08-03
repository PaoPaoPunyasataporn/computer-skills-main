import { initBotId } from 'botid/client/core';

// Vercel BotID — invisible bot protection on admin sign-in (brute-force).
// certify and compete were both protected here too, but testing found
// BotID's client wrapper can leave those fetches permanently pending (no
// response, no error) in some browser contexts -- reproduced on both
// endpoints. Both are public write endpoints a child hits mid-game/at the
// finish line, where a hang is worse than the existing IP rate limits being
// the only spam guard, so both were dropped from BotID protection. Paths
// previously listed here (/api/student/login, /api/teacher/register) don't
// exist in this app -- this app has no student/teacher accounts at all.
initBotId({
  protect: [
    { path: '/api/admin/auth', method: 'POST' },
  ],
});
