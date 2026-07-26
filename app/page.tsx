'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { AREAS, FINAL_BOSS } from '@/lib/content';
import { saveProgress } from '@/lib/progress';
import { computeStats, recordDaily } from '@/lib/gamify';
import GameOverlay, { type BossScore } from '@/components/GameOverlay';
import CertificateModal from '@/components/CertificateModal';

type Style = { orb: string; accent: string; accentL: string; edge: string; desc: string };
const AREA_STYLE: Record<number, Style> = {
  0: { orb: 'linear-gradient(135deg,#DCE9FF,#A9CCFF)', accent: '#3A82F6', accentL: '#5CA0FF', edge: '#2E64D6', desc: 'รู้จักเครื่อง · เมาส์ · แป้นพิมพ์' },
  1: { orb: 'linear-gradient(135deg,#CFE9FF,#9CCBFF)', accent: '#2E9BFF', accentL: '#4FB0FF', edge: '#2277CC', desc: 'ค้นหา · ดูว่าจริงหรือหลอก · จัดเก็บ' },
  2: { orb: 'linear-gradient(135deg,#DFF6E4,#B0EAC1)', accent: '#38A93A', accentL: '#5CD35B', edge: '#2E8B30', desc: 'คุย · แบ่งปัน · มารยาท · ตัวตนดิจิทัล' },
  3: { orb: 'linear-gradient(135deg,#ECE0FF,#C9AEFF)', accent: '#9A5CF0', accentL: '#B583F5', edge: '#7C3EE0', desc: 'สร้างงาน · ลิขสิทธิ์ · เขียนโปรแกรม' },
  4: { orb: 'linear-gradient(135deg,#FFE2DF,#FFC0B9)', accent: '#F0982E', accentL: '#FFB456', edge: '#D07E1E', desc: 'ปกป้องเครื่อง · ข้อมูล · สุขภาพ · สิ่งแวดล้อม' },
  5: { orb: 'linear-gradient(135deg,#D9F3E0,#B4E6C2)', accent: '#2E9A57', accentL: '#46BD73', edge: '#227A44', desc: 'แก้ปัญหาเครื่อง · เลือกเครื่องมือ · คิดใหม่' },
};

export default function Home() {
  const [xp, setXp] = useState(0);
  const [bossOpen, setBossOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [bossScore, setBossScore] = useState<BossScore | null>(null);

  function loadStats() {
    setXp(computeStats().xp);
  }

  // Only ever called once the boss fight itself reports a pass (see GameOverlay).
  // Track locally for the XP meter, then ask for the child's name so we can
  // issue (and record) their certificate — with their score.
  function finishBoss(score?: BossScore | null) {
    saveProgress(5, FINAL_BOSS.code, 3, 0, 0);
    recordDaily();
    loadStats();
    setBossScore(score ?? null);
    setBossOpen(false);
    setCertOpen(true);
  }

  // Quit half-way through the test: nothing is saved, no certificate. They start over.
  function abandonBoss() {
    setBossOpen(false);
  }

  // localStorage is client-only, so stats must load after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadStats(); }, []);

  function areaCard(a: (typeof AREAS)[number]) {
    const st = AREA_STYLE[a.num];
    const lbl = a.num === 0 ? 'เริ่มต้น' : `ด้านที่ ${a.num}`;
    return (
      <Link key={a.num} className="card3d unit" href={`/area/${a.num}`} style={{ borderBottomColor: st.edge }}>
        <div className="unit-top">
          <span className="unit-orb" style={{ background: st.orb }}>{a.mascot}</span>
          <div>
            <div className="unit-lbl" style={{ color: st.accent }}>{lbl}</div>
            <div className="unit-name">{a.title}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted2)', margin: '2px 0 14px' }}>
          {st.desc}
          {a.games && a.games.length > 0 && (
            <span style={{ display: 'inline-block', marginLeft: 8, padding: '1px 8px', borderRadius: 10, background: '#FFF0D6', color: '#C58A00', fontWeight: 700, fontSize: 11 }}>🎮 {a.games.length} เกม</span>
          )}
        </div>
        <div className="unit-foot" style={{ justifyContent: 'flex-end' }}>
          <span className="unit-go" style={{ background: `linear-gradient(135deg,${st.accentL},${st.accent})`, boxShadow: `0 5px 0 ${st.edge}` }}>▶</span>
        </div>
      </Link>
    );
  }

  const level = Math.floor(xp / 300) + 1;
  const nextLevelXp = level * 300;
  const xpPct = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  return (
    <div className="page">
      <div className="shell">
        <div className="appwin">
          <TopBar />
          <div className="appbody">

            <div className="banner green" style={{ gap: 22 }}>
              <div style={{ width: 88, height: 88, borderRadius: 26, background: 'rgba(255,255,255,.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, boxShadow: 'inset 0 -5px 0 rgba(0,0,0,.08)' }}>🦉</div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 28 }}>มาเล่นเรียนรู้กันเถอะ!</div>
                <div className="banner-sub">เลเวล {level}</div>
              </div>
              <div style={{ minWidth: 210 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Sarabun', fontWeight: 600, fontSize: 13, color: '#EAFBE6', marginBottom: 8 }}><span>สู่เลเวลถัดไป</span><span>{xp} / {nextLevelXp} XP</span></div>
                <div className="goal-track"><div className="goal-fill" style={{ width: `${xpPct}%` }} /></div>
              </div>
            </div>

            <div className="section">
              <div className="sec-head">
                <span className="sec-ico" style={{ background: 'linear-gradient(135deg,#DFF6E4,#B7ECC4)', boxShadow: '0 5px 0 #B7ECC4' }}>📚</span>
                <div style={{ flex: 1 }}>
                  <h3 className="sec-title">คอร์สทักษะคอมพิวเตอร์</h3>
                  <p className="sec-desc">เล่นเกมเรียนรู้ทักษะดิจิทัลตามมาตรฐาน DigComp 3.0 ครบทั้ง 5 ด้าน</p>
                </div>
              </div>
              <div className="grid3">{AREAS.map(areaCard)}</div>

              {/* ===== Final Boss capstone — tests skills from every area ===== */}
              <button
                onClick={() => setBossOpen(true)}
                className="card3d"
                style={{ width: '100%', marginTop: 20, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 18, padding: '20px 24px', border: 'none', borderRadius: 20, cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg,#7C3EE0,#4a2c8f)', boxShadow: '0 6px 0 #3a2270', flexWrap: 'wrap' }}
              >
                <span style={{ width: 66, height: 66, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, animation: 'csfloat 3s ease-in-out infinite' }}>{FINAL_BOSS.icon}</span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 12, opacity: 0.85, letterSpacing: 0.5 }}>ด่านสุดท้าย · รวมทุกด้าน</div>
                  <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 22, lineHeight: 1.15 }}>{FINAL_BOSS.th}</div>
                  <div style={{ fontFamily: 'Sarabun', fontSize: 14, opacity: 0.9 }}>{FINAL_BOSS.desc}</div>
                </div>
                <span style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 16, background: 'linear-gradient(135deg,#FFC24B,#F0982E)', color: '#5a2e00', padding: '10px 20px', borderRadius: 14, boxShadow: '0 4px 0 #C97F1E' }}>เริ่มเลย ▶</span>
              </button>

              {/* ===== Competition area — race a friend, no accounts needed ===== */}
              <Link
                href="/compete"
                className="card3d"
                style={{ width: '100%', marginTop: 20, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 18, padding: '20px 24px', border: 'none', borderRadius: 20, cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg,#FFB456,#F0982E)', boxShadow: '0 6px 0 #C97F1E', flexWrap: 'wrap' }}
              >
                <span style={{ width: 66, height: 66, borderRadius: '50%', background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, animation: 'csfloat 3s ease-in-out infinite' }}>🏁</span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 12, opacity: 0.9, letterSpacing: 0.5 }}>สนามแข่งขัน · เล่นกับเพื่อน</div>
                  <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 22, lineHeight: 1.15 }}>แข่งกับเพื่อน!</div>
                  <div style={{ fontFamily: 'Sarabun', fontSize: 14, opacity: 0.95 }}>แข่งพิมพ์ดีด · แข่งคลิกเมาส์ · แข่งตอบสถานการณ์ — สร้างห้องแล้วบอกรหัสให้เพื่อน</div>
                </div>
                <span style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 16, background: '#fff', color: '#C97F1E', padding: '10px 20px', borderRadius: 14, boxShadow: '0 4px 0 rgba(0,0,0,.12)' }}>เข้าสนาม ▶</span>
              </Link>
            </div>

            <div style={{ textAlign: 'center', marginTop: 30, fontSize: 13, color: 'var(--muted2)', lineHeight: 1.8 }}>
              อ้างอิง <b>DigComp 3.0</b> (JRC, 2025) · พัฒนาโดย <b>PaoPao Punyasataporn</b><br />
              <Link href="/admin" style={{ color: 'var(--green-d)', fontWeight: 600 }}>ผู้ดูแลระบบ →</Link>
            </div>

          </div>
        </div>
      </div>

      {bossOpen && <GameOverlay game={FINAL_BOSS} isTest onFinish={finishBoss} onAbandon={abandonBoss} />}
      {certOpen && <CertificateModal score={bossScore} onClose={() => setCertOpen(false)} />}
    </div>
  );
}
