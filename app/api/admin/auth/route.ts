import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPassword, writeSession } from '@/lib/auth';
import { checkBotId } from 'botid/server';
import { rateLimit, clientKey, isBlocked, recordFailure, clearFailures } from '@/lib/ratelimit';

// Admin sign-in with the single shared ADMIN_PASSWORD. On success we set the
// signed admin session cookie.
export async function POST(req: NextRequest) {
  if (!rateLimit(`aauth:${clientKey(req)}`, 20, 60_000))
    return NextResponse.json({ ok: false, error: 'ลองบ่อยเกินไป รอสักครู่' }, { status: 429 });

  // Vercel BotID, enforced server-side (the client script alone only tags requests).
  // If the check itself errors we fall through to the rate limits rather than lock the teacher out.
  try {
    const v = await checkBotId();
    if (v.isBot) return NextResponse.json({ ok: false, error: 'ไม่สามารถตรวจสอบได้ ลองใหม่อีกครั้ง' }, { status: 403 });
  } catch (e) { console.error('admin auth: botid check failed:', e); }

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
    await new Promise((r) => setTimeout(r, 700));   // slow every wrong guess, even across serverless instances
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
