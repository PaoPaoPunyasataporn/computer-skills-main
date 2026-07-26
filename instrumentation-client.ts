import { initBotId } from 'botid/client/core';

// Vercel BotID — invisible bot protection on the sensitive POST endpoints:
// student PIN login (brute-force) and admin sign-up. Real browsers pass
// silently; automated clients are challenged.
initBotId({
  protect: [
    { path: '/api/student/login', method: 'POST' },
    { path: '/api/teacher/register', method: 'POST' },
  ],
});
