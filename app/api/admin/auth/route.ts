import { NextRequest, NextResponse } from 'next/server';
import { checkBotId } from 'botid/server';
import { checkAdminPassword, writeSession } from '@/lib/auth';
import { rateLimit, clientKey, isBlocked, recordFailure, clearFailures } from '@/lib/ratelimit';

// Admin sign-in with the single shared ADMIN_PASSWORD. On success we set the
// signed admin session cookie.
export async function POST(req: NextRequest) {
  // layout.tsx declares this route protected client-side, but that's inert on
  // its own -- the actual block only happens here, server-side. No-ops locally.
  const bot = await checkBotId();
  if (bot.isBot) return NextResponse.json({ ok: false, error: 'ยืนยันไม่สำเร็จ' }, { status: 403 });

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
  try {
    await writeSession();
  } catch (e) {
    // SESSION_SECRET missing/too short — surface this as a real error instead of
    // an unhandled 500/HTML page that breaks the client's r.json() parse.
    console.error('admin auth: writeSession failed:', e);
    return NextResponse.json({ ok: false, error: 'ตั้งค่าเซิร์ฟเวอร์ไม่ครบ (SESSION_SECRET)' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
