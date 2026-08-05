'use client';

import Link from 'next/link';
import type { DragEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  pickTyping, pickDragItems, pickScamQuiz, mulberry32,
  DRAGDROP_ITEMS, RECYCLE_BIN, FILESORT_FOLDERS, FILESORT_ITEMS,
  DESKTOP_ICONS, CONTEXT_TASKS,
  type TypingPhrase, type DragItem, type ScamQ, type DesktopIcon, type ContextTask,
} from '@/lib/compete-content';
import type { Mode, Player, RoomState, TypingLevel } from '@/lib/compete-store';
import Speaker from '@/components/Speaker';

// ═══════════════════════════════════════════════════════════════════════════
// สนามแข่งขัน — the competition area.
//
// Children race each other live: no accounts, just a nickname, an emoji and a
// 4-character room code the teacher can write on the board. Four modes:
//   🏎️ typing race     — first to type all the phrases correctly (3 difficulty levels)
//   🎯 drag & drop      — shrinking-target clicks, then drag files into the bin
//   📁 file sorting     — drag messy file icons into the right labelled folder
//   🛡️ real vs. scam    — buzzer-style speed quiz: safe / scam / dangerous
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
    icon: '🏎️', title: 'แข่งพิมพ์ดีด', desc: 'พิมพ์ประโยคให้ถูกและเร็วที่สุด',
    accent: 'linear-gradient(135deg,#5CA0FF,#3A82F6)', edge: '#2E64D6',
    how: 'พิมพ์ประโยคที่เห็นให้ตรงทุกตัวอักษร ครบทุกประโยคก่อน = ชนะ — เลือกระดับความยากได้ตอนสร้างห้อง',
  },
  dragdrop: {
    icon: '🎯', title: 'แข่งคลิกไว & ลากวาง', desc: 'คลิกเป้าที่กำลังหด แล้วลากไฟล์ทิ้งถังขยะ',
    accent: 'linear-gradient(135deg,#FFB456,#F0982E)', edge: '#D07E1E',
    how: 'ช่วงแรกคลิกวงกลมก่อนที่มันจะหดหาย ช่วงสองลากไฟล์ไปทิ้งถังขยะ ทำครบทุกรอบให้เร็วที่สุด = ชนะ',
  },
  filesort: {
    icon: '📁', title: 'แข่งจัดระเบียบไฟล์', desc: 'ลากไอคอนไฟล์ไปใส่โฟลเดอร์ให้ถูก',
    accent: 'linear-gradient(135deg,#6FCF97,#3BA93C)', edge: '#2E8B30',
    how: 'ลากไฟล์แต่ละอันไปใส่โฟลเดอร์รูปภาพ เอกสาร หรือเพลงให้ถูก ใส่ผิดไม่เป็นไร ลองใหม่ได้',
  },
  scamquiz: {
    icon: '🛡️', title: 'แข่งจับเท็จ & ความปลอดภัย', desc: 'ตัดสินให้ไวว่า ปลอดภัย / หลอกลวง / อันตราย',
    accent: 'linear-gradient(135deg,#B583F5,#9A5CF0)', edge: '#7C3EE0',
    how: 'อ่านข้อความแล้วรีบกดให้ทันเวลา — ปลอดภัย ✅ / หลอกลวง 🎣 / อันตราย 🚨 ตอบถูกมากที่สุด = ชนะ (กด 🔊 ฟังเสียงได้)',
  },
};

const LEVEL_INFO: Record<TypingLevel, { label: string; desc: string }> = {
  0: { label: 'ง่ายมาก', desc: 'ตัวอักษร/ตัวเลขเดี่ยว ๆ' },
  1: { label: 'ง่าย', desc: 'คำสั้น ๆ' },
  2: { label: 'ปานกลาง', desc: 'ประโยคสั้น' },
  3: { label: 'ยาก', desc: 'ประโยคเต็มพร้อมเครื่องหมาย' },
};


export default function CompeteApp() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🐣');
  const [mode, setMode] = useState<Mode>('typing');
  const [level, setLevel] = useState<TypingLevel>(2);
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
    const j = await post({ action: 'create', name, avatar, mode, level });
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
                level={level} setLevel={setLevel}
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
  level: TypingLevel; setLevel: (v: TypingLevel) => void;
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

      {p.mode === 'typing' && (
        <section className="cmp-card">
          <h3 className="cmp-h3">🏎️ เลือกระดับความยาก</h3>
          <div className="cmp-levels">
            {([0, 1, 2, 3] as TypingLevel[]).map((lv) => (
              <button key={lv} className={`cmp-level${lv === p.level ? ' on' : ''}`} onClick={() => p.setLevel(lv)}>
                <span className="cmp-level-name">{LEVEL_INFO[lv].label}</span>
                <span className="cmp-level-desc">{LEVEL_INFO[lv].desc}</span>
              </button>
            ))}
          </div>
        </section>
      )}

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
      <LiveBoard state={p.state} meId={p.meId} prominent={room.mode === 'typing'} />

      {!live && (
        <div className="cmp-countdown"><span>{countdown}</span><div className="cmp-count-lbl">เตรียมตัว!</div></div>
      )}

      {live && !p.done && room.mode === 'typing' && (
        <TypingRace seed={room.seed} rounds={room.rounds} level={room.level ?? 2} setScore={p.setScore} setProgress={p.setProgress} onDone={() => p.setDone(true)} />
      )}
      {live && !p.done && room.mode === 'dragdrop' && (
        <DragDropRace seed={room.seed} rounds={room.rounds} setScore={p.setScore} setProgress={p.setProgress} onDone={() => p.setDone(true)} />
      )}
      {live && !p.done && room.mode === 'filesort' && (
        <FileSortRace seed={room.seed} rounds={room.rounds} setScore={p.setScore} setProgress={p.setProgress} onDone={() => p.setDone(true)} />
      )}
      {live && !p.done && room.mode === 'scamquiz' && (
        <ScamQuizRace seed={room.seed} rounds={room.rounds} setScore={p.setScore} setProgress={p.setProgress} onDone={() => p.setDone(true)} />
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

function LiveBoard({ state, meId, prominent }: { state: RoomState; meId: string; prominent?: boolean }) {
  const sorted = [...state.players].sort((a, b) => (b.score - a.score) || (b.progress - a.progress));
  return (
    <section className={`cmp-card${prominent ? ' cmp-track-card' : ''}`}>
      <h3 className="cmp-h3">🏆 กระดานสด</h3>
      <div className={`cmp-bars${prominent ? ' cmp-bars-big' : ''}`}>
        {sorted.map((pl: Player, i) => (
          <div key={pl.id} className={`cmp-bar-row${prominent ? ' big' : ''}${pl.id === meId ? ' me' : ''}`}>
            <span className="cmp-bar-pos">{i + 1}</span>
            <span className="cmp-bar-av">{pl.avatar}</span>
            <span className="cmp-bar-name">{pl.name}{pl.id === meId ? ' (หนู)' : ''}</span>
            <div className="cmp-bar-track">
              <div className="cmp-bar-fill" style={{ width: `${Math.max(2, pl.progress)}%` }} />
              <span className="cmp-bar-flag">🏁</span>
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
function TypingRace(p: { seed: number; rounds: number; level: TypingLevel; setScore: (fn: (s: number) => number) => void; setProgress: (v: number) => void; onDone: () => void }) {
  const phrases = useMemo<TypingPhrase[]>(() => pickTyping(p.seed, p.rounds, p.level), [p.seed, p.rounds, p.level]);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const advancingRef = useRef(false);

  useEffect(() => { inputRef.current?.focus(); }, [idx]);

  const target = phrases[idx]?.text ?? '';

  // Advance after React has committed the value. This catches the final value
  // from IME composition as well as ordinary keyboard input.
  useEffect(() => {
    if (!target || typed !== target || advancingRef.current) return;

    advancingRef.current = true;
    const timer = window.setTimeout(() => {
      const next = idx + 1;
      p.setScore((s) => s + 1);
      p.setProgress(Math.round((next / phrases.length) * 100));
      setTyped('');
      if (next >= phrases.length) p.onDone();
      else setIdx(next);
      advancingRef.current = false;
    }, 0);

    return () => {
      window.clearTimeout(timer);
      advancingRef.current = false;
    };
  }, [idx, p, phrases.length, target, typed]);

  function onChange(v: string) {
    setTyped(v);
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

// ── drag & drop sprint: four desktop-skill phases in sequence ──
//   1. click  — hit a shrinking target before it disappears
//   2. dclick — double-click a desktop icon to "open" it (single clicks don't count)
//   3. drag   — drag a messy file into the recycle bin
//   4. ctxmen — right-click a file, then pick the correct action from its context menu
function DragDropRace(p: { seed: number; rounds: number; setScore: (fn: (s: number) => number) => void; setProgress: (v: number) => void; onDone: () => void }) {
  const quarter = Math.max(1, Math.round(p.rounds / 4));
  const [round, setRound] = useState(0);
  const phase: 'click' | 'dclick' | 'drag' | 'ctxmen' =
    round < quarter ? 'click' : round < quarter * 2 ? 'dclick' : round < quarter * 3 ? 'drag' : 'ctxmen';
  const dragItems = useMemo<DragItem[]>(() => pickDragItems(DRAGDROP_ITEMS, p.seed, quarter), [p.seed, quarter]);
  const icons = useMemo<DesktopIcon[]>(() => pickSeededGeneric(DESKTOP_ICONS, p.seed + 1, quarter), [p.seed, quarter]);
  const ctxTasks = useMemo<ContextTask[]>(() => pickSeededGeneric(CONTEXT_TASKS, p.seed + 2, quarter), [p.seed, quarter]);

  function advance() {
    const next = round + 1;
    p.setScore((s) => s + 1);
    p.setProgress(Math.round((next / p.rounds) * 100));
    if (next >= p.rounds) { p.onDone(); return; }
    setRound(next);
  }

  const phaseLabel = phase === 'click' ? '🎯 คลิกให้ทัน' : phase === 'dclick' ? '🖱️ ดับเบิลคลิกเปิด' : phase === 'drag' ? '🗑️ ลากทิ้งถังขยะ' : '🖱️ คลิกขวาแล้วเลือกเมนู';

  return (
    <section className="cmp-card">
      <div className="cmp-round">รอบที่ {round + 1} / {p.rounds} · {phaseLabel}</div>
      {phase === 'click' && <ShrinkTarget key={round} seed={p.seed} round={round} onHit={advance} onMiss={advance} />}
      {phase === 'dclick' && <DoubleClickIcon key={round} icon={icons[round - quarter]} onOpen={advance} />}
      {phase === 'drag' && <DragToBin key={round} item={dragItems[round - quarter * 2]} onDrop={advance} />}
      {phase === 'ctxmen' && <ContextMenuTask key={round} task={ctxTasks[round - quarter * 3]} seed={p.seed + round} onPick={advance} />}
    </section>
  );
}

function ShrinkTarget(p: { seed: number; round: number; onHit: () => void; onMiss: () => void }) {
  const rnd = useMemo(() => mulberry32((p.seed + p.round * 9973) >>> 0), [p.seed, p.round]);
  const x = useMemo(() => 10 + rnd() * 80, [rnd]);
  const y = useMemo(() => 10 + rnd() * 70, [rnd]);
  const duration = useMemo(() => 1400 + Math.floor(rnd() * 1000), [rnd]);
  const [shrunk, setShrunk] = useState(false);
  const [resolved, setResolved] = useState(false);
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShrunk(true));
    missTimer.current = setTimeout(() => {
      setResolved((was) => { if (!was) p.onMiss(); return true; });
    }, duration + 60);
    return () => { cancelAnimationFrame(raf); if (missTimer.current) clearTimeout(missTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  function click() {
    if (resolved) return;
    setResolved(true);
    if (missTimer.current) clearTimeout(missTimer.current);
    p.onHit();
  }

  return (
    <div className="cmp-shrink-area">
      <button
        className="cmp-shrink-target"
        style={{ left: `${x}%`, top: `${y}%`, width: shrunk ? 8 : 80, height: shrunk ? 8 : 80, transitionDuration: `${duration}ms` }}
        onClick={click}
        aria-label="เป้าหมาย"
      />
      <p className="cmp-hint">คลิกวงกลมก่อนที่มันจะหดหายไป!</p>
    </div>
  );
}

function DragToBin(p: { item: DragItem | undefined; onDrop: () => void }) {
  const [over, setOver] = useState(false);
  const [dropped, setDropped] = useState(false);
  if (!p.item) return null;

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    if (dropped) return;
    setDropped(true);
    p.onDrop();
  }

  return (
    <div className="cmp-drag-area">
      <div
        className="cmp-drag-item"
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', p.item!.id)}
      >
        <span className="cmp-drag-ico">{p.item.icon}</span>
        <span className="cmp-drag-lbl">{p.item.label}</span>
      </div>
      <div
        className={`cmp-drag-zone${over ? ' over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={handleDrop}
      >
        <span className="cmp-drag-zone-ico">{RECYCLE_BIN.icon}</span>
        <span className="cmp-drag-zone-lbl">{RECYCLE_BIN.label}</span>
      </div>
      <p className="cmp-hint">ลากไฟล์ไปวางในถังขยะ</p>
    </div>
  );
}

// A small seeded shuffle-pick for any array — mirrors pickSeeded() in lib/compete-content.ts
// but stays generic, since that helper is typed specifically to DragItem.
function pickSeededGeneric<T>(bank: readonly T[], seed: number, n: number): T[] {
  const pool = bank.slice();
  const count = Math.max(0, Math.min(Math.floor(n), pool.length));
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rnd() * (pool.length - i));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  // If n exceeds the bank, cycle through a shuffled copy again rather than
  // running out — content banks are small and rounds can ask for more.
  if (n <= pool.length) return pool.slice(0, count);
  const out: T[] = [];
  while (out.length < n) out.push(...pool);
  return out.slice(0, n);
}

// Phase 2: an icon must be DOUBLE-clicked to "open" — single clicks are ignored,
// which is exactly the muscle-memory distinction kids often get wrong at first.
function DoubleClickIcon(p: { icon: DesktopIcon | undefined; onOpen: () => void }) {
  const [clicks, setClicks] = useState(0);
  const [opened, setOpened] = useState(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (!p.icon) return null;

  function handleClick() {
    if (opened) return;
    setClicks((c) => c + 1);
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => setClicks(0), 420); // two clicks must land close together
  }

  useEffect(() => {
    if (clicks >= 2 && !opened) {
      setOpened(true);
      if (clickTimer.current) clearTimeout(clickTimer.current);
      setTimeout(() => p.onOpen(), 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clicks]);

  return (
    <div className="cmp-dclick-area">
      <button className={`cmp-desktop-icon${opened ? ' opened' : ''}`} onClick={handleClick} aria-label={p.icon.label}>
        <span className="cmp-desktop-icon-glyph">{p.icon.icon}</span>
        <span className="cmp-desktop-icon-lbl">{p.icon.label}</span>
      </button>
      <p className="cmp-hint">{opened ? '✅ เปิดแล้ว!' : `ดับเบิลคลิกที่ "${p.icon.label}" เพื่อเปิด`}</p>
    </div>
  );
}

// Phase 4: right-click a file to reveal a context menu, then pick the one
// correct action among a few decoys (order shuffled per round).
function ContextMenuTask(p: { task: ContextTask | undefined; seed: number; onPick: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  if (!p.task) return null;

  const options = useMemo(() => {
    if (!p.task) return [];
    const opts = [p.task.action, ...p.task.decoys];
    const rnd = mulberry32(p.seed);
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.seed, p.task.id]);

  function choose(opt: string) {
    if (picked) return;
    setPicked(opt);
    setMenuOpen(false);
    if (opt === p.task!.action) setTimeout(() => p.onPick(), 350);
    else setTimeout(() => setPicked(null), 1100); // wrong pick — let them try again
  }

  return (
    <div className="cmp-ctxmen-area">
      <div className="cmp-ctxmen-goal">เป้าหมาย: เลือก <b>「{p.task.action}」</b> ให้ไฟล์นี้</div>
      <button
        className="cmp-ctxmen-file"
        onContextMenu={(e) => { e.preventDefault(); if (!picked) setMenuOpen(true); }}
        onClick={(e) => { e.preventDefault(); if (!picked) setMenuOpen((v) => !v); }}
      >
        <span className="cmp-drag-ico">{p.task.fileIcon}</span>
        <span className="cmp-drag-lbl">{p.task.fileLabel}</span>
      </button>
      {menuOpen && (
        <div className="cmp-ctxmenu">
          {options.map((opt) => (
            <button key={opt} className="cmp-ctxmenu-item" onClick={() => choose(opt)}>{opt}</button>
          ))}
        </div>
      )}
      {picked && (
        <p className={`cmp-hint${picked === p.task.action ? ' ok' : ' bad'}`}>
          {picked === p.task.action ? '✅ ถูกต้อง!' : `❌ ไม่ใช่ "${picked}" ลองคลิกขวาใหม่อีกครั้ง`}
        </p>
      )}
      {!picked && <p className="cmp-hint">คลิกขวาที่ไฟล์ (หรือแตะ) เพื่อเปิดเมนู</p>}
    </div>
  );
}

// ── file & window sorting ──
function FileSortRace(p: { seed: number; rounds: number; setScore: (fn: (s: number) => number) => void; setProgress: (v: number) => void; onDone: () => void }) {
  const items = useMemo<DragItem[]>(() => pickDragItems(FILESORT_ITEMS, p.seed, p.rounds), [p.seed, p.rounds]);
  const [round, setRound] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const item = items[round];
  if (!item) return null;

  function handleDrop(e: DragEvent, folderId: string) {
    e.preventDefault();
    if (folderId === item.folder) {
      const next = round + 1;
      p.setScore((s) => s + 1);
      p.setProgress(Math.round((next / p.rounds) * 100));
      if (next >= p.rounds) { p.onDone(); return; }
      setRound(next);
    } else {
      // Wrong folder bounces the item back — no round lost, matching the click-race
      // "a miss costs the point, not the round" philosophy.
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 300);
    }
  }

  return (
    <section className="cmp-card">
      <div className="cmp-round">รอบที่ {round + 1} / {p.rounds}</div>
      <div className="cmp-drag-area">
        <div
          className={`cmp-drag-item${wrongFlash ? ' bad' : ''}`}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
        >
          <span className="cmp-drag-ico">{item.icon}</span>
          <span className="cmp-drag-lbl">{item.label}</span>
        </div>
        <div className="cmp-folders">
          {FILESORT_FOLDERS.map((f) => (
            <div
              key={f.id}
              className="cmp-folder"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, f.id)}
            >
              <span className="cmp-folder-ico">{f.icon}</span>
              <span className="cmp-folder-lbl">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="cmp-hint">ลากไฟล์ไปใส่โฟลเดอร์ให้ถูก ใส่ผิดก็แค่ลองใหม่</p>
    </section>
  );
}

// ── real vs. scam speed quiz ──
// Wrong-but-fast used to still win the race, because progress advanced on every
// answer regardless of correctness — spamming any button reached the finish line
// fastest. Now a right answer moves you FORWARD one step and a wrong (or timed
// out) answer knocks you BACK one step, so only genuinely reading and judging
// each prompt correctly gets you to the finish line. The question pool is drawn
// larger than `rounds` so retreating and re-advancing doesn't just replay the
// same prompt over and over.
const SCAM_BUZZ_MS = 10_000;
function ScamQuizRace(p: { seed: number; rounds: number; setScore: (fn: (s: number) => number) => void; setProgress: (v: number) => void; onDone: () => void }) {
  const pool = useMemo<ScamQ[]>(() => pickScamQuiz(p.seed, Math.max(p.rounds * 2, p.rounds)), [p.seed, p.rounds]);
  const [attempt, setAttempt] = useState(0);
  const [position, setPosition] = useState(0);
  const [picked, setPicked] = useState<ScamQ['category'] | null>(null);

  const q = pool[attempt % pool.length];
  if (!q) return null;

  function choose(cat: ScamQ['category'] | null) {
    if (picked !== null) return;
    setPicked(cat ?? '__timeout__' as ScamQ['category']);
    const right = cat === q.category;
    const nextPos = right ? position + 1 : Math.max(0, position - 1);
    if (right) p.setScore((s) => s + 1);
    p.setProgress(Math.round((nextPos / p.rounds) * 100));
    setTimeout(() => {
      if (nextPos >= p.rounds) { p.onDone(); return; }
      setPosition(nextPos);
      setAttempt((a) => a + 1);
      setPicked(null);
    }, right ? 900 : 1600);
  }

  const cats: { key: ScamQ['category']; label: string; icon: string; cls: string }[] = [
    { key: 'safe', label: 'ปลอดภัย', icon: '✅', cls: 'safe' },
    { key: 'scam', label: 'หลอกลวง', icon: '🎣', cls: 'scam' },
    { key: 'dangerous', label: 'อันตราย', icon: '🚨', cls: 'danger' },
  ];

  return (
    <section className="cmp-card">
      <div className="cmp-round">ระยะทาง {position} / {p.rounds} · ข้อที่ {attempt + 1}</div>
      <BuzzTimer key={attempt} active={picked === null} onTimeout={() => choose(null)} />
      <div className="cmp-q">
        <span className="cmp-q-ico">{q.kind === 'popup' ? '🔔' : q.kind === 'email' ? '📧' : q.kind === 'website' ? '🌐' : '💬'}</span>
        <span className="cmp-q-txt">{q.text}</span>
        <Speaker say={q.text} />
      </div>
      <div className="cmp-scam-opts">
        {cats.map((c) => {
          const cls = picked === null ? '' : c.key === q.category ? ' correct' : c.key === picked ? ' wrong' : '';
          return (
            <button key={c.key} className={`cmp-scam-opt ${c.cls}${cls}`} onClick={() => choose(c.key)} disabled={picked !== null}>
              <span>{c.icon}</span>{c.label}
              <Speaker say={c.label} size="sm" />
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={`cmp-why${picked === q.category ? ' ok' : ' bad'}`}>
          {picked === q.category ? '✅ ถูกต้อง! ' : '❌ ยังไม่ใช่ — '}{q.why}
          <Speaker say={q.why} />
        </div>
      )}
    </section>
  );
}

// A per-question countdown bar. Mounted fresh (via a `key={i}` on the parent)
// for every question, so its own timer state never needs resetting from an
// effect — it just starts clean each time it is created.
function BuzzTimer(p: { active: boolean; onTimeout: () => void }) {
  const [msLeft, setMsLeft] = useState(SCAM_BUZZ_MS);
  const startRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!p.active) return;
    startRef.current = Date.now();
    const iv = setInterval(() => {
      const left = SCAM_BUZZ_MS - (Date.now() - (startRef.current ?? Date.now()));
      setMsLeft(Math.max(0, left));
      if (left <= 0 && !firedRef.current) { firedRef.current = true; clearInterval(iv); p.onTimeout(); }
    }, 100);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.active]);

  const pct = Math.round((msLeft / SCAM_BUZZ_MS) * 100);
  return <div className="cmp-buzz-bar"><div className="cmp-buzz-fill" style={{ width: `${pct}%` }} /></div>;
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
  const top3 = sorted.slice(0, 3);
  // Podium display order is 2nd–1st–3rd (tallest block in the middle), not rank order.
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as Player[];
  const heights: Record<number, number> = { 0: 150, 1: 190, 2: 120 };

  return (
    <>
      <section className="cmp-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 62, lineHeight: 1 }}>{myPos === 1 ? '🏆' : '🎉'}</div>
        <h3 className="cmp-h3" style={{ marginTop: 8 }}>
          {myPos === 1 ? 'ชนะแล้ว! เก่งมาก' : `หนูได้ที่ ${myPos} จาก ${sorted.length} คน`}
        </h3>
        <p style={{ fontFamily: 'Sarabun', color: 'var(--muted)' }}>ลองอีกรอบสิ เดี๋ยวก็เร็วขึ้น!</p>
      </section>

      {top3.length > 0 && (
        <section className="cmp-card cmp-podium-card">
          <div className="cmp-podium">
            {podiumOrder.map((pl) => {
              const rank = sorted.findIndex((x) => x.id === pl.id);
              return (
                <div key={pl.id} className={`cmp-podium-col rank${rank + 1}${pl.id === p.meId ? ' me' : ''}`}>
                  <div className="cmp-podium-medal">{medals[rank]}</div>
                  <div className="cmp-podium-av">{pl.avatar}</div>
                  <div className="cmp-podium-name">{pl.name}{pl.id === p.meId ? ' (หนู)' : ''}</div>
                  <div className="cmp-podium-score">{pl.score} คะแนน</div>
                  <div className="cmp-podium-block" style={{ height: heights[rank] ?? 100 }}>
                    <span>{rank + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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

.cmp-podium-card{background:linear-gradient(180deg,#FFF8E8,#fff);}
.cmp-podium{display:flex;align-items:flex-end;justify-content:center;gap:14px;padding-top:10px;}
.cmp-podium-col{display:flex;flex-direction:column;align-items:center;width:110px;}
.cmp-podium-medal{font-size:26px;line-height:1;margin-bottom:2px;}
.cmp-podium-av{font-size:34px;line-height:1;margin-bottom:4px;}
.cmp-podium-name{font:700 14px/1.2 'Mitr';color:var(--ink);text-align:center;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.cmp-podium-score{font:600 12px/1.4 'Sarabun';color:var(--muted2);margin-bottom:8px;}
.cmp-podium-block{width:100%;border-radius:14px 14px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:10px;font:700 26px/1 'Mitr';color:#fff;}
.cmp-podium-col.rank1 .cmp-podium-block{background:linear-gradient(180deg,#FFD65C,#F0982E);box-shadow:inset 0 3px 0 rgba(255,255,255,.4);}
.cmp-podium-col.rank2 .cmp-podium-block{background:linear-gradient(180deg,#D7DEE8,#9AA7B8);box-shadow:inset 0 3px 0 rgba(255,255,255,.4);}
.cmp-podium-col.rank3 .cmp-podium-block{background:linear-gradient(180deg,#E3B48A,#B9793F);box-shadow:inset 0 3px 0 rgba(255,255,255,.4);}
.cmp-podium-col.me .cmp-podium-name{color:var(--green-d);}

@media(max-width:520px){
  .cmp-podium-col{width:78px;}
  .cmp-podium-name{max-width:74px;font-size:12px;}
}


@media(max-width:820px){
  .cmp-modes{grid-template-columns:1fr;}
  .cmp-code-big{font-size:46px;letter-spacing:8px;}
  .cmp-bar-name{width:64px;}
}

/* ── level selector ── */
.cmp-levels{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.cmp-level{display:flex;flex-direction:column;gap:4px;padding:14px 10px;border:2px solid var(--line);border-bottom:5px solid var(--line-d);border-radius:16px;background:#fff;cursor:pointer;font-family:inherit;text-align:center;transition:transform .12s;}
.cmp-level:hover{transform:translateY(-2px);}
.cmp-level.on{background:#FFFBF0;border-color:var(--gold);}
.cmp-level-name{font:700 15px/1.2 'Mitr';color:var(--ink);}
.cmp-level-desc{font:500 12px/1.3 'Sarabun';color:var(--muted2);}
@media(max-width:520px){.cmp-levels{grid-template-columns:repeat(2,1fr);}}

/* ── live race track (prominent for typing mode) ── */
.cmp-track-card{background:linear-gradient(180deg,#FFFBF0,#fff);}
.cmp-bars-big .cmp-bar-row{padding:6px 0;}
.cmp-bar-row.big .cmp-bar-track{height:30px;background:repeating-linear-gradient(90deg,var(--cream2) 0 18px,#F2ECDD 18px 20px);border:2px solid var(--line);}
.cmp-bar-row.big .cmp-bar-av,.cmp-bar-row.big .cmp-bar-runner{font-size:30px;}
.cmp-bar-row.big .cmp-bar-runner{top:-9px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.25));}
.cmp-bar-row.big .cmp-bar-name{width:110px;font-size:15px;}
.cmp-bar-flag{position:absolute;right:-4px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none;}
.cmp-bar-row.big .cmp-bar-flag{font-size:24px;right:-8px;}

/* ── click & drag sprint: shrinking target ── */
.cmp-shrink-area{position:relative;height:260px;background:var(--cream);border-radius:16px;overflow:hidden;}
.cmp-shrink-target{position:absolute;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFD65C,#F0982E);border:3px solid #D07E1E;cursor:pointer;transform:translate(-50%,-50%);transition-property:width,height;transition-timing-function:linear;padding:0;}

/* ── drag & drop ── */
.cmp-drag-area{display:flex;align-items:center;justify-content:space-around;gap:18px;flex-wrap:wrap;padding:20px 0;}
.cmp-drag-item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 20px;border:2px solid var(--line);border-bottom:5px solid var(--line-d);border-radius:18px;background:#fff;cursor:grab;user-select:none;transition:transform .12s,background .15s;}
.cmp-drag-item.bad{background:#FFECEC;border-color:#F19999;animation:cmpshake .3s;}
.cmp-drag-item:active{cursor:grabbing;}
.cmp-drag-ico{font-size:38px;}
.cmp-drag-lbl{font:600 13px/1.2 'Sarabun';color:var(--muted);}
.cmp-drag-zone{display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px 26px;border:3px dashed var(--line-d);border-radius:20px;background:var(--cream);min-width:120px;transition:background .15s,border-color .15s;}
.cmp-drag-zone.over{background:var(--green-soft);border-color:var(--green);}
.cmp-drag-zone-ico{font-size:34px;}
.cmp-drag-zone-lbl{font:700 13px/1.2 'Mitr';color:var(--muted);}
.cmp-folders{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;}
.cmp-folder{display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 20px;border:3px dashed var(--line-d);border-radius:18px;background:var(--cream);min-width:100px;transition:background .15s,border-color .15s;}
.cmp-folder:hover{background:var(--green-soft);border-color:var(--green);}
.cmp-folder-ico{font-size:32px;}
.cmp-folder-lbl{font:700 13px/1.2 'Mitr';color:var(--muted);}
@keyframes cmpshake{0%,100%{transform:translateX(0);}25%{transform:translateX(-6px);}75%{transform:translateX(6px);}}

.cmp-dclick-area{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:30px 0;min-height:200px;}
.cmp-desktop-icon{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 26px;border:2px solid var(--line);border-bottom:5px solid var(--line-d);border-radius:18px;background:#fff;cursor:pointer;user-select:none;transition:transform .1s,background .15s;}
.cmp-desktop-icon:active{transform:translateY(2px);}
.cmp-desktop-icon.opened{background:var(--green-soft);border-color:var(--green);}
.cmp-desktop-icon-glyph{font-size:46px;}
.cmp-desktop-icon-lbl{font:600 13px/1.2 'Sarabun';color:var(--muted);}

.cmp-ctxmen-area{display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px 0;position:relative;}
.cmp-ctxmen-goal{font:600 14px/1.5 'Sarabun';color:var(--ink);text-align:center;}
.cmp-ctxmen-file{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 20px;border:2px solid var(--line);border-bottom:5px solid var(--line-d);border-radius:18px;background:#fff;cursor:context-menu;user-select:none;}
.cmp-ctxmenu{display:flex;flex-direction:column;background:#fff;border:2px solid var(--line-d);border-radius:12px;box-shadow:0 10px 26px rgba(0,0,0,.18);overflow:hidden;min-width:180px;}
.cmp-ctxmenu-item{padding:11px 16px;text-align:left;background:#fff;border:none;border-bottom:1px solid var(--line);font:500 14px/1 'Sarabun';color:var(--ink);cursor:pointer;}
.cmp-ctxmenu-item:last-child{border-bottom:none;}
.cmp-ctxmenu-item:hover{background:var(--green-soft);}
.cmp-hint.ok{color:var(--green-d);font-weight:700;}
.cmp-hint.bad{color:#B42318;font-weight:700;}

/* ── scam speed quiz ── */
.cmp-buzz-bar{height:8px;border-radius:99px;background:var(--cream2);overflow:hidden;margin-bottom:16px;}
.cmp-buzz-fill{height:100%;background:linear-gradient(90deg,#5CD35B,#F0982E,#DC2626);transition:width .1s linear;}
.cmp-scam-opts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.cmp-scam-opt{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 8px;border:2px solid var(--line);border-bottom:5px solid var(--line-d);border-radius:16px;background:#fff;cursor:pointer;font:700 14px/1.2 'Mitr';color:var(--ink);transition:transform .12s;}
.cmp-scam-opt span{font-size:26px;}
.cmp-scam-opt:hover:not(:disabled){transform:translateY(-2px);}
.cmp-scam-opt:disabled{cursor:default;}
.cmp-scam-opt.correct{background:var(--green-soft);border-color:var(--green);}
.cmp-scam-opt.wrong{background:#FFECEC;border-color:#F19999;}
@media(max-width:520px){.cmp-scam-opts{grid-template-columns:1fr;}}
`;
