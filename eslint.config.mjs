import next from 'eslint-config-next/core-web-vitals';

// Flat config (ESLint 9). `next/core-web-vitals` already bundles `next/typescript`.
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      // Self-contained games and the stale duplicate copies of them: plain browser
      // scripts, not part of the Next build.
      'public/**',
      'bossfight/**',
    ],
  },
  ...next,
];

export default config;
