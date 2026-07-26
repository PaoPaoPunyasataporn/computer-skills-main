import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPassword, writeSession } from '@/lib/auth';
import { rateLimit, clientKey, isBlocked, recordFailure, clearFailures } from '@/lib/ratelimit';

// Admin sign-in with the single shared ADMIN_PASSWORD. On success we set the
// signed admin session cookie.
export async function POST(req: NextRequest) {
  if (!rateLimit(`aauth:${clientKey(req)}`, 20, 60_000))
    return NextResponse.json({ ok: false, error: 'ลองบ่อยเกินไป รอสักครู่' }, { status: 429 });

  // Throttle wrong guesses hard — there is only one password to protect.
  const key = `aacct:${clientKey(req)}`;
  if (isBlocked(key, 10, 300_000))
    return NextResponse.json({ ok: false, error: 'ลองผิดหลายครั้งเกินไป รอสักครู่' }, { status: 429 });

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }
  const b = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const password = String(b.password ?? '');

  if (!checkAdminPassword(password)) {
    recordFailure(key);
    return NextResponse.json({ ok: false, error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }

  clearFailures(key);
  await writeSession();
  return NextResponse.json({ ok: true });
}
