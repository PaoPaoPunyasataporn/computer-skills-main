'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import AreaCard from '@/components/AreaCard';
import { AREAS, FINAL_BOSS, type Game } from '@/lib/content';
import { saveProgress } from '@/lib/progress';
import { computeStats, recordDaily } from '@/lib/gamify';
import GameOverlay, { type BossScore } from '@/components/GameOverlay';
import CertificateModal from '@/components/CertificateModal';

const MAIN_AREAS = AREAS.filter((a) => a.num <= 5);

export default function Home() {
  const [xp, setXp] = useState(0);
  const [bossOpen, setBossOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [bossScore, setBossScore] = useState<BossScore | null>(null);
  const [quickGame, setQuickGame] = useState<{ area: number; game: Game } | null>(null);

  function loadStats() {
    setXp(computeStats().xp);
  }

  function finishQuickGame() {
    if (quickGame) {
      saveProgress(quickGame.area, quickGame.game.code, 3, 0, 0);
      recordDaily();
      loadStats();
    }
    setQuickGame(null);
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
              <div className="grid3">{MAIN_AREAS.map((a) => <AreaCard key={a.num} area={a} onDirectOpen={(area, game) => setQuickGame({ area, game })} />)}</div>

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
                  <div style={{ fontFamily: 'Sarabun', fontSize: 14, opacity: 0.95 }}>แข่งพิมพ์ดีด · แข่งคลิกไว & ลากวาง · แข่งจัดระเบียบไฟล์ · แข่งจับเท็จ — สร้างห้องแล้วบอกรหัสให้เพื่อน</div>
                </div>
                <span style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 16, background: '#fff', color: '#C97F1E', padding: '10px 20px', borderRadius: 14, boxShadow: '0 4px 0 rgba(0,0,0,.12)' }}>เข้าสนาม ▶</span>
              </Link>
            </div>

            <div style={{ textAlign: 'center', marginTop: 30, fontSize: 13, color: 'var(--muted2)', lineHeight: 1.8 }}>
              อ้างอิง <b>DigComp 3.0</b> (JRC, 2025) · พัฒนาโดย <b>PaoPao Punyasataporn</b><br />
              <Link href="/admin" style={{ color: 'var(--green-d)', fontWeight: 600 }}>ผู้ดูแลระบบ →</Link>
            </div>

            <p style={{ textAlign: 'center', maxWidth: 560, margin: '14px auto 0', fontSize: 11.5, color: 'var(--muted3)', lineHeight: 1.7 }}>
              เว็บไซต์นี้ได้รับแรงบันดาลใจจากกรอบสมรรถนะ <b>DigComp 3.0</b> ของศูนย์วิจัยร่วม (Joint Research Centre)
              แห่งสหภาพยุโรป จัดทำขึ้นเพื่อการศึกษาเท่านั้น ไม่ใช่หลักสูตรหรือสื่อการสอนอย่างเป็นทางการ
              และไม่ได้รับการรับรองหรือสนับสนุนจาก JRC หรือสหภาพยุโรปแต่อย่างใด
            </p>

          </div>
        </div>
      </div>

      {bossOpen && <GameOverlay game={FINAL_BOSS} isTest onFinish={finishBoss} onAbandon={abandonBoss} />}
      {certOpen && <CertificateModal score={bossScore} onClose={() => setCertOpen(false)} />}
      {quickGame && <GameOverlay game={quickGame.game} onFinish={finishQuickGame} onAbandon={() => setQuickGame(null)} />}
    </div>
  );
}
