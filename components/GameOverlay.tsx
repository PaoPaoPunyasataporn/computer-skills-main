'use client';

import { useEffect, useState } from 'react';
import type { Game } from '@/lib/content';
import Speaker from '@/components/Speaker';
import { playApplause } from '@/lib/sfx';

export type BossScore = { correct: number; total: number; percent: number };

// The warning, as one piece of spoken text — a child who cannot read it can hear
// exactly what quitting costs before deciding.
const WARN_TITLE = 'ออกจากแบบทดสอบ?';
const WARN_BODY = 'ถ้าออกตอนนี้ ความคืบหน้าทั้งหมดจะหายไป และต้องเริ่มทำแบบทดสอบใหม่ตั้งแต่ข้อแรก การออกกลางคันไม่นับว่าผ่าน และจะไม่ได้รับใบประกาศนียบัตร';

// Fullscreen overlay that embeds a self-contained mini-game (served from /public/games).
// Framing for /games/* is allowed in next.config.mjs so this same-origin iframe works.
//
// No title banner: each game renders its own heading inside the iframe, so a bar
// repeating it on top was redundant. We keep only a small floating exit button.
//
// Two very different meanings of "leaving", hence `isTest`:
//   * A practice game (isTest=false) — closing it simply ends the session and the
//     child keeps the XP for having played.
//   * The final boss fight (isTest=true) is a TEST. Quitting half-way is NOT a pass:
//     we warn that progress is lost and the test restarts from the beginning, and we
//     call onAbandon() so nothing is saved and no certificate is issued.
//     A pass is only ever signalled by the game itself, which postMessages
//     'cs-boss-complete' when the child clears it. Once that arrives the exit button
//     turns into "collect your certificate" and finishes for real.
export default function GameOverlay({
  game,
  isTest = false,
  onFinish,
  onAbandon,
}: {
  game: Game;
  isTest?: boolean;
  onClose?: () => void;
  onFinish: (score?: BossScore | null) => void;
  onAbandon?: () => void;
}) {
  const [score, setScore] = useState<BossScore | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data;
      if (d && typeof d === 'object' && d.type === 'cs-boss-complete') {
        const correct = Number(d.correct), total = Number(d.total), percent = Number(d.percent);
        if (Number.isFinite(correct) && Number.isFinite(total) && Number.isFinite(percent)) {
          // The boss fight is the authoritative pass signal. Move straight to
          // the certificate instead of leaving the child on an interim screen.
          playApplause();
          onFinish({ correct, total, percent });
        }
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [onFinish]);

  const cleared = isTest && score !== null;

  function onExitClick() {
    if (cleared) return onFinish(score);           // passed the test — go get the certificate
    if (isTest) return setConfirming(true);        // quitting mid-test — warn first
    onFinish(null);                                // practice game — just leave
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#1b1030' }}>
      <iframe src={game.file} title={game.th} style={{ width: '100%', height: '100%', border: 0, background: '#fff' }} allow="autoplay; fullscreen" />

      <button
        className="btn3d"
        onClick={onExitClick}
        title={cleared ? 'รับใบประกาศนียบัตร' : 'ออกจากเกม'}
        style={{
          position: 'fixed', top: 12, right: 12, zIndex: 210, padding: '9px 18px', fontSize: 15,
          background: cleared ? 'linear-gradient(135deg,#5CD35B,#3BA93C)' : 'linear-gradient(135deg,#FF6F6F,#DC2626)',
          boxShadow: cleared ? '0 4px 0 #2E8B30' : '0 4px 0 #A81B1B',
        }}
      >
        {cleared ? '🏅 รับใบประกาศ' : '✕ ออก'}
      </button>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(12,6,26,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div style={{ width: 'min(460px,100%)', background: '#FFFDF6', borderRadius: 22, padding: '28px 26px', textAlign: 'center', boxShadow: '0 18px 40px rgba(0,0,0,.35)', border: '3px solid #E7DFC9' }}>
            <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 10 }}>⚠️</div>

            <h3 style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 22, color: 'var(--ink)', margin: '0 0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              ออกจากแบบทดสอบ?
              <Speaker say={`${WARN_TITLE} ${WARN_BODY}`} size="sm" />
            </h3>

            <p style={{ fontFamily: 'Sarabun', fontSize: 15, lineHeight: 1.7, color: 'var(--muted2)', margin: '0 0 22px' }}>
              ถ้าออกตอนนี้ <b style={{ color: '#DC2626' }}>ความคืบหน้าทั้งหมดจะหายไป</b><br />
              และต้องเริ่มทำแบบทดสอบใหม่ตั้งแต่ข้อแรก<br />
              การออกกลางคันไม่นับว่าผ่าน และจะไม่ได้รับใบประกาศนียบัตร
            </p>

            {/* Both choices read themselves out loud, same as every answer choice in the games. */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn3d"
                onClick={() => setConfirming(false)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', fontSize: 16, background: 'linear-gradient(135deg,#5CD35B,#3BA93C)', boxShadow: '0 4px 0 #2E8B30' }}
              >
                ▶ ทำต่อ
                <Speaker say="ทำต่อ ทำแบบทดสอบต่อจากข้อเดิม" size="sm" />
              </button>
              <button
                className="btn3d"
                onClick={() => { setConfirming(false); (onAbandon ?? (() => onFinish(null)))(); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', fontSize: 16, background: 'linear-gradient(135deg,#FF6F6F,#DC2626)', boxShadow: '0 4px 0 #A81B1B' }}
              >
                ✕ ออกและเริ่มใหม่
                <Speaker say="ออกและเริ่มใหม่ ความคืบหน้าจะหายไปทั้งหมด" size="sm" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
