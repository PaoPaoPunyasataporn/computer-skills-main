'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { AREAS, type Game, type Module } from '@/lib/content';
import { saveProgress } from '@/lib/progress';
import { computeStats, recordDaily } from '@/lib/gamify';
import GameOverlay from '@/components/GameOverlay';

const AI_AREA = AREAS.find((a) => a.num === 6);
const MODULES: Module[] = AI_AREA?.modules ?? [];

// Same accent sequence as the digital-literacy AREA_STYLE (areas 0-5): blue, blue,
// green, purple, orange, green — one AI module maps to each digital-literacy color.
const CARD_STYLE = [
  { orb: 'linear-gradient(135deg,#DCE9FF,#A9CCFF)', accent: '#3A82F6', accentL: '#5CA0FF', edge: '#2E64D6' },
  { orb: 'linear-gradient(135deg,#CFE9FF,#9CCBFF)', accent: '#2E9BFF', accentL: '#4FB0FF', edge: '#2277CC' },
  { orb: 'linear-gradient(135deg,#DFF6E4,#B0EAC1)', accent: '#38A93A', accentL: '#5CD35B', edge: '#2E8B30' },
  { orb: 'linear-gradient(135deg,#ECE0FF,#C9AEFF)', accent: '#9A5CF0', accentL: '#B583F5', edge: '#7C3EE0' },
  { orb: 'linear-gradient(135deg,#FFE2DF,#FFC0B9)', accent: '#F0982E', accentL: '#FFB456', edge: '#D07E1E' },
  { orb: 'linear-gradient(135deg,#D9F3E0,#B4E6C2)', accent: '#2E9A57', accentL: '#46BD73', edge: '#227A44' },
];

export default function AiHome() {
  return (
    <Suspense fallback={null}>
      <AiHomeInner />
    </Suspense>
  );
}

function AiHomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleKey = searchParams.get('m');
  const openModule = MODULES.find((m) => m.key === moduleKey) ?? null;
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [xp, setXp] = useState(0);
  const [quickGame, setQuickGame] = useState<{ area: number; game: Game } | null>(null);

  function loadStats() {
    setXp(computeStats().xp);
  }

  function openModuleView(m: Module) {
    router.push(`/ai?m=${encodeURIComponent(m.key)}`, { scroll: false });
  }
  function closeModuleView() {
    // router.push('/ai') alone silently no-ops here: this page is statically
    // prerendered, and dropping a search param via router.push/replace hits a
    // known Next.js 16.2+ App Router regression where the client route cache
    // restores the stale query string instead of navigating
    // (vercel/next.js#92187). A hard navigation sidesteps the buggy cache
    // entirely and is the only combination that reliably lands on plain /ai.
    window.location.href = '/ai';
  }

  // Move focus to the new section heading whenever the drilled-down module
  // changes, so keyboard/screen-reader users aren't silently left behind on
  // the old subtree after the grid swaps out.
  useEffect(() => { headingRef.current?.focus(); }, [moduleKey]);

  function finishQuickGame() {
    if (quickGame) {
      saveProgress(quickGame.area, quickGame.game.code, 3, 0, 0);
      recordDaily();
      loadStats();
    }
    setQuickGame(null);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadStats(); }, []);

  const level = Math.floor(xp / 300) + 1;
  const nextLevelXp = level * 300;
  const xpPct = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  return (
    <div className="page">
      <div className="shell">
        <div className="appwin">
          <TopBar />
          <div className="appbody">

            <div className="banner blue" style={{ gap: 22 }}>
              <div style={{ width: 88, height: 88, borderRadius: 26, background: 'rgba(255,255,255,.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, boxShadow: 'inset 0 -5px 0 rgba(0,0,0,.08)' }}>🧠</div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 28 }}>รู้เท่าทัน AI!</div>
                <div className="banner-sub" style={{ color: '#FFE6E1' }}>เลเวล {level}</div>
              </div>
              <div style={{ minWidth: 210 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Sarabun', fontWeight: 600, fontSize: 13, color: '#FFE6E1', marginBottom: 8 }}><span>สู่เลเวลถัดไป</span><span>{xp} / {nextLevelXp} XP</span></div>
                <div className="goal-track"><div className="goal-fill" style={{ width: `${xpPct}%` }} /></div>
              </div>
            </div>

            {AI_AREA && !openModule && (
              <div className="section">
                <div className="sec-head">
                  <span className="sec-ico" style={{ background: 'linear-gradient(135deg,#FFE9C7,#FFCB8A)', boxShadow: '0 5px 0 #FFCB8A' }}>✨</span>
                  <div style={{ flex: 1 }}>
                    <h3 className="sec-title" ref={headingRef} tabIndex={-1} style={{ outline: 'none' }}>หลักสูตรทักษะ AI</h3>
                    <p className="sec-desc">เลือกโมดูล แล้วเรียนทีละบทเรียนตามลำดับ — ตรวจสอบก่อนเชื่อ รู้ทันมิจฉาชีพ และสั่งงาน AI เป็น</p>
                  </div>
                </div>
                <div className="grid3">
                  {MODULES.map((m, i) => {
                    const st = CARD_STYLE[i % CARD_STYLE.length];
                    return (
                      <button
                        key={m.key}
                        type="button"
                        className="card3d unit"
                        onClick={() => openModuleView(m)}
                        style={{ borderBottomColor: st.edge, textAlign: 'left', cursor: 'pointer' }}
                      >
                        <div className="unit-top">
                          <span className="unit-orb" style={{ background: st.orb }}>{m.icon}</span>
                          <div>
                            <div className="unit-lbl" style={{ color: st.accent }}>โมดูลที่ {i + 1}</div>
                            <div className="unit-name">{m.title}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--muted2)', margin: '2px 0 14px' }}>
                          {m.sub}
                          <span style={{ display: 'inline-block', marginLeft: 8, padding: '1px 8px', borderRadius: 10, background: '#FFF0D6', color: '#C58A00', fontWeight: 700, fontSize: 11 }}>📖 {m.games.length} บทเรียน</span>
                        </div>
                        <div className="unit-foot" style={{ justifyContent: 'flex-end' }}>
                          <span className="unit-go" style={{ background: `linear-gradient(135deg,${st.accentL},${st.accent})`, boxShadow: `0 5px 0 ${st.edge}` }}>▶</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {AI_AREA && openModule && (
              <div className="section">
                <button
                  type="button"
                  onClick={closeModuleView}
                  className="btn-ghost3d"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18, cursor: 'pointer' }}
                >
                  ← กลับไปดูโมดูลทั้งหมด
                </button>
                <div className="sec-head">
                  <span className="sec-ico" style={{ background: 'linear-gradient(135deg,#FFE9C7,#FFCB8A)', boxShadow: '0 5px 0 #FFCB8A' }}>{openModule.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3 className="sec-title" ref={headingRef} tabIndex={-1} style={{ outline: 'none' }}>{openModule.title}</h3>
                    <p className="sec-desc">{openModule.sub}</p>
                  </div>
                </div>
                <div className="grid3">
                  {openModule.games.map((g, i) => {
                    const st = CARD_STYLE[i % CARD_STYLE.length];
                    return (
                      <button
                        key={g.code}
                        type="button"
                        className="card3d unit"
                        onClick={() => setQuickGame({ area: AI_AREA.num, game: g })}
                        style={{ borderBottomColor: st.edge, textAlign: 'left', cursor: 'pointer' }}
                      >
                        <div className="unit-top">
                          <span className="unit-orb" style={{ background: st.orb }}>{g.icon}</span>
                          <div>
                            <div className="unit-lbl" style={{ color: st.accent }}>บทเรียนที่ {i + 1}</div>
                            <div className="unit-name">{g.th}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--muted2)', margin: '2px 0 14px' }}>
                          {g.desc}
                        </div>
                        <div className="unit-foot" style={{ justifyContent: 'flex-end' }}>
                          <span className="unit-go" style={{ background: `linear-gradient(135deg,${st.accentL},${st.accent})`, boxShadow: `0 5px 0 ${st.edge}` }}>▶</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 30, fontSize: 13, color: 'var(--muted2)', lineHeight: 1.8 }}>
              ทักษะ AI เพื่อการใช้งานอย่างปลอดภัยและรู้เท่าทัน · พัฒนาโดย <b>PaoPao Punyasataporn</b><br />
              <Link href="/" style={{ color: 'var(--green-d)', fontWeight: 600 }}>← กลับหน้าทักษะดิจิทัล</Link>
            </div>

            <p style={{ textAlign: 'center', maxWidth: 560, margin: '14px auto 0', fontSize: 11.5, color: 'var(--muted3)', lineHeight: 1.7 }}>
              เกมในหมวดนี้จำลองหน้าจอและวิธีสั่งงานเครื่องมือ AI ของผู้ให้บริการภายนอก เช่น <b>Google Gemini</b>{' '}
              เพื่อการศึกษาเท่านั้น เว็บไซต์นี้ไม่มีความเกี่ยวข้อง ไม่ได้รับการสนับสนุน หรือรับรองจากผู้ให้บริการดังกล่าวแต่อย่างใด
              ชื่อผลิตภัณฑ์ เครื่องหมายการค้า และหน้าตาโปรแกรมที่ปรากฏเป็นทรัพย์สินของเจ้าของนั้น ๆ และอาจเปลี่ยนแปลงไปจากของจริงตามเวลา
            </p>

          </div>
        </div>
      </div>

      {quickGame && <GameOverlay game={quickGame.game} onFinish={finishQuickGame} onAbandon={() => setQuickGame(null)} />}
    </div>
  );
}
