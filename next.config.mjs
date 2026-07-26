import { withBotId } from 'botid/next/config';

/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Non-breaking CSP: blocks framing/plugins/base-uri injection without
  // restricting scripts/styles (the games use inline styles/scripts).
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

// The mini-games are embedded in a same-origin fullscreen overlay (<iframe>), so
// framing must be allowed for /games/* only. Everything else stays DENY. Next.js
// applies later matching rules last, so these override the global framing headers.
const gameFrameHeaders = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/games/:path*', headers: gameFrameHeaders },
    ];
  },
};

export default withBotId(nextConfig);
