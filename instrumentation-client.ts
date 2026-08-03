import { initBotId } from 'botid/client/core';

// Vercel BotID — invisible bot protection on the sensitive POST endpoints:
// admin sign-in (brute-force) and the two public write endpoints (certify,
// compete room creation) that would otherwise let a script spam fake
// certifications or flood the room table. Real browsers pass silently;
// automated clients are challenged. Paths previously listed here
// (/api/student/login, /api/teacher/register) don't exist in this app --
// this app has no student/teacher accounts at all.
initBotId({
  protect: [
    { path: '/api/admin/auth', method: 'POST' },
    { path: '/api/compete', method: 'POST' },
  ],
});
