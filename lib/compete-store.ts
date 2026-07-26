// Room store for the live competition area (/compete).
//
// There are still NO accounts: a student types a nickname, picks an emoji, and
// either opens a room (getting a 4-character code) or joins one with a code the
// teacher put on the board. A room is throwaway — it lives for the length of one
// race and is swept away when it goes quiet.
//
// Two backends, same shape:
//   * Neon Postgres, when DATABASE_URL is set (survives restarts, works across
//     serverless instances — the real classroom case).
//   * An in-memory map otherwise, so `npm run dev` works with zero setup.
//
// Rooms and players are separate rows on purpose. Each player only ever writes
// their OWN row, so twenty children hammering /api/compete during a race cannot
// clobber each other the way a single shared JSON blob would.
import { getSql } from './db';

export type Mode = 'typing' | 'clicking' | 'quiz';
export type Status = 'lobby' | 'running' | 'done';

export type Player = {
  id: string;
  name: string;
  avatar: string;
  score: number;      // mode-defined points (correct answers / hits / chars typed)
  progress: number;   // 0-100, for the live race bars
  finishedAt: number | null; // ms epoch when they crossed the line; null = still racing
  isHost: boolean;
  lastSeen: number;
};

export type Room = {
  code: string;
  mode: Mode;
  status: Status;
  seed: number;        // every player derives the SAME questions/phrases from this
  rounds: number;      // questions / phrases / targets in this race
  startedAt: number | null;
  createdAt: number;
};

export type RoomState = { room: Room; players: Player[] };

export const ROUNDS: Record<Mode, number> = { typing: 5, clicking: 20, quiz: 10 };
const ROOM_TTL_MS = 2 * 60 * 60 * 1000; // rooms older than this are swept
const PLAYER_STALE_MS = 45_000;         // a player who stops polling drops out of the list

// A code a 9-year-old can read off a whiteboard: no 0/O/1/I confusion.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function makeCode(): string {
  let s = '';
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}
export function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ───────────────────────── in-memory backend ─────────────────────────
// Hung off globalThis so Next's dev-mode hot reload doesn't wipe live rooms.
type Mem = { rooms: Map<string, Room>; players: Map<string, Player[]> };
const g = globalThis as unknown as { __csCompete?: Mem };
const mem: Mem = (g.__csCompete ??= { rooms: new Map(), players: new Map() });

function sweepMem() {
  const now = Date.now();
  for (const [code, r] of mem.rooms) {
    if (now - r.createdAt > ROOM_TTL_MS) { mem.rooms.delete(code); mem.players.delete(code); }
  }
}

// ───────────────────────── public API ─────────────────────────

export async function createRoom(mode: Mode, host: { name: string; avatar: string }): Promise<{ room: Room; playerId: string }> {
  const sql = getSql();
  const playerId = makeId();
  const now = Date.now();

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = makeCode();
    const room: Room = { code, mode, status: 'lobby', seed: Math.floor(Math.random() * 1e9), rounds: ROUNDS[mode], startedAt: null, createdAt: now };

    if (!sql) {
      sweepMem();
      if (mem.rooms.has(code)) continue;
      mem.rooms.set(code, room);
      mem.players.set(code, [{ id: playerId, name: host.name, avatar: host.avatar, score: 0, progress: 0, finishedAt: null, isHost: true, lastSeen: now }]);
      return { room, playerId };
    }

    // `on conflict do nothing` + rowcount tells us whether the code was free,
    // without a read-then-write race between two children creating rooms at once.
    const ins = await sql`
      insert into compete_rooms (code, mode, status, seed, rounds, created_at)
      values (${code}, ${mode}, 'lobby', ${room.seed}, ${room.rounds}, now())
      on conflict (code) do nothing
      returning code`;
    if (ins.length === 0) continue; // taken — try another code

    await sql`
      insert into compete_players (id, room_code, name, avatar, is_host, last_seen)
      values (${playerId}, ${code}, ${host.name}, ${host.avatar}, true, now())`;
    return { room, playerId };
  }
  throw new Error('could not allocate a room code');
}

export async function joinRoom(code: string, p: { name: string; avatar: string }): Promise<{ room: Room; playerId: string }> {
  const sql = getSql();
  const room = await getRoom(code);
  if (!room) throw new Error('ไม่พบห้องนี้ ลองตรวจรหัสอีกครั้ง');
  if (room.status !== 'lobby') throw new Error('การแข่งขันเริ่มไปแล้ว รอรอบถัดไปนะ');

  const playerId = makeId();
  const now = Date.now();

  if (!sql) {
    const list = mem.players.get(code) ?? [];
    if (list.filter((x) => now - x.lastSeen < PLAYER_STALE_MS).length >= 20) throw new Error('ห้องเต็มแล้ว (สูงสุด 20 คน)');
    list.push({ id: playerId, name: p.name, avatar: p.avatar, score: 0, progress: 0, finishedAt: null, isHost: false, lastSeen: now });
    mem.players.set(code, list);
    return { room, playerId };
  }

  const [{ n }] = await sql`select count(*)::int as n from compete_players where room_code = ${code}` as { n: number }[];
  if (n >= 20) throw new Error('ห้องเต็มแล้ว (สูงสุด 20 คน)');
  await sql`
    insert into compete_players (id, room_code, name, avatar, is_host, last_seen)
    values (${playerId}, ${code}, ${p.name}, ${p.avatar}, false, now())`;
  return { room, playerId };
}

export async function getRoom(code: string): Promise<Room | null> {
  const sql = getSql();
  if (!sql) { sweepMem(); return mem.rooms.get(code) ?? null; }

  const rows = await sql`
    select code, mode, status, seed, rounds,
           extract(epoch from started_at) * 1000 as started_ms,
           extract(epoch from created_at) * 1000 as created_ms
    from compete_rooms where code = ${code}` as Record<string, unknown>[];
  if (!rows.length) return null;
  const r = rows[0];
  return {
    code: String(r.code),
    mode: r.mode as Mode,
    status: r.status as Status,
    seed: Number(r.seed),
    rounds: Number(r.rounds),
    startedAt: r.started_ms == null ? null : Number(r.started_ms),
    createdAt: Number(r.created_ms),
  };
}

export async function getState(code: string): Promise<RoomState | null> {
  const room = await getRoom(code);
  if (!room) return null;
  const sql = getSql();
  const cutoff = Date.now() - PLAYER_STALE_MS;

  if (!sql) {
    const all = mem.players.get(code) ?? [];
    // A player who has already finished stays on the board even if their tab froze.
    const live = all.filter((p) => p.lastSeen > cutoff || p.finishedAt !== null);
    return { room, players: live.map((p) => ({ ...p })) };
  }

  const rows = await sql`
    select id, name, avatar, score, progress, is_host,
           extract(epoch from finished_at) * 1000 as finished_ms,
           extract(epoch from last_seen) * 1000 as last_ms
    from compete_players
    where room_code = ${code}
      and (last_seen > now() - interval '45 seconds' or finished_at is not null)
    order by joined_at asc` as Record<string, unknown>[];

  return {
    room,
    players: rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      avatar: String(r.avatar),
      score: Number(r.score),
      progress: Number(r.progress),
      finishedAt: r.finished_ms == null ? null : Number(r.finished_ms),
      isHost: Boolean(r.is_host),
      lastSeen: Number(r.last_ms),
    })),
  };
}

// Host presses GO. Idempotent: a double-tap cannot restart a race in flight.
export async function startRace(code: string, playerId: string): Promise<RoomState> {
  const state = await getState(code);
  if (!state) throw new Error('ไม่พบห้องนี้');
  const me = state.players.find((p) => p.id === playerId);
  if (!me?.isHost) throw new Error('มีแต่หัวหน้าห้องที่เริ่มการแข่งขันได้');
  if (state.room.status !== 'lobby') return state;

  const sql = getSql();
  const now = Date.now();
  if (!sql) {
    const r = mem.rooms.get(code)!;
    r.status = 'running';
    r.startedAt = now;
  } else {
    await sql`update compete_rooms set status = 'running', started_at = now() where code = ${code} and status = 'lobby'`;
  }
  return (await getState(code))!;
}

// Called every second or so while racing: a heartbeat that also carries the score.
// `done` stamps the finish line exactly once — a later ping can never un-finish you
// or overwrite your finishing time, which is what the podium is ranked on.
export async function reportProgress(
  code: string,
  playerId: string,
  score: number,
  progress: number,
  done: boolean,
): Promise<RoomState | null> {
  const sql = getSql();
  const s = Math.max(0, Math.min(100000, Math.round(score)));
  const pc = Math.max(0, Math.min(100, Math.round(progress)));

  if (!sql) {
    const list = mem.players.get(code) ?? [];
    const p = list.find((x) => x.id === playerId);
    if (p) {
      p.score = s;
      p.progress = pc;
      p.lastSeen = Date.now();
      if (done && p.finishedAt === null) p.finishedAt = Date.now();
    }
    maybeFinishMem(code);
  } else {
    await sql`
      update compete_players
      set score = ${s}, progress = ${pc}, last_seen = now(),
          finished_at = case when ${done} and finished_at is null then now() else finished_at end
      where id = ${playerId} and room_code = ${code}`;
    // Race is over once nobody is left running.
    await sql`
      update compete_rooms r set status = 'done'
      where r.code = ${code} and r.status = 'running'
        and not exists (
          select 1 from compete_players p
          where p.room_code = ${code} and p.finished_at is null
            and p.last_seen > now() - interval '45 seconds')`;
  }
  return getState(code);
}

function maybeFinishMem(code: string) {
  const room = mem.rooms.get(code);
  if (!room || room.status !== 'running') return;
  const cutoff = Date.now() - PLAYER_STALE_MS;
  const live = (mem.players.get(code) ?? []).filter((p) => p.lastSeen > cutoff || p.finishedAt !== null);
  if (live.length && live.every((p) => p.finishedAt !== null)) room.status = 'done';
}

export async function leaveRoom(code: string, playerId: string): Promise<void> {
  const sql = getSql();
  if (!sql) {
    const list = mem.players.get(code) ?? [];
    const i = list.findIndex((p) => p.id === playerId);
    if (i >= 0) list.splice(i, 1);
    if (list.length === 0) { mem.rooms.delete(code); mem.players.delete(code); }
    else if (!list.some((p) => p.isHost)) list[0].isHost = true; // host left — promote whoever is next
    return;
  }
  await sql`delete from compete_players where id = ${playerId} and room_code = ${code}`;
  const rest = await sql`select id, is_host from compete_players where room_code = ${code} order by joined_at asc` as { id: string; is_host: boolean }[];
  if (rest.length === 0) { await sql`delete from compete_rooms where code = ${code}`; return; }
  if (!rest.some((p) => p.is_host)) await sql`update compete_players set is_host = true where id = ${rest[0].id}`;
}

// Everyone is back in the lobby for another go: same room, same players, fresh seed.
export async function rematch(code: string, playerId: string): Promise<RoomState> {
  const state = await getState(code);
  if (!state) throw new Error('ไม่พบห้องนี้');
  if (!state.players.find((p) => p.id === playerId)?.isHost) throw new Error('มีแต่หัวหน้าห้องที่เริ่มรอบใหม่ได้');

  const sql = getSql();
  const seed = Math.floor(Math.random() * 1e9);
  if (!sql) {
    const r = mem.rooms.get(code)!;
    r.status = 'lobby'; r.seed = seed; r.startedAt = null;
    for (const p of mem.players.get(code) ?? []) { p.score = 0; p.progress = 0; p.finishedAt = null; }
  } else {
    await sql`update compete_rooms set status = 'lobby', seed = ${seed}, started_at = null where code = ${code}`;
    await sql`update compete_players set score = 0, progress = 0, finished_at = null where room_code = ${code}`;
  }
  return (await getState(code))!;
}

// Ranking used by the live board and the podium: furthest along wins; ties broken
// by who got there first; players still racing sort below anyone who finished.
export function rank(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.finishedAt && b.finishedAt) return a.finishedAt - b.finishedAt;
    if (a.finishedAt) return -1;
    if (b.finishedAt) return 1;
    return b.progress - a.progress;
  });
}
