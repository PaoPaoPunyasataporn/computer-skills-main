import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, clientKey } from '@/lib/ratelimit';
import {
  createRoom, joinRoom, getState, startRace, reportProgress, leaveRoom, rematch,
  type Mode,
} from '@/lib/compete-store';

export const dynamic = 'force-dynamic';

// The competition area's only endpoint. Still no accounts — a nickname and a room
// code are all a child ever gives us, and none of it outlives the race.
//
//   GET  ?code=ABCD                       -> live room state (polled ~1/s while racing)
//   POST {action:'create'|'join'|'start'|'progress'|'leave'|'rematch', ...}

const MODES: Mode[] = ['typing', 'clicking', 'quiz'];

// Nicknames are shown to every other child in the room, so keep them short and
// drop control characters and angle brackets.
const UNSAFE_NAME_CHARS = new RegExp('[\\u0000-\\u001F\\u007F<>]', 'g');

function cleanName(v: unknown): string {
  return String(v ?? '').replace(UNSAFE_NAME_CHARS, '').trim().replace(/\s+/g, ' ').slice(0, 16);
}
function cleanCode(v: unknown): string {
  return String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
}
function cleanAvatar(v: unknown): string {
  const s = String(v ?? '').trim();
  return s && [...s].length <= 2 ? s : '🐣';
}

function fail(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function GET(req: NextRequest) {
  const code = cleanCode(req.nextUrl.searchParams.get('code'));
  if (code.length !== 4) return fail('รหัสห้องไม่ถูกต้อง');
  try {
    const state = await getState(code);
    if (!state) return fail('ไม่พบห้องนี้', 404);
    return NextResponse.json({ ok: true, ...state });
  } catch (e) {
    console.error('compete GET failed:', e);
    return fail('server error', 500);
  }
}

export async function POST(req: NextRequest) {
  // Generous: a racing tab pings this about once a second, per player.
  if (!rateLimit(`compete:${clientKey(req)}`, 300, 60_000)) return fail('ช้าลงหน่อยนะ', 429);

  let raw: unknown;
  try { raw = await req.json(); } catch { return fail('bad request'); }
  const b = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const action = String(b.action ?? '');
  const code = cleanCode(b.code);
  const playerId = String(b.playerId ?? '').slice(0, 40);

  try {
    switch (action) {
      case 'create': {
        // Deliberately not BotID-checked -- see instrumentation-client.ts:
        // BotID's client wrapper was found to leave fetches to this endpoint
        // permanently pending in some browser contexts. Room creation still
        // has the standard IP rate limit above.
        const name = cleanName(b.name);
        if (!name) return fail('ใส่ชื่อเล่นก่อนนะ');
        const mode = MODES.includes(b.mode as Mode) ? (b.mode as Mode) : 'quiz';
        const { room, playerId: id } = await createRoom(mode, { name, avatar: cleanAvatar(b.avatar) });
        return NextResponse.json({ ok: true, code: room.code, playerId: id, ...(await getState(room.code))! });
      }

      case 'join': {
        const name = cleanName(b.name);
        if (!name) return fail('ใส่ชื่อเล่นก่อนนะ');
        if (code.length !== 4) return fail('รหัสห้องต้องมี 4 ตัว');
        const { playerId: id } = await joinRoom(code, { name, avatar: cleanAvatar(b.avatar) });
        return NextResponse.json({ ok: true, code, playerId: id, ...(await getState(code))! });
      }

      case 'start':
        if (!code || !playerId) return fail('bad request');
        return NextResponse.json({ ok: true, ...(await startRace(code, playerId)) });

      case 'progress': {
        if (!code || !playerId) return fail('bad request');
        const state = await reportProgress(code, playerId, Number(b.score) || 0, Number(b.progress) || 0, b.done === true);
        if (!state) return fail('ไม่พบห้องนี้', 404);
        return NextResponse.json({ ok: true, ...state });
      }

      case 'rematch':
        if (!code || !playerId) return fail('bad request');
        return NextResponse.json({ ok: true, ...(await rematch(code, playerId)) });

      case 'leave':
        if (code && playerId) await leaveRoom(code, playerId);
        return NextResponse.json({ ok: true });

      default:
        return fail('unknown action');
    }
  } catch (e) {
    // Store errors carry Thai copy meant for the child (room full, race already
    // started, bad code). Anything else is a real fault and stays generic.
    const msg = e instanceof Error ? e.message : '';
    if (msg && /[ก-๙]/.test(msg)) return fail(msg);
    console.error('compete POST failed:', e);
    return fail('server error', 500);
  }
}
