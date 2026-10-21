// Best-effort in-memory sliding-window rate limiter. Persists across invocations
// on a warm serverless instance (resets on cold start; not shared across
// instances) — a throttle, not a hard guarantee. BotID also guards admin sign-in.
const hits = new Map<string, number[]>();

// Memory cap: drop the oldest keys (Map keeps insertion order) instead of wiping everything,
// so one burst of new IPs can't erase a password-guessing lockout.
function evict() {
  while (hits.size > 5000) {
    const first = hits.keys().next().value;
    if (first === undefined) break;
    hits.delete(first);
  }
}

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return false; }
  arr.push(now);
  hits.set(key, arr);
  evict();
  return true;
}

// Check a budget without spending it. Pair with recordFailure() to throttle only
// failed attempts, so a child who signs in and out repeatedly is never locked out
// while someone guessing passwords still is.
export function isBlocked(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  hits.set(key, arr);
  return arr.length >= max;
}

export function recordFailure(key: string) {
  const arr = hits.get(key) || [];
  arr.push(Date.now());
  hits.set(key, arr);
  evict();
}

// Clear a key's history — call on a successful login so honest users start fresh.
export function clearFailures(key: string) {
  hits.delete(key);
}

// The client's IP, as far as we can trust it.
//
// Do NOT read the FIRST entry of x-forwarded-for: that header is a client-supplied
// list which proxies append to, so its leftmost value is whatever the caller wrote.
// Rotating a fake value there would sidestep every rate limit here, including
// student-login brute-force protection.
//
// Vercel sets x-real-ip to the true peer address, so prefer it. Falling back to
// x-forwarded-for, take the LAST hop — written by the proxy nearest us, which a
// client cannot forge.
export function clientKey(req: Request): string {
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const hops = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return 'anon';
}
