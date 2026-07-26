// Minimal auth for the admin dashboard: a single shared password (ADMIN_PASSWORD)
// unlocks an HMAC-signed session cookie. No auth vendor, no user accounts, no
// database rows — everything here is node:crypto.
//
// Route handlers run on the Node.js runtime by default, so these APIs are
// available. Do NOT import this from middleware (Edge runtime) or a Client
// Component.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'cs_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('SESSION_SECRET missing or too short (need 16+ chars)');
  return s;
}

// ---------- admin password ----------
// Constant-time compare of the submitted password against ADMIN_PASSWORD.
export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false; // no password configured => admin locked
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ---------- sessions ----------
// A session is just a signed expiry stamp — there is only one role (admin).
export type Session = { exp: number };

const b64 = (b: Buffer) => b.toString('base64url');

function sign(data: string): string {
  return b64(createHmac('sha256', secret()).update(data).digest());
}

export function signSession(): string {
  const payload: Session = { exp: Math.floor(Date.now() / 1000) + MAX_AGE };
  const body = b64(Buffer.from(JSON.stringify(payload)));
  return `${body}.${sign(body)}`;
}

export function verifySession(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expect = Buffer.from(sign(body));
  const got = Buffer.from(sig);
  if (expect.length !== got.length || !timingSafeEqual(expect, got)) return null;

  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session;
    if (!s.exp || s.exp < Math.floor(Date.now() / 1000)) return null;
    return s;
  } catch {
    return null;
  }
}

// ---------- cookie helpers (server-side only) ----------
export async function readSession(): Promise<Session | null> {
  const jar = await cookies();
  return verifySession(jar.get(COOKIE)?.value);
}

export async function writeSession() {
  const jar = await cookies();
  jar.set(COOKIE, signSession(), {
    httpOnly: true,                                  // JS can't read it -> no XSS token theft
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

// Guard: the caller must be a signed-in admin.
export async function requireAdmin(): Promise<boolean> {
  return (await readSession()) !== null;
}
