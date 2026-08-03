import { NextRequest, NextResponse } from 'next/server';
import { addCertification } from '@/lib/cert-db';
import { rateLimit, clientKey } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

// A child cleared the final boss fight and typed their name. Record it (with
// their score, if the game reported one) so the operator can see who passed. No
// auth: this is the one public write, and it only ever appends a row. When
// DATABASE_URL is unset the insert no-ops and we still return ok, so the
// certificate shows either way.
//
// Deliberately NOT BotID-protected: tested and found that BotID's client-side
// wrapper can leave this fetch permanently pending (no response, no error) in
// some automated/edge-case browser contexts. This is the reward moment for a
// child who just finished the whole course -- an indefinite hang here is a far
// worse failure than the (already-present) IP rate limit below being the only
// spam guard.
export async function POST(req: NextRequest) {
  if (!rateLimit(`certify:${clientKey(req)}`, 30, 60_000))
    return NextResponse.json({ ok: false, error: 'ลองบ่อยเกินไป รอสักครู่' }, { status: 429 });

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }
  const b = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const name = String(b.name ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);

  // Score is an optional percent 0-100. Anything else (missing/invalid) => null.
  let score: number | null = null;
  const n = Math.round(Number(b.score));
  if (Number.isFinite(n)) score = Math.max(0, Math.min(100, n));

  if (!name) return NextResponse.json({ ok: false, error: 'กรอกชื่อ' }, { status: 400 });

  try {
    const id = await addCertification(name, score);
    return NextResponse.json({ ok: true, id, name, score });
  } catch (e) {
    console.error('certify POST failed:', e);
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}
