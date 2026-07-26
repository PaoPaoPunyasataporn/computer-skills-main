'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Area, Game } from '@/lib/content';
import { saveProgress } from '@/lib/progress';
import { recordDaily } from '@/lib/gamify';
import GameOverlay from '@/components/GameOverlay';

export default function LessonApp({ area }: { area: Area }) {
  const [game, setGame] = useState<Game | null>(null);

  function openGame(g: Game) { setGame(g); }
  function finishGame(g: Game) {
    // Still tracked locally so the XP meter keeps rising — but the cards no
    // longer show any "done" checkmark or star badge.
    saveProgress(area.num, g.code, 3, 0, 0);
    recordDaily();
    setGame(null);
  }

  return (
    <div className="page">
      <div className="shell">
        <div className="appwin" style={{ background: '#FFFDF6' }}>
          <div style={{ background: 'linear-gradient(135deg,#5CD35B,#3BA93C)', padding: '30px clamp(20px,5vw,90px)', display: 'flex', alignItems: 'center', gap: 22, color: '#fff', flexWrap: 'wrap' }}>
            <span style={{ width: 92, height: 92, borderRadius: '50%', background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, animation: 'csfloat 3s ease-in-out infinite' }}>{area.mascot}</span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 13, opacity: 0.9, marginBottom: 6 }}>DigComp 3.0 · ด้านที่ {area.num} · {area.games.length} เกม</div>
              <h2 style={{ fontWeight: 700, fontSize: 28, lineHeight: 1.15, margin: '0 0 6px' }}>{area.title}</h2>
              <p style={{ fontFamily: 'Sarabun', fontWeight: 500, fontSize: 15, opacity: 0.92, margin: 0 }}>{area.sub}</p>
            </div>
          </div>

          <div style={{ padding: '22px clamp(20px,5vw,90px) 60px' }}>
            <Link className="btn-ghost3d" href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>← กลับหน้าหลัก</Link>
            <h4 style={{ fontSize: 19, marginBottom: 18, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}><span>🎮</span> เกมในด้านนี้</h4>
            <div className="grid3">
              {/* The play button lives in the header row rather than a footer of its own:
                  the footer used to carry a completion star, and once that went away it
                  was just a band of empty space under every card. */}
              {area.games.map((g) => (
                <button key={g.code} className="card3d unit gamecard" onClick={() => openGame(g)} style={{ borderBottomColor: '#D8CDB6' }}>
                  <div className="unit-top">
                    <span className="unit-orb" style={{ background: 'linear-gradient(135deg,#FFF0D6,#FFD98A)' }}>{g.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="unit-lbl" style={{ color: '#C58A00' }}>เกม · เล่นเลย</div>
                      <div className="unit-name">{g.th}</div>
                    </div>
                    <span className="unit-go" style={{ background: 'linear-gradient(135deg,#FFC24B,#F0982E)', boxShadow: '0 4px 0 #C97F1E' }}>▶</span>
                  </div>
                  <div className="gamecard-desc">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {game && <GameOverlay game={game} onFinish={() => finishGame(game)} />}
    </div>
  );
}
