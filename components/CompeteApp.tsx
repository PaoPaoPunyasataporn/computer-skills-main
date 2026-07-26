'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  pickQuiz, pickTyping, CLICK_TARGETS,
  type QuizQ, type TypingPhrase, type ClickTarget,
} from '@/lib/compete-content';
import type { Mode, Player, RoomState } from '@/lib/compete-store';
import Speaker from '@/components/Speaker';

// ═══════════════════════════════════════════════════════════════════════════
// สนามแข่งขัน — the competition area.
//
// Children race each other live: no accounts, just a nickname, an emoji and a
// 4-character room code the teacher can write on the board. Three modes:
//   ⌨️ typing race    — first to type all the phrases correctly
//   🖱️ clicking race  — hit the named target the most times, fastest
//   🧠 quiz race      — most correct answers to real digital-skills scenarios
//
// The server (/api/compete) is a dumb scoreboard: it hands every player in a room
// the same random seed, then collects "I'm at N points, X% done" pings once a
// second and hands back everyone else's. All the actual game logic lives here, so
// the race feels instant even on a slow classroom wifi.
// ═══════════════════════════════════════════════════════════════════════════

type View = 'home' | 'lobby' | 'race' | 'done';

const AVATARS = ['🐣', '🐨', '🦊', '🐼', '🐸', '🦁', '🐙', '🦄', '🐝', '🐧', '🦉', '🐢'];

const MODE_INFO: Record<Mode, { icon: string; title: string; desc: string; accent: string; edge: string; how: string }> = {
  typing: {
    icon: '⌨️', title: 'แข่งพิมพ์ดีด', desc: 'พิมพ์ประโยคให้ถูกและเร็วที่สุด',
    accent: 'linear-gradient(135deg,#5CA0FF,#3A82F6)', edge: '#2E64D6',
    how: 'พิมพ์ประโยคที่เห็นให้ตรงทุกตัวอักษร ครบทุกประโยคก่อน = ชนะ',
  },
  clicking: {
    icon: '🖱️', title: 'แข่งคลิกเมาส์', desc: 'คลิกเป้าหมายให้ถูกและไวที่สุด',
    accent: 'linear-gradient(135deg,#FFB456,#F0982E)', edge: '#D07E1E',
    how: 'ระบบบอกว่าให้คลิกอะไร — คลิกให้ถูกช่องให้ครบทุกรอบ เร็วที่สุด = ชนะ',
  },
  quiz: {
    icon: '🧠', title: 'แข่งตอบสถานการณ์', desc: 'ตอบสถานการณ์จริงให้ถูกที่สุด',
    accent: 'linear-gradient(135deg,#B583F5,#9A5CF0)', edge: '#7C3EE0',
    how: 'อ่านสถานการณ์แล้วเลือกคำตอบที่ถูก ตอบถูกมากที่สุด = ชนะ (กด 🔊 ฟังเสียงได้)',
  },
};


export default function CompeteApp() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🐣');
  const [mode, setMode] = useState<Mode>('quiz');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [code, setCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [state, setState] = useState<RoomState | null>(null);

  // Live score for THIS player. Mirrored into refs, because the once-a-second
  // polling interval closes over them and must always ping the newest values.
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const scoreRef = useRef(0), progRef = useRef(0), doneRef = useRef(false);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { progRef.current = progress; }, [progress]);
  useEffect(() => { doneRef.current = done; }, [done]);

  // The room status the polling interval needs, without re-subscribing the
  // interval every time somebody's score ticks.
  const stateRef = useRef<RoomState | null>(null);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Remember the nickname between visits so a child doesn't retype it every race.
  // localStorage is client-only, so this can only run after mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cs_compete_me');
      if (!raw) return;
      const m = JSON.parse(raw);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (m.name) setName(String(m.name).slice(0, 16));
      if (m.avatar) setAvatar(String(m.avatar));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('cs_compete_me', JSON.stringify({ name, avatar })); } catch { /* ignore */ }
  }, [name, avatar]);

  const post = useCallback(async (body: Record<string, unknown>) => {
    const r = await fetch('/api/compete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({ ok: false, error: 'network' }));
    if (!j.ok) throw new Error(j.error || 'เกิดข้อผิดพลาด');
    return j as { ok: true } & RoomState & { code?: string; playerId?: string };
  }, []);

  // ── the heartbeat: once a second, tell the room where we are and learn where
  // everyone else is. While racing this doubles as our score report.
  //
  // IMPORTANT: this always POSTs 'progress' (never a plain GET), even while just
  // sitting in the lobby waiting for the host to start. reportProgress is what
  // stamps last_seen server-side — a lobby-only GET never touched it, so anyone
  // who took longer than PLAYER_STALE_MS (45s) to get everyone into the room
  // would silently vanish from the player list before the race even began.
  useEffect(() => {
    if (!code || !playerId) return;
    let alive = true;

    async function tick() {
      try {
        const j = await post({ action: 'progress', code, playerId, score: scoreRef.current, progress: progRef.current, done: doneRef.current });
        if (!alive) return;
        setState({ room: j.room, players: j.players });
      } catch {
        /* one dropped ping is nothing — the next one will catch up */
      }
    }

    tick();
    const iv = setInterval(tick, 1000);
    return () => { alive = false; clearInterval(iv); };
  }, [code, playerId, post]);

  // The view is not state of its own — it is simply where the room currently is.
  const view: View = !code || !state ? 'home'
    : state.room.status === 'running' ? 'race'
    : state.room.status === 'done' ? 'done'
    : 'lobby';

  // Leave cleanly so our avatar doesn't linger in the lobby.
  useEffect(() => {
    if (!code || !playerId) return;
    const bye = () => {
      try {
        navigator.sendBeacon?.('/api/compete', new Blob([JSON.stringify({ action: 'leave', code, playerId })], { type: 'application/json' }));
      } catch { /* ignore */ }
    };
    window.addEventListener('pagehide', bye);
    return () => window.removeEventListener('pagehide', bye);
  }, [code, playerId]);

  function resetRace() { setScore(0); setProgress(0); setDone(false); }

  async function act(fn: () => Promise<void>) {
    setBusy(true); setError('');
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setBusy(false); }
  }

  const createRoom = () => act(async () => {
    if (!name.trim()) throw new Error('ใส่ชื่อเล่นก่อนนะ');
    const j = await post({ action: 'create', name, avatar, mode });
    resetRace();
    setCode(j.code!); setPlayerId(j.playerId!); setState({ room: j.room, players: j.players });
  });

  const joinRoom = () => act(async () => {
    if (!name.trim()) throw new Error('ใส่ชื่อเล่นก่อนนะ');
    const c = joinCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.length !== 4) throw new Error('รหัสห้องมี 4 ตัวนะ');
    const j = await post({ action: 'join', code: c, name, avatar });
    resetRace();
    setCode(j.code!); setPlayerId(j.playerId!); setState({ room: j.room, players: j.players });
  });

  const startRace = () => act(async () => {
    resetRace();
    const j = await post({ action: 'start', code, playerId });
    setState({ room: j.room, players: j.players });
  });

  const rematch = () => act(async () => {
    resetRace();
    const j = await post({ action: 'rematch', code, playerId });
    setState({ room: j.room, players: j.players });
  });

  const quit = () => act(async () => {
    await post({ action: 'leave', code, playerId });
    setCode(''); setPlayerId(''); setState(null); resetRace();
  });

  const me = state?.players.find((p) => p.id === playerId) ?? null;
  const iAmHost = !!me?.isHost;

  return (
    <div className="page">
      <div className="shell">
        <div className="appwin">
          <div className="cmp-hero">
            <span className="cmp-hero-orb">🏁</span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="cmp-kicker">สนามแข่งขัน · เล่นกับเพื่อน · ไม่ต้องสมัครสมาชิก</div>
              <h2 className="cmp-title">แข่งกับเพื่อน!</h2>
              <p className="cmp-sub">พิมพ์เร็ว · คลิกแม่น · ตอบถูก — ใครจะเป็นที่ 1 ของห้อง?</p>
            </div>
            {code && (
              <div className="cmp-roomchip">
                <span>รหัสห้อง</span>
                <b>{code}</b>
              </div>
            )}
          </div>

          <div className="cmp-body">
            <Link className="btn-ghost3d" href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>← กลับหน้าหลัก</Link>

            {error && <div className="cmp-error">⚠️ {error}</div>}

            {view === 'home' && (
              <HomeView
                name={name} setName={setName}
                avatar={avatar} setAvatar={setAvatar}
                mode={mode} setMode={setMode}
                joinCode={joinCode} setJoinCode={setJoinCode}
                busy={busy} onCreate={createRoom} onJoin={joinRoom}
              />
            )}

            {view === 'lobby' && state && (
              <LobbyView state={state} code={code} meId={playerId} iAmHost={iAmHost} busy={busy} onStart={startRace} onQuit={quit} />
            )}

            {view === 'race' && state && (
              <RaceView
                state={state} meId={playerId}
                score={score} setScore={setScore}
                setProgress={setProgress}
                done={done} setDone={setDone}
              />
            )}

            {view === 'done' && state && (
              <ResultsView state={state} meId={playerId} iAmHost={iAmHost} busy={busy} onRematch={rematch} onQuit={quit} />
            )}
          </div>
        </div>
      </div>

      <style>{CSS}</style>
    </div>
  );
}

// ───────────────────────────── home ─────────────────────────────

function HomeView(p: {
  name: string; setName: (v: string) => void;
  avatar: string; setAvatar: (v: string) => void;
  mode: Mode; setMode: (v: Mode) => void;
  joinCode: string; setJoinCode: (v: string) => void;
  busy: boolean; onCreate: () => void; onJoin: () => void;
}) {
  return (
    <>
      <section className="cmp-card">
        <h3 className="cmp-h3">1 · ชื่อเล่นของหนู</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="cmp-input"
            placeholder="เช่น น้องปาล์ม"
            value={p.name}
            maxLength={16}
            onChange={(e) => p.setName(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
        </div>
        <div className="cmp-avatars">
          {AVATARS.map((a) => (
            <button key={a} className={`cmp-av${a === p.avatar ? ' on' : ''}`} onClick={() => p.setAvatar(a)} title={`เลือก ${a}`}>{a}</button>
          ))}
        </div>
      </section>

      <section className="cmp-card">
        <h3 className="cmp-h3">2 · เลือกเกมแข่ง</h3>
        <div className="cmp-modes">
          {(Object.keys(MODE_INFO) as Mode[]).map((m) => {
            const info = MODE_INFO[m];
            return (
              <button key={m} className={`cmp-mode${m === p.mode ? ' on' : ''}`} style={{ borderBottomColor: info.edge }} onClick={() => p.setMode(m)}>
                <span className="cmp-mode-orb" style={{ background: info.accent }}>{info.icon}</span>
                <span className="cmp-mode-name">{info.title}</span>
                <span className="cmp-mode-desc">{info.desc}</span>
                <span className="cmp-mode-how">{info.how}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="cmp-card">
        <h3 className="cmp-h3">3 · เริ่มแข่ง</h3>
        <div className="cmp-start">
          <div className="cmp-start-col">
            <div className="cmp-start-lbl">เปิดห้องใหม่ แล้วบอกรหัสให้เพื่อน</div>
            <button className="btn3d" disabled={p.busy} onClick={p.onCreate} style={{ width: '100%', padding: '14px 20px', fontSize: 17, background: 'linear-gradient(135deg,#5CD35B,#3BA93C)', boxShadow: '0 5px 0 #2E8B30' }}>
              🎉 สร้างห้องแข่ง
            </button>
          </div>
          <div className="cmp-or">หรือ</div>
          <div className="cmp-start-col">
            <div className="cmp-start-lbl">มีรหัสจากเพื่อนแล้ว? ใส่ตรงนี้</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="cmp-input cmp-code-input"
                placeholder="ABCD"
                value={p.joinCode}
                maxLength={4}
                onChange={(e) => p.setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') p.onJoin(); }}
              />
              <button className="btn3d" disabled={p.busy} onClick={p.onJoin} style={{ padding: '14px 22px', fontSize: 17, background: 'linear-gradient(135deg,#4FB0FF,#2E9BFF)', boxShadow: '0 5px 0 #2277CC' }}>
                เข้าห้อง →
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ───────────────────────────── lobby ─────────────────────────────

function LobbyView(p: { state: RoomState; code: string; meId: string; iAmHost: boolean; busy: boolean; onStart: () => void; onQuit: () => void }) {
  const info = MODE_INFO[p.state.room.mode];
  return (
    <>
      <section className="cmp-card cmp-codecard">
        <div className="cmp-code-lbl">บอกรหัสนี้กับเพื่อน แล้วให้เพื่อนกด “เข้าห้อง”</div>
        <div className="cmp-code-big">{p.code}</div>
        <div className="cmp-mode-badge" style={{ background: info.accent }}>{info.icon} {info.title}</div>
        <div className="cmp-how">{info.how}</div>
      </section>

      <section className="cmp-card">
        <h3 className="cmp-h3">ผู้เล่นในห้อง · {p.state.players.length} คน</h3>
        <div className="cmp-players">
          {p.state.players.map((pl) => (
            <div key={pl.id} className={`cmp-player${pl.id === p.meId ? ' me' : ''}`}>
              <span className="cmp-player-av">{pl.avatar}</span>
              <span className="cmp-player-name">{pl.name}</span>
              {pl.isHost && <span className="cmp-tag host">หัวหน้าห้อง</span>}
              {pl.id === p.meId && <span className="cmp-tag me">หนูเอง</span>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          {p.iAmHost ? (
            <button
              className="btn3d"
              disabled={p.busy || p.state.players.length < 2}
              onClick={p.onStart}
              style={{ padding: '14px 28px', fontSize: 18, background: 'linear-gradient(135deg,#5CD35B,#3BA93C)', boxShadow: '0 5px 0 #2E8B30', opacity: p.state.players.length < 2 ? 0.55 : 1 }}
            >
              🏁 เริ่มแข่งเลย!
            </button>
          ) : (
            <div className="cmp-wait">⏳ รอหัวหน้าห้องกดเริ่ม...</div>
          )}
          {p.iAmHost && p.state.players.length < 2 && <div className="cmp-wait">รออีกอย่างน้อย 1 คนเข้าห้อง</div>}
          <button className="btn-ghost3d" onClick={p.onQuit} style={{ padding: '12px 20px' }}>ออกจากห้อง</button>
        </div>
      </section>
    </>
  );
}

// ───────────────────────────── race ─────────────────────────────

function RaceView(p: {
  state: RoomState; meId: string;
  score: number; setScore: (fn: (s: number) => number) => void;
  setProgress: (v: number) => void;
  done: boolean; setDone: (v: boolean) => void;
}) {
  const { room } = p.state;
  const [countdown, setCountdown] = useState(3);

  // Everyone sees the same 3-2-1 because it is keyed off the room's start time.
  useEffect(() => {
    const startedAt = room.startedAt ?? Date.now();
    const iv = setInterval(() => {
      const left = 3 - Math.floor((Date.now() - startedAt) / 1000);
      setCountdown(left > 0 ? left : 0);
      if (left <= 0) clearInterval(iv);
    }, 100);
    return () => clearInterval(iv);
  }, [room.startedAt]);

  const live = countdown <= 0;

  return (
    <>
      <LiveBoard state={p.state} meId={p.meId} />

      {!live && (
        <div className="cmp-countdown"><span>{countdown}</span><div className="cmp-count-lbl">เตรียมตัว!</div></div>
      )}

      {live && !p.done && room.mode === 'typing' && (
        <TypingRace seed={room.seed} rounds={room.rounds} setScore={p.setScore} setProgress={p.setProgress} onDone={() => p.setDone(true)} />
      )}
      {live && !p.done && room.mode === 'clicking' && (
        <ClickRace seed={room.seed} rounds={room.rounds} setScore={p.setScore} setProgress={p.setProgress} onDone={() => p.setDone(true)} />
      )}
      {live && !p.done && room.mode === 'quiz' && (
        <QuizRace seed={room.seed} rounds={room.rounds} setScore={p.setScore} setProgress={p.setProgress} onDone={() => p.setDone(true)} />
      )}

      {live && p.done && (
        <div className="cmp-card cmp-finished">
          <div style={{ fontSize: 58 }}>🏁</div>
          <h3 className="cmp-h3" style={{ marginBottom: 6 }}>เข้าเส้นชัยแล้ว!</h3>
          <p style={{ fontFamily: 'Sarabun', color: 'var(--muted)' }}>ได้ {p.score} คะแนน · รอเพื่อนอีกนิดนะ...</p>
        </div>
      )}
    </>
  );
}

function LiveBoard({ state, meId }: { state: RoomState; meId: string }) {
  const sorted = [...state.players].sort((a, b) => (b.score - a.score) || (b.progress - a.progress));
  return (
    <section className="cmp-card">
      <h3 className="cmp-h3">🏆 กระดานสด</h3>
      <div className="cmp-bars">
        {sorted.map((pl: Player, i) => (
          <div key={pl.id} className={`cmp-bar-row${pl.id === meId ? ' me' : ''}`}>
            <span className="cmp-bar-pos">{i + 1}</span>
            <span className="cmp-bar-av">{pl.avatar}</span>
            <span className="cmp-bar-name">{pl.name}{pl.id === meId ? ' (หนู)' : ''}</span>
            <div className="cmp-bar-track">
              <div className="cmp-bar-fill" style={{ width: `${Math.max(2, pl.progress)}%` }} />
              <span className="cmp-bar-runner" style={{ left: `calc(${Math.max(2, pl.progress)}% - 12px)` }}>{pl.avatar}</span>
            </div>
            <span className="cmp-bar-score">{pl.score}{pl.finishedAt ? ' 🏁' : ''}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── typing ──
function TypingRace(p: { seed: number; rounds: number; setScore: (fn: (s: number) => number) => void; setProgress: (v: number) => void; onDone: () => void }) {
  const phrases = useMemo<TypingPhrase[]>(() => pickTyping(p.seed, p.rounds), [p.seed, p.rounds]);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, [idx]);

  const target = phrases[idx]?.text ?? '';

  function onChange(v: string) {
    setTyped(v);
    if (v === target) {
      const next = idx + 1;
      p.setScore((s) => s + 1);
      p.setProgress(Math.round((next / phrases.length) * 100));
      setTyped('');
      if (next >= phrases.length) { p.onDone(); return; }
      setIdx(next);
    }
  }

  // Colour each character as it is typed so a child sees a mistake immediately.
  const chars = [...target].map((ch, i) => {
    const t = [...typed][i];
    const cls = t === undefined ? '' : t === ch ? ' ok' : ' bad';
    return <span key={i} className={`cmp-ch${cls}`}>{ch}</span>;
  });

  return (
    <section className="cmp-card">
      <div className="cmp-round">ประโยคที่ {idx + 1} / {phrases.length}</div>
      <div className="cmp-phrase">{chars}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          ref={inputRef}
          className="cmp-input"
          style={{ flex: 1, minWidth: 240, fontSize: 20 }}
          value={typed}
          onChange={(e) => onChange(e.target.value)}
          placeholder="พิมพ์ตรงนี้..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <Speaker say={target} />
      </div>
      <p className="cmp-hint">พิมพ์ให้ตรงทุกตัวอักษร แล้วจะข้ามไปประโยคถัดไปเอง</p>
    </section>
  );
}

// ── clicking ──
function ClickRace(p: { seed: number; rounds: number; setScore: (fn: (s: number) => number) => void; setProgress: (v: number) => void; onDone: () => void }) {
  const [round, setRound] = useState(0);
  const [flash, setFlash] = useState<'' | 'ok' | 'bad'>('');

  // Nine tiles, one of which is the target. Reshuffled every round, seeded so the
  // whole room gets the same sequence — the race is reflexes, not luck.
  const grid = useMemo(() => {
    let s = (p.seed + round * 7919) >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const pool = [...CLICK_TARGETS];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const tiles = pool.slice(0, 9);
    const target = tiles[Math.floor(rnd() * tiles.length)];
    return { tiles, target };
  }, [p.seed, round]);

  function hit(t: ClickTarget) {
    if (t.id === grid.target.id) {
      const next = round + 1;
      p.setScore((s) => s + 1);
      p.setProgress(Math.round((next / p.rounds) * 100));
      setFlash('ok');
      setTimeout(() => setFlash(''), 140);
      if (next >= p.rounds) { p.onDone(); return; }
      setRound(next);
    } else {
      // A miss costs you the point, not the round — keep the race moving.
      setFlash('bad');
      setTimeout(() => setFlash(''), 220);
    }
  }

  return (
    <section className={`cmp-card cmp-click${flash ? ` ${flash}` : ''}`}>
      <div className="cmp-round">รอบที่ {round + 1} / {p.rounds}</div>
      <div className="cmp-click-ask">
        คลิก: <b>{grid.target.icon} {grid.target.label}</b>
        <Speaker say={`คลิก ${grid.target.label}`} />
      </div>
      <div className="cmp-click-grid">
        {grid.tiles.map((t) => (
          <button key={t.id} className="cmp-tile" onClick={() => hit(t)} title={t.label}>
            <span className="cmp-tile-ico">{t.icon}</span>
            <span className="cmp-tile-lbl">{t.label}</span>
          </button>
        ))}
      </div>
      <p className="cmp-hint">คลิกผิดไม่เสียรอบ แต่เสียเวลา — ค่อย ๆ เล็งให้แม่น!</p>
    </section>
  );
}

// ── quiz ──
function QuizRace(p: { seed: number; rounds: number; setScore: (fn: (s: number) => number) => void; setProgress: (v: number) => void; onDone: () => void }) {
  const qs = useMemo<QuizQ[]>(() => pickQuiz(p.seed, p.rounds), [p.seed, p.rounds]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const q = qs[i];
  if (!q) return null;

  function choose(k: number) {
    if (picked !== null) return;
    setPicked(k);
    const right = k === q.ok;
    if (right) p.setScore((s) => s + 1);
    const next = i + 1;
    p.setProgress(Math.round((next / qs.length) * 100));
    // A beat to read the explanation, then on to the next one.
    setTimeout(() => {
      if (next >= qs.length) { p.onDone(); return; }
      setPicked(null);
      setI(next);
    }, right ? 900 : 1900);
  }

  return (
    <section className="cmp-card">
      <div className="cmp-round">ข้อที่ {i + 1} / {qs.length}</div>
      <div className="cmp-q">
        <span className="cmp-q-ico">{q.icon}</span>
        <span className="cmp-q-txt">{q.q}</span>
        <Speaker say={q.q} />
      </div>
      <div className="cmp-opts">
        {q.opts.map((o, k) => {
          const cls = picked === null ? '' : k === q.ok ? ' correct' : k === picked ? ' wrong' : '';
          return (
            <button key={k} className={`cmp-opt${cls}`} onClick={() => choose(k)} disabled={picked !== null}>
              <span className="cmp-opt-txt">{o}</span>
              <Speaker say={o} />
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={`cmp-why${picked === q.ok ? ' ok' : ' bad'}`}>
          {picked === q.ok ? '✅ ถูกต้อง! ' : '❌ ยังไม่ใช่ — '}{q.why}
          <Speaker say={q.why} />
        </div>
      )}
    </section>
  );
}

// ───────────────────────────── results ─────────────────────────────

function ResultsView(p: { state: RoomState; meId: string; iAmHost: boolean; busy: boolean; onRematch: () => void; onQuit: () => void }) {
  const sorted = [...p.state.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.finishedAt && b.finishedAt) return a.finishedAt - b.finishedAt;
    if (a.finishedAt) return -1;
    if (b.finishedAt) return 1;
    return b.progress - a.progress;
  });
  const myPos = sorted.findIndex((x) => x.id === p.meId) + 1;
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <>
      <section className="cmp-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 62, lineHeight: 1 }}>{myPos === 1 ? '🏆' : '🎉'}</div>
        <h3 className="cmp-h3" style={{ marginTop: 8 }}>
          {myPos === 1 ? 'ชนะแล้ว! เก่งมาก' : `หนูได้ที่ ${myPos} จาก ${sorted.length} คน`}
        </h3>
        <p style={{ fontFamily: 'Sarabun', color: 'var(--muted)' }}>ลองอีกรอบสิ เดี๋ยวก็เร็วขึ้น!</p>
      </section>

      <section className="cmp-card">
        <h3 className="cmp-h3">อันดับ</h3>
        <div className="cmp-players">
          {sorted.map((pl, i) => (
            <div key={pl.id} className={`cmp-player rank${pl.id === p.meId ? ' me' : ''}`}>
              <span className="cmp-rank">{medals[i] ?? i + 1}</span>
              <span className="cmp-player-av">{pl.avatar}</span>
              <span className="cmp-player-name">{pl.name}{pl.id === p.meId ? ' (หนู)' : ''}</span>
              <span className="cmp-rank-score">{pl.score} คะแนน</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          {p.iAmHost ? (
            <button className="btn3d" disabled={p.busy} onClick={p.onRematch} style={{ padding: '14px 26px', fontSize: 17, background: 'linear-gradient(135deg,#5CD35B,#3BA93C)', boxShadow: '0 5px 0 #2E8B30' }}>
              🔄 แข่งอีกรอบ
            </button>
          ) : (
            <div className="cmp-wait">⏳ รอหัวหน้าห้องเริ่มรอบใหม่...</div>
          )}
          <button className="btn-ghost3d" onClick={p.onQuit} style={{ padding: '12px 20px' }}>ออกจากห้อง</button>
        </div>
      </section>
    </>
  );
}

// ───────────────────────────── styles ─────────────────────────────

const CSS = `
.cmp-hero{display:flex;align-items:center;gap:22px;flex-wrap:wrap;padding:30px clamp(20px,5vw,90px);color:#fff;background:linear-gradient(135deg,#FFB456,#F0982E);}
.cmp-hero-orb{width:92px;height:92px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:50px;animation:csfloat 3s ease-in-out infinite;}
.cmp-kicker{font:700 13px/1 'Mitr';opacity:.9;margin-bottom:6px;}
.cmp-title{font:700 28px/1.15 'Mitr';margin:0 0 6px;}
.cmp-sub{font:500 15px/1.4 'Sarabun';opacity:.94;margin:0;}
.cmp-roomchip{background:rgba(255,255,255,.22);border-radius:18px;padding:10px 18px;text-align:center;}
.cmp-roomchip span{display:block;font:500 12px/1 'Sarabun';opacity:.9;margin-bottom:4px;}
.cmp-roomchip b{font:700 26px/1 'Mitr';letter-spacing:4px;}
.cmp-body{padding:22px clamp(20px,5vw,90px) 70px;background:#FFFDF6;min-height:60vh;}

.cmp-card{background:#fff;border:2px solid var(--line);border-bottom:6px solid var(--line-d);border-radius:22px;padding:22px;margin-bottom:20px;}
.cmp-h3{font:700 19px/1.2 'Mitr';color:var(--ink);margin:0 0 14px;}
.cmp-error{background:#FFECEC;border:2px solid #FFC9C9;color:#B42318;border-radius:14px;padding:12px 16px;margin-bottom:18px;font:600 15px/1.4 'Sarabun';}
.cmp-hint{font:500 13px/1.5 'Sarabun';color:var(--muted2);margin-top:12px;}
.cmp-input{font:600 17px/1 'Sarabun';padding:13px 16px;border:2px solid var(--line-d);border-radius:14px;background:var(--cream);color:var(--ink);outline:none;}
.cmp-input:focus{border-color:var(--green);background:#fff;}
.cmp-code-input{width:130px;text-align:center;letter-spacing:8px;font:700 22px/1 'Mitr';text-transform:uppercase;}

.cmp-avatars{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;}
.cmp-av{width:46px;height:46px;border-radius:14px;border:2px solid var(--line);background:var(--cream);font-size:24px;cursor:pointer;transition:transform .12s;}
.cmp-av:hover{transform:translateY(-2px);}
.cmp-av.on{border-color:var(--green);background:var(--green-soft);box-shadow:0 3px 0 var(--green-d);}

.cmp-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.cmp-mode{display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;padding:18px;border:2px solid var(--line);border-bottom:6px solid var(--line-d);border-radius:20px;background:#fff;cursor:pointer;transition:transform .14s;font-family:inherit;}
.cmp-mode:hover{transform:translateY(-3px);}
.cmp-mode.on{background:#FFFBF0;border-color:var(--gold);}
.cmp-mode-orb{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;color:#fff;margin-bottom:6px;}
.cmp-mode-name{font:700 18px/1.2 'Mitr';color:var(--ink);}
.cmp-mode-desc{font:600 14px/1.4 'Sarabun';color:var(--muted);}
.cmp-mode-how{font:500 12px/1.5 'Sarabun';color:var(--muted2);}

.cmp-start{display:flex;gap:20px;align-items:center;flex-wrap:wrap;}
.cmp-start-col{flex:1;min-width:240px;}
.cmp-start-lbl{font:600 14px/1.4 'Sarabun';color:var(--muted);margin-bottom:10px;}
.cmp-or{font:700 14px/1 'Mitr';color:var(--muted3);padding:0 6px;}

.cmp-codecard{text-align:center;background:linear-gradient(135deg,#FFF8E8,#FFF1D4);border-color:#F4D9A6;border-bottom-color:#E9C67F;}
.cmp-code-lbl{font:600 14px/1.4 'Sarabun';color:var(--amber);}
.cmp-code-big{font:700 64px/1.1 'Mitr';letter-spacing:12px;color:var(--ink);margin:8px 0 12px;text-shadow:0 3px 0 #F4D9A6;}
.cmp-mode-badge{display:inline-block;color:#fff;font:700 15px/1 'Mitr';padding:9px 16px;border-radius:99px;}
.cmp-how{font:500 13px/1.6 'Sarabun';color:var(--muted);margin-top:12px;}

.cmp-players{display:flex;flex-direction:column;gap:10px;}
.cmp-player{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:16px;background:var(--cream);border:2px solid var(--line);}
.cmp-player.me{background:var(--green-soft);border-color:#B9EAB4;}
.cmp-player-av{font-size:28px;}
.cmp-player-name{flex:1;font:700 16px/1 'Mitr';color:var(--ink);}
.cmp-tag{font:700 11px/1 'Mitr';padding:5px 10px;border-radius:99px;}
.cmp-tag.host{background:#FFF2DC;color:var(--amber);}
.cmp-tag.me{background:#E4F0FF;color:var(--blue-d);}
.cmp-rank{width:34px;text-align:center;font:700 20px/1 'Mitr';color:var(--muted);}
.cmp-rank-score{font:700 15px/1 'Mitr';color:var(--green-d);}
.cmp-wait{font:600 15px/1 'Sarabun';color:var(--muted);align-self:center;}

.cmp-bars{display:flex;flex-direction:column;gap:12px;}
.cmp-bar-row{display:flex;align-items:center;gap:10px;}
.cmp-bar-row.me .cmp-bar-name{color:var(--green-d);}
.cmp-bar-pos{width:22px;font:700 15px/1 'Mitr';color:var(--muted3);}
.cmp-bar-av{font-size:20px;}
.cmp-bar-name{width:90px;font:700 14px/1 'Mitr';color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.cmp-bar-track{position:relative;flex:1;height:18px;border-radius:99px;background:var(--cream2);overflow:visible;}
.cmp-bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#5CD35B,#3BA93C);transition:width .4s ease;}
.cmp-bar-runner{position:absolute;top:-6px;font-size:20px;transition:left .4s ease;}
.cmp-bar-score{width:52px;text-align:right;font:700 15px/1 'Mitr';color:var(--green-d);}

.cmp-countdown{text-align:center;padding:40px 0;}
.cmp-countdown span{display:inline-flex;align-items:center;justify-content:center;width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,#FFC24B,#F0982E);color:#fff;font:700 62px/1 'Mitr';box-shadow:0 8px 0 #C97F1E;animation:cspulse .9s ease-in-out infinite;}
.cmp-count-lbl{font:700 18px/1 'Mitr';color:var(--muted);margin-top:16px;}

.cmp-round{font:700 13px/1 'Mitr';color:var(--muted3);margin-bottom:12px;}
.cmp-phrase{font:600 24px/1.6 'Sarabun';color:var(--muted3);background:var(--cream);border-radius:16px;padding:18px;margin-bottom:16px;word-break:break-word;}
.cmp-ch.ok{color:var(--green-d);}
.cmp-ch.bad{color:#DC2626;background:#FFE1E1;border-radius:4px;}

.cmp-click{transition:background .12s;}
.cmp-click.ok{background:#F1FCEF;}
.cmp-click.bad{background:#FFF1F1;}
.cmp-click-ask{display:flex;align-items:center;gap:10px;font:600 20px/1.4 'Sarabun';color:var(--ink);margin-bottom:16px;flex-wrap:wrap;}
.cmp-click-ask b{font-family:'Mitr';}
.cmp-click-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.cmp-tile{display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 8px;border:2px solid var(--line);border-bottom:5px solid var(--line-d);border-radius:18px;background:#fff;cursor:pointer;transition:transform .1s;font-family:inherit;}
.cmp-tile:hover{transform:translateY(-3px);border-color:var(--gold);}
.cmp-tile:active{transform:translateY(2px);}
.cmp-tile-ico{font-size:36px;}
.cmp-tile-lbl{font:600 13px/1.2 'Sarabun';color:var(--muted);text-align:center;}

.cmp-q{display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;}
.cmp-q-ico{font-size:34px;}
.cmp-q-txt{flex:1;font:600 20px/1.55 'Sarabun';color:var(--ink);}
.cmp-opts{display:flex;flex-direction:column;gap:10px;}
.cmp-opt{display:flex;align-items:center;gap:10px;text-align:left;padding:14px 16px;border:2px solid var(--line);border-bottom:5px solid var(--line-d);border-radius:16px;background:#fff;cursor:pointer;font-family:inherit;transition:transform .12s,border-color .12s;}
.cmp-opt:hover:not(:disabled){transform:translateX(3px);border-color:var(--purple);}
.cmp-opt:disabled{cursor:default;}
.cmp-opt-txt{flex:1;font:600 16px/1.5 'Sarabun';color:var(--ink);}
.cmp-opt.correct{background:var(--green-soft);border-color:var(--green);}
.cmp-opt.wrong{background:#FFECEC;border-color:#F19999;}
.cmp-why{display:flex;align-items:center;gap:10px;margin-top:14px;padding:12px 16px;border-radius:14px;font:600 15px/1.6 'Sarabun';}
.cmp-why.ok{background:var(--green-soft);color:var(--green-d);}
.cmp-why.bad{background:#FFF4E5;color:var(--amber);}
.cmp-finished{text-align:center;}


@media(max-width:820px){
  .cmp-modes{grid-template-columns:1fr;}
  .cmp-code-big{font-size:46px;letter-spacing:8px;}
  .cmp-bar-name{width:64px;}
}
`;
